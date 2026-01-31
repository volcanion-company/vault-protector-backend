import { env } from './env.js';

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
}

export const redisConfig: RedisConfig = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD || undefined,
  db: env.REDIS_DB,
};
