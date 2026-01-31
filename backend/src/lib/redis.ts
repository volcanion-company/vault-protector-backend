import Redis from 'ioredis';
import { redisConfig } from '../config/redis.js';
import { logger } from './logger.js';

// Create Redis client singleton
export const redis = new Redis({
  host: redisConfig.host,
  port: redisConfig.port,
  password: redisConfig.password,
  db: redisConfig.db,
  retryStrategy: (times) => {
    if (times > 3) {
      logger.error('Redis connection failed after 3 retries');
      return null; // Stop retrying
    }
    return Math.min(times * 200, 2000); // Exponential backoff
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
});

// Event handlers
redis.on('connect', () => {
  logger.info('✅ Redis connected');
});

redis.on('ready', () => {
  logger.debug('Redis ready to accept commands');
});

redis.on('error', (err) => {
  logger.error('Redis error:', err);
});

redis.on('close', () => {
  logger.warn('Redis connection closed');
});

redis.on('reconnecting', () => {
  logger.info('Redis reconnecting...');
});

// Connect to Redis
export const connectRedis = async (): Promise<void> => {
  try {
    // Only connect if not already connected or connecting
    if (redis.status === 'wait') {
      await redis.connect();
    } else {
      logger.debug(`Redis already in status: ${redis.status}`);
    }
  } catch (error) {
    logger.error('❌ Redis connection failed:', error);
    // Don't exit - Redis might be optional for some operations
  }
};

// Disconnect from Redis
export const disconnectRedis = async (): Promise<void> => {
  try {
    await redis.quit();
    logger.info('Redis disconnected gracefully');
  } catch (error) {
    logger.error('Error disconnecting Redis:', error);
  }
};

// Helper functions for common operations
export const redisHelpers = {
  // Set with TTL
  async setEx(key: string, seconds: number, value: string): Promise<void> {
    await redis.setex(key, seconds, value);
  },

  // Get and delete (atomic)
  async getAndDelete(key: string): Promise<string | null> {
    const value = await redis.get(key);
    if (value) {
      await redis.del(key);
    }
    return value;
  },

  // Increment with expiry
  async incrWithExpiry(key: string, seconds: number): Promise<number> {
    const multi = redis.multi();
    multi.incr(key);
    multi.expire(key, seconds);
    const results = await multi.exec();
    return (results?.[0]?.[1] as number) || 0;
  },

  // Check if key exists
  async exists(key: string): Promise<boolean> {
    return (await redis.exists(key)) === 1;
  },

  // Delete multiple keys by pattern
  async deleteByPattern(pattern: string): Promise<number> {
    const keys = await redis.keys(pattern);
    if (keys.length === 0) return 0;
    return redis.del(...keys);
  },
};
