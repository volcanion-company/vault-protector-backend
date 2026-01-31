import { Types } from 'mongoose';
import { Device, type IDevice } from '../../models/device.model.js';
import { Session } from '../../models/session.model.js';
import { AuditLog } from '../../models/audit-log.model.js';
import { redis } from '../../lib/redis.js';
import { parseExpiryToSeconds } from '../../lib/jwt.js';
import { config } from '../../config/index.js';
import { ApiError } from '../../utils/api-error.js';
import { REDIS_KEYS, AUDIT_ACTIONS } from '../../utils/constants.js';
import type { DevicePlatform } from '../../types/global.js';

export interface DeviceInfo {
  id: string;
  name: string;
  platform: DevicePlatform;
  trusted: boolean;
  lastSeenAt: string;
  lastIpAddress: string;
  createdAt: string;
}

class DevicesService {
  /**
   * Get all devices for a user (deduplicated by name + platform)
   * When multiple devices have the same name and platform, only the most recently active one is returned
   */
  async getDevices(userId: string): Promise<DeviceInfo[]> {
    const devices = await Device.find({
      userId: new Types.ObjectId(userId),
    }).sort({ lastSeenAt: -1 });

    // Deduplicate devices by name + platform, keeping the most recently active one
    const deviceMap = new Map<string, IDevice>();
    
    for (const device of devices) {
      const key = `${device.name.toLowerCase()}|${device.platform}`;
      
      if (!deviceMap.has(key)) {
        deviceMap.set(key, device);
      }
      // Since we sorted by lastSeenAt DESC, first occurrence is the most recent
    }

    return Array.from(deviceMap.values()).map((device) => ({
      id: device._id.toString(),
      name: device.name,
      platform: device.platform,
      trusted: device.trusted,
      lastSeenAt: device.lastSeenAt.toISOString(),
      lastIpAddress: device.lastIpAddress,
      createdAt: device.createdAt.toISOString(),
    }));
  }

  /**
   * Cleanup duplicate devices for a user
   * Keeps the most recently active device for each name + platform combination
   * Revokes sessions and deletes older duplicates
   */
  async cleanupDuplicateDevices(
    userId: string,
    context: { ipAddress: string; userAgent: string }
  ): Promise<{ deletedCount: number }> {
    const userObjectId = new Types.ObjectId(userId);
    const devices = await Device.find({ userId: userObjectId }).sort({ lastSeenAt: -1 });

    // Group devices by name + platform
    const deviceGroups = new Map<string, IDevice[]>();
    
    for (const device of devices) {
      const key = `${device.name.toLowerCase()}|${device.platform}`;
      const group = deviceGroups.get(key) || [];
      group.push(device);
      deviceGroups.set(key, group);
    }

    let deletedCount = 0;

    // For each group with duplicates, keep first (most recent) and delete rest
    for (const [, group] of deviceGroups) {
      if (group.length <= 1) continue;

      // Skip the first one (most recent), delete the rest
      const devicesToDelete = group.slice(1);
      
      for (const device of devicesToDelete) {
        // Revoke all sessions for this device
        const sessions = await Session.find({
          userId: userObjectId,
          deviceId: device._id,
        });

        for (const session of sessions) {
          // Invalidate tokens in Redis
          const refreshExpirySeconds = parseExpiryToSeconds(config.jwt.refreshExpiresIn);
          await redis.setex(
            `${REDIS_KEYS.BLACKLIST}${session._id.toString()}`,
            refreshExpirySeconds,
            'revoked'
          );
          await session.deleteOne();
        }

        // Delete the device
        await device.deleteOne();
        deletedCount++;

        // Log the cleanup
        await AuditLog.create({
          userId: userObjectId,
          action: AUDIT_ACTIONS.DEVICE.REMOVE,
          status: 'success',
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          metadata: {
            deviceId: device._id.toString(),
            reason: 'duplicate_cleanup',
          },
        });
      }
    }

    return { deletedCount };
  }

  /**
   * Update device name
   */
  async updateDevice(
    userId: string,
    deviceId: string,
    name: string
  ): Promise<DeviceInfo> {
    const device = await Device.findOne({
      _id: new Types.ObjectId(deviceId),
      userId: new Types.ObjectId(userId),
    });

    if (!device) {
      throw ApiError.notFound('Device not found');
    }

    device.name = name;
    await device.save();

    return {
      id: device._id.toString(),
      name: device.name,
      platform: device.platform,
      trusted: device.trusted,
      lastSeenAt: device.lastSeenAt.toISOString(),
      lastIpAddress: device.lastIpAddress,
      createdAt: device.createdAt.toISOString(),
    };
  }

  /**
   * Delete a device (and revoke all its sessions)
   */
  async deleteDevice(
    userId: string,
    deviceId: string,
    currentDeviceId: string,
    context: { ipAddress: string; userAgent: string }
  ): Promise<void> {
    const userObjectId = new Types.ObjectId(userId);
    const deviceObjectId = new Types.ObjectId(deviceId);

    const device = await Device.findOne({
      _id: deviceObjectId,
      userId: userObjectId,
    });

    if (!device) {
      throw ApiError.notFound('Device not found');
    }

    // Prevent deleting current device
    if (deviceId === currentDeviceId) {
      throw ApiError.badRequest('Cannot delete current device. Use logout instead.');
    }

    // Revoke all sessions for this device
    const sessions = await Session.find({
      deviceId: deviceObjectId,
      revokedAt: { $exists: false },
    });

    for (const session of sessions) {
      session.revokedAt = new Date();
      session.revokedReason = 'Device removed';
      await session.save();

      // Blacklist in Redis
      await redis.setex(
        `${REDIS_KEYS.BLACKLIST}${session._id.toString()}`,
        parseExpiryToSeconds(config.jwt.accessExpiresIn),
        '1'
      );
    }

    // Delete device
    await Device.deleteOne({ _id: deviceObjectId });

    // Log audit
    await this.logAudit(userId, AUDIT_ACTIONS.DEVICE.REMOVE, {
      ...context,
      removedDeviceId: deviceId,
      deviceName: device.name,
      platform: device.platform,
    });
  }

  /**
   * Mark device as trusted
   */
  async trustDevice(
    userId: string,
    deviceId: string,
    context: { ipAddress: string; userAgent: string }
  ): Promise<DeviceInfo> {
    const device = await Device.findOne({
      _id: new Types.ObjectId(deviceId),
      userId: new Types.ObjectId(userId),
    });

    if (!device) {
      throw ApiError.notFound('Device not found');
    }

    device.trusted = true;
    await device.save();

    // Log audit
    await this.logAudit(userId, AUDIT_ACTIONS.DEVICE.TRUST, {
      ...context,
      trustedDeviceId: deviceId,
    });

    return {
      id: device._id.toString(),
      name: device.name,
      platform: device.platform,
      trusted: device.trusted,
      lastSeenAt: device.lastSeenAt.toISOString(),
      lastIpAddress: device.lastIpAddress,
      createdAt: device.createdAt.toISOString(),
    };
  }

  private async logAudit(
    userId: string,
    action: string,
    metadata: Record<string, unknown>
  ): Promise<void> {
    try {
      await AuditLog.create({
        userId: new Types.ObjectId(userId),
        action,
        status: 'success',
        metadata,
      });
    } catch (error) {
      console.error('Audit log failed:', error);
    }
  }
}

export const devicesService = new DevicesService();
