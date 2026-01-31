import morgan from 'morgan';
import { morganStream } from '../lib/logger.js';
import { config } from '../config/index.js';

/**
 * HTTP request logger middleware using Morgan
 */
export const requestLogger = morgan(
  config.isProduction ? 'combined' : 'dev',
  {
    stream: morganStream,
    skip: (req) => {
      // Skip health check endpoints in logs
      return req.url === '/health' || req.url === '/ready';
    },
  }
);
