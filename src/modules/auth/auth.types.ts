import { Types } from 'mongoose';
import type { DevicePlatform, KdfAlgorithm, EncryptionAlgorithm } from '../../types/global.js';

// Token pair returned after authentication
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
}

// User info in auth responses
export interface AuthUserInfo {
  id: string;
  email: string;
  emailVerified: boolean;
  hasMasterPassword?: boolean;
}

// Device info in auth responses
export interface AuthDeviceInfo {
  id: string;
  name: string;
  isNew: boolean;
}

// Register result
export interface RegisterResult {
  user: AuthUserInfo;
  tokens: TokenPair;
  device: AuthDeviceInfo;
}

// Login result
export interface LoginResult {
  user: AuthUserInfo;
  tokens: TokenPair;
  wrappedVaultKey: string | null;
  device: AuthDeviceInfo;
}

// Prelogin result
export interface PreloginResult {
  kdf: {
    algorithm: KdfAlgorithm;
    salt: string;
    memory: number;
    iterations: number;
    parallelism: number;
  };
}

// Refresh token result
export interface RefreshResult {
  tokens: TokenPair;
}

// Session context for audit logging
export interface SessionContext {
  ipAddress: string;
  userAgent: string;
  deviceId?: string;
  sessionId?: string;
  [key: string]: unknown; // Allow additional properties
}

// Device registration data
export interface DeviceRegistration {
  name: string;
  platform: DevicePlatform;
  deviceIdentifier: string;
}

// KDF configuration
export interface KdfConfig {
  algorithm: KdfAlgorithm;
  salt: string;
  memory: number;
  iterations: number;
  parallelism: number;
}

// Initial vault data
export interface InitialVaultData {
  blob: string;
  encryption: {
    algorithm: EncryptionAlgorithm;
    iv: string;
    authTag: string; // API uses authTag, mapped to tag in database
  };
  checksum: string;
}

// Internal session data
export interface SessionData {
  userId: Types.ObjectId;
  deviceId: Types.ObjectId;
  sessionId: Types.ObjectId;
  accessTokenFamily: string;
}
