import { Request } from 'express';
import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redis } from '../lib/redis.js';
import { config } from '../config/index.js';
import { RATE_LIMIT, REDIS_KEYS } from '../utils/constants.js';
import { sendError } from '../utils/api-response.js';

/**
 * Create a rate limiter with Redis store
 */
const createRateLimiter = (options: {
  prefix: string;
  windowMs: number;
  max: number;
  keyGenerator?: (req: Request) => string;
  message?: string;
}): RateLimitRequestHandler => {
  return rateLimit({
    store: new RedisStore({
      // Use sendCommand for ioredis
      sendCommand: async (...args: string[]): Promise<number | string> => {
        const [command, ...restArgs] = args;
        if (!command) throw new Error('Redis command is required');
        return redis.call(command, ...restArgs) as Promise<number | string>;
      },
      prefix: options.prefix,
    }),
    windowMs: options.windowMs,
    max: options.max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: options.keyGenerator || ((req) => req.ip || 'unknown'),
    handler: (_req, res) => {
      sendError(res, options.message || 'Too many requests, please try again later', 429);
    },
    skip: () => {
      // Skip rate limiting in test environment
      return config.isTest;
    },
  });
};

/**
 * General API rate limiter
 * 100 requests per 15 minutes per IP
 */
export const apiLimiter = createRateLimiter({
  prefix: REDIS_KEYS.RATE_LIMIT.API,
  windowMs: RATE_LIMIT.API.WINDOW_MS,
  max: RATE_LIMIT.API.MAX,
  message: 'Too many requests, please try again later',
});

/**
 * Strict rate limiter for authentication endpoints
 * 10 requests per 15 minutes per IP + email combination
 */
export const authLimiter = createRateLimiter({
  prefix: REDIS_KEYS.RATE_LIMIT.AUTH,
  windowMs: RATE_LIMIT.AUTH.WINDOW_MS,
  max: RATE_LIMIT.AUTH.MAX,
  keyGenerator: (req: Request) => {
    const email = (req.body as { email?: string })?.email || 'unknown';
    return `${req.ip}:${email}`;
  },
  message: 'Too many authentication attempts, please try again later',
});

/**
 * Very strict rate limiter for password reset
 * 3 requests per hour per IP
 */
export const passwordResetLimiter = createRateLimiter({
  prefix: REDIS_KEYS.RATE_LIMIT.RESET,
  windowMs: RATE_LIMIT.PASSWORD_RESET.WINDOW_MS,
  max: RATE_LIMIT.PASSWORD_RESET.MAX,
  message: 'Too many password reset attempts, please try again later',
});

/**
 * Rate limiter for prelogin endpoint
 * More relaxed but still protected
 */
export const preloginLimiter = createRateLimiter({
  prefix: 'rl:prelogin:',
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 30,
  message: 'Too many prelogin requests, please try again later',
});
