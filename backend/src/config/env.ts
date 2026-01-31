import { z } from 'zod';
import dotenv from 'dotenv';

// Load .env file
dotenv.config();

// Environment schema with validation
const envSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  API_VERSION: z.string().default('v1'),

  // MongoDB
  MONGODB_URI: z.string().url().default('mongodb://localhost:27017/vault-protector'),

  // Redis
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().transform(Number).default('6379'),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.string().transform(Number).default('0'),

  // JWT
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // Argon2
  ARGON2_MEMORY: z.string().transform(Number).default('65536'),
  ARGON2_ITERATIONS: z.string().transform(Number).default('3'),
  ARGON2_PARALLELISM: z.string().transform(Number).default('4'),

  // Email
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(Number).default('587'),
  SMTP_SECURE: z.string().transform((v) => v === 'true').default('false'),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),

  // Security
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'),
  RATE_LIMIT_MAX: z.string().transform(Number).default('100'),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FORMAT: z.enum(['dev', 'combined', 'json']).default('dev'),
});

// Parse and validate environment
const parseEnv = () => {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('❌ Invalid environment variables:');
    console.error(parsed.error.flatten().fieldErrors);
    process.exit(1);
  }

  return parsed.data;
};

export const env = parseEnv();

export type Env = z.infer<typeof envSchema>;
