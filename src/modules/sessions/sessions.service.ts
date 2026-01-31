import { Types } from 'mongoose';
import { Session, type ISession } from '../../models/session.model.js';
import { Device } from '../../models/device.model.js';
import { AuditLog } from '../../models/audit-log.model.js';
import { redis } from '../../lib/redis.js';
import { parseExpiryToSeconds } from '../../lib/jwt.js';
import { config } from '../../config/index.js';
import { ApiError } from '../../utils/api-error.js';
import { REDIS_KEYS, AUDIT_ACTIONS } from '../../utils/constants.js';
import type { DevicePlatform } from '../../types/global.js';

export interface SessionInfo {
  id: string;
  device: {
    id: string;
    name: string;
    platform: DevicePlatform;
  };
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  lastActivityAt: string;
  isCurrent: boolean;
}

class SessionsService {
  /**
   * Get all active sessions for a user
   */
  async getSessions(userId: string, currentSessionId: string): Promise<SessionInfo[]> {
    const sessions = await Session.find({
      userId: new Types.ObjectId(userId),
      revokedAt: { $exists: false },
      expiresAt: { $gt: new Date() },
    })
      .populate('deviceId')
      .sort({ lastActivityAt: -1 });

    return sessions.map((session) => {
      const device = session.deviceId as unknown as {
        _id: Types.ObjectId;
        name: string;
        platform: DevicePlatform;
      };

      return {
        id: session._id.toString(),
        device: {
          id: device._id.toString(),
          name: device.name,
          platform: device.platform,
        },
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        createdAt: session.createdAt.toISOString(),
        lastActivityAt: session.lastActivityAt.toISOString(),
        isCurrent: session._id.toString() === currentSessionId,
      };
    });
  }

  /**
   * Revoke a specific session
   */
  async revokeSession(
    userId: string,
    sessionId: string,
    currentSessionId: string,
    context: { ipAddress: string; userAgent: string }
  ): Promise<void> {
    const session = await Session.findOne({
      _id: new Types.ObjectId(sessionId),
      userId: new Types.ObjectId(userId),
    });

    if (!session) {
      throw ApiError.notFound('Session not found');
    }

    // Prevent revoking current session via this endpoint
    if (sessionId === currentSessionId) {
      throw ApiError.badRequest('Cannot revoke current session. Use logout instead.');
    }

    // Revoke session
    session.revokedAt = new Date();
    session.revokedReason = 'Revoked by user';
    await session.save();

    // Blacklist in Redis
    await redis.setex(
      `${REDIS_KEYS.BLACKLIST}${sessionId}`,
      parseExpiryToSeconds(config.jwt.accessExpiresIn),
      '1'
    );

    // Log audit
    await this.logAudit(userId, AUDIT_ACTIONS.SESSION.REVOKE, {
      ...context,
      revokedSessionId: sessionId,
    });
  }

  /**
   * Revoke all sessions except current
   */
  async revokeAllSessions(
    userId: string,
    currentSessionId: string,
    context: { ipAddress: string; userAgent: string }
  ): Promise<number> {
    const sessions = await Session.find({
      userId: new Types.ObjectId(userId),
      _id: { $ne: new Types.ObjectId(currentSessionId) },
      revokedAt: { $exists: false },
    });

    let revokedCount = 0;

    for (const session of sessions) {
      session.revokedAt = new Date();
      session.revokedReason = 'Revoked all sessions';
      await session.save();

      // Blacklist in Redis
      await redis.setex(
        `${REDIS_KEYS.BLACKLIST}${session._id.toString()}`,
        parseExpiryToSeconds(config.jwt.accessExpiresIn),
        '1'
      );

      revokedCount++;
    }

    // Log audit
    await this.logAudit(userId, AUDIT_ACTIONS.SESSION.REVOKE, {
      ...context,
      action: 'revoke_all',
      revokedCount,
    });

    return revokedCount;
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

export const sessionsService = new SessionsService();
