export { env, type Env } from './env.js';
export { connectDatabase, disconnectDatabase } from './database.js';
export { redisConfig, type RedisConfig } from './redis.js';

import { env } from './env.js';

// Aggregated config object for convenience
export const config = {
  // Environment
  nodeEnv: env.NODE_ENV,
  isProduction: env.NODE_ENV === 'production',
  isDevelopment: env.NODE_ENV === 'development',
  isTest: env.NODE_ENV === 'test',
  port: env.PORT,
  apiVersion: env.API_VERSION,

  // Database
  mongodb: {
    uri: env.MONGODB_URI,
  },

  // Redis
  redis: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD,
    db: env.REDIS_DB,
  },

  // JWT
  jwt: {
    accessSecret: env.JWT_ACCESS_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
    accessExpiresIn: env.JWT_ACCESS_EXPIRES_IN,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
  },

  // Argon2
  argon2: {
    memory: env.ARGON2_MEMORY,
    iterations: env.ARGON2_ITERATIONS,
    parallelism: env.ARGON2_PARALLELISM,
  },

  // Email
  email: {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    user: env.SMTP_USER,
    password: env.SMTP_PASSWORD,
    from: env.EMAIL_FROM,
  },

  // Security
  cors: {
    origins: env.CORS_ORIGINS.split(',').map((o) => o.trim()),
  },

  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
  },

  // Logging
  log: {
    level: env.LOG_LEVEL,
    format: env.LOG_FORMAT,
  },
} as const;

export type Config = typeof config;
