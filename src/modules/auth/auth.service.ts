import { Types } from 'mongoose';
import { User, type IUser } from '../../models/user.model.js';
import { Vault } from '../../models/vault.model.js';
import { Session } from '../../models/session.model.js';
import { Device, type IDevice } from '../../models/device.model.js';
import { AuditLog } from '../../models/audit-log.model.js';
import { hashAuthVerifier, verifyAuthVerifier } from '../../lib/password.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  parseExpiryToSeconds,
} from '../../lib/jwt.js';
import { generateUUID, hashToken, sha256 } from '../../lib/crypto.js';
import { redis, redisHelpers } from '../../lib/redis.js';
import { config } from '../../config/index.js';
import { ApiError } from '../../utils/api-error.js';
import { REDIS_KEYS, SECURITY, AUDIT_ACTIONS } from '../../utils/constants.js';
import type {
  RegisterResult,
  LoginResult,
  PreloginResult,
  RefreshResult,
  TokenPair,
  SessionContext,
  DeviceRegistration,
  KdfConfig,
  InitialVaultData,
  SessionData,
} from './auth.types.js';

class AuthService {
  /**
   * Register a new user
   * Note: wrappedVaultKey and initialVault are optional - Master Password can be set after registration
   */
  async register(
    email: string,
    authVerifier: string,
    kdf: KdfConfig,
    wrappedVaultKey: string | undefined,
    initialVault: InitialVaultData | undefined,
    deviceInfo: DeviceRegistration,
    context: SessionContext
  ): Promise<RegisterResult> {
    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw ApiError.conflict('Email already registered');
    }

    // Hash the auth verifier
    const verifierHash = await hashAuthVerifier(authVerifier);

    // Determine if Master Password is being set during registration
    const hasMasterPassword = !!(wrappedVaultKey && initialVault);

    // Create user
    const user = await User.create({
      email,
      auth: {
        verifierHash,
        algorithm: 'argon2id',
        version: 1,
      },
      kdf,
      wrappedVaultKey: wrappedVaultKey || null,
      hasMasterPassword,
    });

    // Create initial vault only if Master Password was provided
    if (hasMasterPassword && initialVault) {
      await Vault.create({
        userId: user._id,
        blob: initialVault.blob,
        encryption: {
          algorithm: initialVault.encryption.algorithm,
          iv: initialVault.encryption.iv,
          tag: initialVault.encryption.authTag, // Map authTag (API) to tag (DB)
        },
        checksum: initialVault.checksum,
        version: 1,
        blobFormatVersion: 1,
      });
    }

    // Create device
    const device = await this.findOrCreateDevice(user._id, deviceInfo, context.ipAddress);
    const isNewDevice = device.createdAt.getTime() === device.updatedAt.getTime();

    // Create session and tokens
    const { tokens, sessionId } = await this.createSession(user._id, device._id, context);

    // Log audit
    await this.logAudit(AUDIT_ACTIONS.USER.REGISTER, 'success', user._id, {
      ...context,
      deviceId: device._id.toString(),
      sessionId: sessionId.toString(),
    });

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        emailVerified: user.emailVerified,
        hasMasterPassword,
      },
      tokens,
      device: {
        id: device._id.toString(),
        name: device.name,
        isNew: isNewDevice,
      },
    };
  }

  /**
   * Get KDF parameters for prelogin
   */
  async prelogin(email: string): Promise<PreloginResult> {
    // Check cache first
    const cached = await redis.get(`${REDIS_KEYS.PRELOGIN}${email}`);
    if (cached) {
      return JSON.parse(cached) as PreloginResult;
    }

    const user = await User.findOne({ email }).select('kdf');
    if (!user) {
      // Return fake KDF params to prevent email enumeration
      // Use consistent fake params based on email hash for timing attack prevention
      const fakeResult: PreloginResult = {
        kdf: {
          algorithm: 'argon2id',
          salt: sha256(email + 'fake-salt').slice(0, 32),
          memory: 65536,
          iterations: 3,
          parallelism: 4,
        },
      };
      return fakeResult;
    }

    const result: PreloginResult = {
      kdf: {
        algorithm: user.kdf.algorithm as 'argon2id',
        salt: user.kdf.salt,
        memory: user.kdf.memory,
        iterations: user.kdf.iterations,
        parallelism: user.kdf.parallelism,
      },
    };

    // Cache for 5 minutes
    await redis.setex(`${REDIS_KEYS.PRELOGIN}${email}`, 300, JSON.stringify(result));

    return result;
  }

  /**
   * Login user
   */
  async login(
    email: string,
    authVerifier: string,
    deviceInfo: DeviceRegistration,
    context: SessionContext
  ): Promise<LoginResult> {
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      // Prevent timing attacks
      await hashAuthVerifier(authVerifier);
      throw ApiError.unauthorized('Invalid email or password');
    }

    // Check if account is locked
    if (user.isLocked()) {
      await this.logAudit(AUDIT_ACTIONS.USER.LOGIN_FAILED, 'failure', user._id, {
        ...context,
        reason: 'Account locked',
      });
      throw ApiError.forbidden('Account is locked. Please try again later.');
    }

    // Verify auth verifier
    const isValid = await verifyAuthVerifier(authVerifier, user.auth.verifierHash);
    if (!isValid) {
      await user.incrementFailedAttempts();
      await this.logAudit(AUDIT_ACTIONS.USER.LOGIN_FAILED, 'failure', user._id, {
        ...context,
        reason: 'Invalid password',
      });
      throw ApiError.unauthorized('Invalid email or password');
    }

    // Reset failed attempts on successful login
    await user.resetFailedAttempts();

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    // Find or create device
    const device = await this.findOrCreateDevice(user._id, deviceInfo, context.ipAddress);
    const isNewDevice = Date.now() - device.createdAt.getTime() < 60000; // Created within last minute

    // Create session and tokens
    const { tokens, sessionId } = await this.createSession(user._id, device._id, context);

    // Log audit
    await this.logAudit(AUDIT_ACTIONS.USER.LOGIN, 'success', user._id, {
      ...context,
      deviceId: device._id.toString(),
      sessionId: sessionId.toString(),
    });

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        emailVerified: user.emailVerified,
        hasMasterPassword: user.hasMasterPassword,
      },
      tokens,
      wrappedVaultKey: user.wrappedVaultKey || null,
      device: {
        id: device._id.toString(),
        name: device.name,
        isNew: isNewDevice,
      },
    };
  }

  /**
   * Refresh access token
   */
  async refresh(refreshToken: string): Promise<RefreshResult> {
    // Verify refresh token
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw ApiError.unauthorized('Invalid refresh token');
    }

    // Find session
    const session = await Session.findById(payload.sid);
    if (!session) {
      throw ApiError.unauthorized('Session not found');
    }

    // Check if session is valid
    if (session.revokedAt || session.expiresAt < new Date()) {
      throw ApiError.unauthorized('Session expired or revoked');
    }

    // Verify token hash matches
    const tokenHash = hashToken(refreshToken);
    if (session.refreshTokenHash !== tokenHash) {
      // Possible token reuse attack - revoke entire token family
      await this.revokeTokenFamily(session.accessTokenFamily, 'Token reuse detected');
      throw ApiError.unauthorized('Invalid refresh token');
    }

    // Find user
    const user = await User.findById(session.userId);
    if (!user) {
      throw ApiError.unauthorized('User not found');
    }

    // Generate new tokens (token rotation)
    const tokens = await this.rotateTokens(session, user);

    return { tokens };
  }

  /**
   * Logout user (revoke session)
   */
  async logout(sessionId: string, context: SessionContext): Promise<void> {
    const session = await Session.findById(sessionId);
    if (!session) {
      return; // Session already doesn't exist
    }

    // Revoke session
    session.revokedAt = new Date();
    session.revokedReason = 'User logout';
    await session.save();

    // Blacklist the session in Redis
    await redis.setex(
      `${REDIS_KEYS.BLACKLIST}${sessionId}`,
      parseExpiryToSeconds(config.jwt.accessExpiresIn),
      '1'
    );

    // Log audit
    await this.logAudit(AUDIT_ACTIONS.USER.LOGOUT, 'success', session.userId, {
      ...context,
      sessionId,
    });
  }

  /**
   * Change password
   */
  async changePassword(
    userId: string,
    currentAuthVerifier: string,
    newAuthVerifier: string,
    newWrappedVaultKey: string,
    newKdf: KdfConfig | undefined,
    context: SessionContext
  ): Promise<void> {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    // Verify current password
    const isValid = await verifyAuthVerifier(currentAuthVerifier, user.auth.verifierHash);
    if (!isValid) {
      throw ApiError.unauthorized('Current password is incorrect');
    }

    // Hash new auth verifier
    const newVerifierHash = await hashAuthVerifier(newAuthVerifier);

    // Update user
    user.auth.verifierHash = newVerifierHash;
    user.wrappedVaultKey = newWrappedVaultKey;
    user.passwordChangedAt = new Date();

    if (newKdf) {
      user.kdf = newKdf;
      // Invalidate prelogin cache
      await redis.del(`${REDIS_KEYS.PRELOGIN}${user.email}`);
    }

    await user.save();

    // Revoke all other sessions
    await this.revokeAllSessions(user._id, context.sessionId, 'Password changed');

    // Log audit
    await this.logAudit(AUDIT_ACTIONS.USER.PASSWORD_CHANGE, 'success', user._id, context);
  }

  /**
   * Set Master Password for users who registered without one
   * Creates the vault key and initial vault
   */
  async setMasterPassword(
    userId: string,
    wrappedVaultKey: string,
    initialVault: InitialVaultData,
    context: SessionContext
  ): Promise<{ success: boolean }> {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    // Check if Master Password already set
    if (user.hasMasterPassword) {
      throw ApiError.conflict('Master Password is already set');
    }

    // Update user with wrapped vault key
    user.wrappedVaultKey = wrappedVaultKey;
    user.hasMasterPassword = true;
    await user.save();

    // Create initial vault
    await Vault.create({
      userId: user._id,
      blob: initialVault.blob,
      encryption: {
        algorithm: initialVault.encryption.algorithm,
        iv: initialVault.encryption.iv,
        tag: initialVault.encryption.authTag,
      },
      checksum: initialVault.checksum,
      version: 1,
      blobFormatVersion: 1,
    });

    // Log audit
    await this.logAudit(AUDIT_ACTIONS.USER.PASSWORD_CHANGE, 'success', user._id, {
      ...context,
      action: 'Master Password set',
    });

    return { success: true };
  }

  // ============ Private Helper Methods ============

  private async findOrCreateDevice(
    userId: Types.ObjectId,
    deviceInfo: DeviceRegistration,
    ipAddress: string
  ): Promise<IDevice> {
    const deviceIdentifierHash = sha256(deviceInfo.deviceIdentifier);

    let device = await Device.findOne({
      userId,
      deviceIdentifier: deviceIdentifierHash,
    });

    if (device) {
      // Update last seen
      device.lastSeenAt = new Date();
      device.lastIpAddress = ipAddress;
      device.name = deviceInfo.name; // Update name in case user changed it
      await device.save();
    } else {
      // Create new device
      device = await Device.create({
        userId,
        name: deviceInfo.name,
        platform: deviceInfo.platform,
        deviceIdentifier: deviceIdentifierHash,
        lastIpAddress: ipAddress,
      });

      // Log device addition
      await this.logAudit(AUDIT_ACTIONS.DEVICE.ADD, 'success', userId, {
        ipAddress,
        userAgent: '',
        deviceId: device._id.toString(),
        platform: deviceInfo.platform,
      });
    }

    return device;
  }

  private async createSession(
    userId: Types.ObjectId,
    deviceId: Types.ObjectId,
    context: SessionContext
  ): Promise<{ tokens: TokenPair; sessionId: Types.ObjectId }> {
    const accessTokenFamily = generateUUID();
    const refreshToken = generateRefreshToken({
      sub: userId.toString(),
      sid: '', // Will be set after session creation
      family: accessTokenFamily,
    });

    const refreshTokenHash = hashToken(refreshToken);
    const expiresAt = new Date(
      Date.now() + parseExpiryToSeconds(config.jwt.refreshExpiresIn) * 1000
    );

    // Create session
    const session = await Session.create({
      userId,
      deviceId,
      refreshTokenHash,
      accessTokenFamily,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      expiresAt,
    });

    // Now generate the actual refresh token with session ID
    const finalRefreshToken = generateRefreshToken({
      sub: userId.toString(),
      sid: session._id.toString(),
      family: accessTokenFamily,
    });

    // Update session with correct hash
    session.refreshTokenHash = hashToken(finalRefreshToken);
    await session.save();

    // Get user for access token
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.internal('User not found during session creation');
    }

    const accessToken = generateAccessToken({
      sub: userId.toString(),
      email: user.email,
      sid: session._id.toString(),
      did: deviceId.toString(),
    });

    return {
      tokens: {
        accessToken,
        refreshToken: finalRefreshToken,
        expiresIn: parseExpiryToSeconds(config.jwt.accessExpiresIn),
      },
      sessionId: session._id,
    };
  }

  private async rotateTokens(session: typeof Session.prototype, user: IUser): Promise<TokenPair> {
    // Generate new refresh token
    const newRefreshToken = generateRefreshToken({
      sub: user._id.toString(),
      sid: session._id.toString(),
      family: session.accessTokenFamily,
    });

    // Update session with new token hash
    session.refreshTokenHash = hashToken(newRefreshToken);
    session.lastActivityAt = new Date();
    await session.save();

    // Generate new access token
    const accessToken = generateAccessToken({
      sub: user._id.toString(),
      email: user.email,
      sid: session._id.toString(),
      did: session.deviceId.toString(),
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn: parseExpiryToSeconds(config.jwt.accessExpiresIn),
    };
  }

  private async revokeTokenFamily(family: string, reason: string): Promise<void> {
    await Session.updateMany(
      { accessTokenFamily: family },
      {
        revokedAt: new Date(),
        revokedReason: reason,
      }
    );
  }

  private async revokeAllSessions(
    userId: Types.ObjectId,
    exceptSessionId?: string,
    reason: string = 'User request'
  ): Promise<void> {
    const query: Record<string, unknown> = {
      userId,
      revokedAt: { $exists: false },
    };

    if (exceptSessionId) {
      query._id = { $ne: new Types.ObjectId(exceptSessionId) };
    }

    const sessions = await Session.find(query);

    for (const session of sessions) {
      session.revokedAt = new Date();
      session.revokedReason = reason;
      await session.save();

      // Blacklist in Redis
      await redis.setex(
        `${REDIS_KEYS.BLACKLIST}${session._id.toString()}`,
        parseExpiryToSeconds(config.jwt.accessExpiresIn),
        '1'
      );
    }
  }

  private async logAudit(
    action: string,
    status: 'success' | 'failure',
    userId: Types.ObjectId | undefined,
    context: SessionContext
  ): Promise<void> {
    try {
      await AuditLog.create({
        userId,
        action,
        status,
        metadata: { ...context },
      });
    } catch (error) {
      // Don't fail the main operation if audit logging fails
      console.error('Audit log failed:', error);
    }
  }
}

export const authService = new AuthService();
