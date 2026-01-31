import { z } from 'zod';
import { DEVICE_PLATFORMS, VAULT } from '../../utils/constants.js';

// Device info schema (reusable)
const deviceSchema = z.object({
  name: z.string().min(1).max(100),
  platform: z.enum(DEVICE_PLATFORMS),
  deviceIdentifier: z.string().min(1).max(256),
});

// KDF parameters schema
const kdfSchema = z.object({
  algorithm: z.enum(['argon2id', 'pbkdf2']),
  salt: z.string().min(1), // Base64 encoded
  memory: z.number().int().min(0).max(1048576), // 0 for PBKDF2, up to 1GB for Argon2id
  iterations: z.number().int().min(1).max(1000000), // Up to 1M for PBKDF2 (OWASP: 600k)
  parallelism: z.number().int().min(1).max(16),
});

// Encryption metadata schema
const encryptionSchema = z.object({
  algorithm: z.enum(VAULT.SUPPORTED_ALGORITHMS),
  iv: z.string().min(1),
  authTag: z.string().min(1),
});

// Initial vault schema
const initialVaultSchema = z.object({
  blob: z.string().min(1),
  encryption: encryptionSchema,
  checksum: z.string().min(1),
});

/**
 * Register request DTO
 * Note: wrappedVaultKey and initialVault are optional - 
 * Master Password can be set after registration
 */
export const registerDto = z.object({
  email: z.string().email('Invalid email format').toLowerCase().trim(),
  authVerifier: z.string().min(1, 'Auth verifier is required'),
  kdf: kdfSchema,
  wrappedVaultKey: z.string().min(1).optional(), // Optional - set when Master Password is created
  initialVault: initialVaultSchema.optional(), // Optional - created when Master Password is set
  device: deviceSchema,
});

export type RegisterDto = z.infer<typeof registerDto>;

/**
 * Login request DTO
 */
export const loginDto = z.object({
  email: z.string().email('Invalid email format').toLowerCase().trim(),
  authVerifier: z.string().min(1, 'Auth verifier is required'),
  device: deviceSchema,
});

export type LoginDto = z.infer<typeof loginDto>;

/**
 * Prelogin query DTO
 */
export const preloginQueryDto = z.object({
  email: z.string().email('Invalid email format').toLowerCase().trim(),
});

export type PreloginQueryDto = z.infer<typeof preloginQueryDto>;

/**
 * Refresh token request DTO
 */
export const refreshTokenDto = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export type RefreshTokenDto = z.infer<typeof refreshTokenDto>;

/**
 * Change password request DTO
 */
export const changePasswordDto = z.object({
  currentAuthVerifier: z.string().min(1, 'Current auth verifier is required'),
  newAuthVerifier: z.string().min(1, 'New auth verifier is required'),
  newWrappedVaultKey: z.string().min(1, 'New wrapped vault key is required'),
  newKdf: kdfSchema.optional(),
});

export type ChangePasswordDto = z.infer<typeof changePasswordDto>;

/**
 * Verify email request DTO
 */
export const verifyEmailDto = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

export type VerifyEmailDto = z.infer<typeof verifyEmailDto>;

/**
 * Forgot password request DTO
 */
export const forgotPasswordDto = z.object({
  email: z.string().email('Invalid email format').toLowerCase().trim(),
});

export type ForgotPasswordDto = z.infer<typeof forgotPasswordDto>;

/**
 * Reset password request DTO
 */
export const resetPasswordDto = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newAuthVerifier: z.string().min(1, 'New auth verifier is required'),
  newWrappedVaultKey: z.string().min(1, 'New wrapped vault key is required'),
  newKdf: kdfSchema,
});

export type ResetPasswordDto = z.infer<typeof resetPasswordDto>;

/**
 * Set Master Password request DTO
 * Used after registration when user wants to set up their vault
 */
export const setMasterPasswordDto = z.object({
  wrappedVaultKey: z.string().min(1, 'Wrapped vault key is required'),
  initialVault: initialVaultSchema,
});

export type SetMasterPasswordDto = z.infer<typeof setMasterPasswordDto>;
