import { Request } from 'express';

/**
 * Extract client IP from request (handles proxies)
 */
export const getClientIp = (req: Request): string => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0]?.trim() || req.ip || 'unknown';
  }
  return req.ip || 'unknown';
};

/**
 * Extract user agent from request
 */
export const getUserAgent = (req: Request): string => {
  return req.headers['user-agent'] || 'unknown';
};

/**
 * Parse boolean from string
 */
export const parseBoolean = (value: string | undefined): boolean => {
  if (!value) return false;
  return ['true', '1', 'yes'].includes(value.toLowerCase());
};

/**
 * Sleep for a specified duration
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Omit keys from object
 */
export const omit = <T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> => {
  const result = { ...obj };
  keys.forEach((key) => delete result[key]);
  return result;
};

/**
 * Pick keys from object
 */
export const pick = <T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> => {
  const result = {} as Pick<T, K>;
  keys.forEach((key) => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
};

/**
 * Check if value is empty (null, undefined, empty string, empty array, empty object)
 */
export const isEmpty = (value: unknown): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

/**
 * Capitalize first letter
 */
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Generate pagination metadata
 */
export const getPaginationMeta = (
  page: number,
  limit: number,
  total: number
): {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
} => {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
};

/**
 * Sanitize email (lowercase, trim)
 */
export const sanitizeEmail = (email: string): string => {
  return email.toLowerCase().trim();
};

/**
 * Mask email for display (e.g., j***@example.com)
 */
export const maskEmail = (email: string): string => {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  const masked = local.charAt(0) + '***';
  return `${masked}@${domain}`;
};

/**
 * Format date to ISO string
 */
export const toISOString = (date: Date | string | number): string => {
  return new Date(date).toISOString();
};
