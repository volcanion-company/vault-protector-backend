import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../lib/jwt.js';
import { redis } from '../lib/redis.js';
import { ApiError } from '../utils/api-error.js';
import { REDIS_KEYS } from '../utils/constants.js';
import type { AuthenticatedRequest } from '../types/express.js';

/**
 * Authentication middleware
 * Verifies JWT access token and attaches user to request
 */
export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 1. Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Missing authentication token');
    }

    const token = authHeader.slice(7);
    if (!token) {
      throw ApiError.unauthorized('Invalid authentication token');
    }

    // 2. Verify JWT
    const payload = verifyAccessToken(token);

    // 3. Check if session is blacklisted (revoked)
    const isBlacklisted = await redis.get(`${REDIS_KEYS.BLACKLIST}${payload.sid}`);
    if (isBlacklisted) {
      throw ApiError.unauthorized('Session has been revoked');
    }

    // 4. Attach user info to request
    (req as AuthenticatedRequest).user = {
      id: payload.sub,
      email: payload.email,
      sessionId: payload.sid,
      deviceId: payload.did,
    };

    // 5. Update session activity (non-blocking)
    redis
      .setex(`${REDIS_KEYS.SESSION.ACTIVITY}${payload.sid}`, 86400, Date.now().toString())
      .catch(() => {
        // Ignore errors - activity tracking is not critical
      });

    next();
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
    } else if (error instanceof Error) {
      // Handle JWT errors
      if (error.name === 'TokenExpiredError') {
        next(ApiError.unauthorized('Token expired'));
      } else if (error.name === 'JsonWebTokenError') {
        next(ApiError.unauthorized('Invalid token'));
      } else {
        next(error);
      }
    } else {
      next(ApiError.unauthorized('Authentication failed'));
    }
  }
};

/**
 * Optional authentication middleware
 * Attaches user to request if valid token is present, but doesn't fail if not
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return next();
  }

  // If token is present, try to authenticate
  return authenticate(req, res, next);
};

/**
 * Require email verification middleware
 * Must be used after authenticate middleware
 */
export const requireEmailVerified = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  // This would need to check against the database
  // For now, we'll implement this when we have the full auth flow
  next();
};
