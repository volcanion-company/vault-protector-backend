import { Types } from 'mongoose';
import { User, type IUser } from '../../models/user.model.js';
import { Vault } from '../../models/vault.model.js';
import { Session } from '../../models/session.model.js';
import { Device } from '../../models/device.model.js';
import { AuditLog, type IAuditLog } from '../../models/audit-log.model.js';
import { verifyAuthVerifier } from '../../lib/password.js';
import { redis } from '../../lib/redis.js';
import { parseExpiryToSeconds } from '../../lib/jwt.js';
import { config } from '../../config/index.js';
import { ApiError } from '../../utils/api-error.js';
import { REDIS_KEYS } from '../../utils/constants.js';
import type { AuditAction } from '../../types/global.js';

export interface UserProfile {
  id: string;
  email: string;
  emailVerified: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface AuditLogEntry {
  id: string;
  action: AuditAction;
  status: 'success' | 'failure';
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

export interface PaginatedAuditLogs {
  logs: AuditLogEntry[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

class UsersService {
  /**
   * Get current user profile
   */
  async getProfile(userId: string): Promise<UserProfile> {
    const user = await User.findById(userId).select(
      'email emailVerified createdAt lastLoginAt'
    );

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    return {
      id: user._id.toString(),
      email: user.email,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt.toISOString(),
      lastLoginAt: user.lastLoginAt?.toISOString() || null,
    };
  }

  /**
   * Get user's audit logs
   */
  async getAuditLogs(
    userId: string,
    page: number,
    limit: number,
    action?: string
  ): Promise<PaginatedAuditLogs> {
    const query: Record<string, unknown> = {
      userId: new Types.ObjectId(userId),
    };

    if (action) {
      query.action = action;
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(query),
    ]);

    return {
      logs: logs.map((log) => ({
        id: log._id.toString(),
        action: log.action as AuditAction,
        status: log.status,
        ipAddress: (log.metadata as { ipAddress?: string })?.ipAddress || 'unknown',
        userAgent: (log.metadata as { userAgent?: string })?.userAgent || 'unknown',
        createdAt: log.createdAt.toISOString(),
      })),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Delete user account
   */
  async deleteAccount(
    userId: string,
    authVerifier: string,
    context: { ipAddress: string; userAgent: string }
  ): Promise<void> {
    const user = await User.findById(userId);

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    // Verify password
    const isValid = await verifyAuthVerifier(authVerifier, user.auth.verifierHash);
    if (!isValid) {
      throw ApiError.unauthorized('Invalid password');
    }

    const userObjectId = new Types.ObjectId(userId);

    // Revoke all sessions first
    const sessions = await Session.find({
      userId: userObjectId,
      revokedAt: { $exists: false },
    });

    for (const session of sessions) {
      await redis.setex(
        `${REDIS_KEYS.BLACKLIST}${session._id.toString()}`,
        parseExpiryToSeconds(config.jwt.accessExpiresIn),
        '1'
      );
    }

    // Delete user data
    await Promise.all([
      Session.deleteMany({ userId: userObjectId }),
      Device.deleteMany({ userId: userObjectId }),
      Vault.deleteOne({ userId: userObjectId }),
      // Keep audit logs for security purposes, but anonymize
      AuditLog.updateMany(
        { userId: userObjectId },
        { $set: { userId: null, 'metadata.email': '[deleted]' } }
      ),
    ]);

    // Delete user
    await User.deleteOne({ _id: userObjectId });

    // Clear prelogin cache
    await redis.del(`${REDIS_KEYS.PRELOGIN}${user.email}`);
  }
}

export const usersService = new UsersService();
