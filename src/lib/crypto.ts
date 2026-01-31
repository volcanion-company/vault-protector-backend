import crypto from 'crypto';

/**
 * Generate cryptographically secure random bytes as base64
 */
export const generateRandomBytes = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('base64');
};

/**
 * Generate a secure random token (URL-safe)
 */
export const generateSecureToken = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('base64url');
};

/**
 * Generate UUID v4
 */
export const generateUUID = (): string => {
  return crypto.randomUUID();
};

/**
 * SHA-256 hash
 */
export const sha256 = (data: string): string => {
  return crypto.createHash('sha256').update(data).digest('hex');
};

/**
 * SHA-256 hash as base64
 */
export const sha256Base64 = (data: string): string => {
  return crypto.createHash('sha256').update(data).digest('base64');
};

/**
 * HMAC-SHA256
 */
export const hmacSha256 = (data: string, key: string): string => {
  return crypto.createHmac('sha256', key).update(data).digest('hex');
};

/**
 * Constant-time string comparison to prevent timing attacks
 */
export const secureCompare = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
};

/**
 * Hash a token for storage (e.g., refresh tokens)
 */
export const hashToken = (token: string): string => {
  return sha256(token);
};

/**
 * Generate email verification token
 */
export const generateVerificationToken = (): {
  token: string;
  hash: string;
  expires: Date;
} => {
  const token = generateSecureToken(32);
  const hash = sha256(token);
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  return { token, hash, expires };
};

/**
 * Generate password reset token
 */
export const generatePasswordResetToken = (): {
  token: string;
  hash: string;
  expires: Date;
} => {
  const token = generateSecureToken(32);
  const hash = sha256(token);
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  return { token, hash, expires };
};
