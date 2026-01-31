import jwt, { SignOptions, JwtPayload } from 'jsonwebtoken';
import { config } from '../config/index.js';

// Token payload types
export interface AccessTokenPayload {
  sub: string; // User ID
  email: string;
  sid: string; // Session ID
  did: string; // Device ID
}

export interface RefreshTokenPayload {
  sub: string;
  sid: string;
  family: string; // Token family for rotation detection
}

// Decoded token types (omit 'sub' from JwtPayload to avoid conflict)
export interface DecodedAccessToken extends AccessTokenPayload, Omit<JwtPayload, 'sub'> {}
export interface DecodedRefreshToken extends RefreshTokenPayload, Omit<JwtPayload, 'sub'> {}

/**
 * Generate access token (short-lived)
 */
export const generateAccessToken = (payload: AccessTokenPayload): string => {
  const options: SignOptions = {
    expiresIn: config.jwt.accessExpiresIn as jwt.SignOptions['expiresIn'],
    issuer: 'vault-protector',
    audience: 'vault-protector-client',
  };

  return jwt.sign(payload, config.jwt.accessSecret, options);
};

/**
 * Generate refresh token (long-lived)
 */
export const generateRefreshToken = (payload: RefreshTokenPayload): string => {
  const options: SignOptions = {
    expiresIn: config.jwt.refreshExpiresIn as jwt.SignOptions['expiresIn'],
    issuer: 'vault-protector',
  };

  return jwt.sign(payload, config.jwt.refreshSecret, options);
};

/**
 * Verify and decode access token
 */
export const verifyAccessToken = (token: string): DecodedAccessToken => {
  return jwt.verify(token, config.jwt.accessSecret, {
    issuer: 'vault-protector',
    audience: 'vault-protector-client',
  }) as DecodedAccessToken;
};

/**
 * Verify and decode refresh token
 */
export const verifyRefreshToken = (token: string): DecodedRefreshToken => {
  return jwt.verify(token, config.jwt.refreshSecret, {
    issuer: 'vault-protector',
  }) as DecodedRefreshToken;
};

/**
 * Decode token without verification (for debugging)
 */
export const decodeToken = (token: string): JwtPayload | null => {
  return jwt.decode(token) as JwtPayload | null;
};

/**
 * Get token expiry in seconds
 */
export const getTokenExpiry = (token: string): number | null => {
  const decoded = decodeToken(token);
  if (!decoded?.exp) return null;
  return decoded.exp - Math.floor(Date.now() / 1000);
};

/**
 * Parse expiry string to seconds
 */
export const parseExpiryToSeconds = (expiry: string): number => {
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) return 900; // Default 15 minutes

  const value = parseInt(match[1]!, 10);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value;
    case 'm':
      return value * 60;
    case 'h':
      return value * 60 * 60;
    case 'd':
      return value * 60 * 60 * 24;
    default:
      return 900;
  }
};
