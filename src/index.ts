import { createApp } from './app.js';
import { config, connectDatabase } from './config/index.js';
import { connectRedis, disconnectRedis, redis } from './lib/redis.js';
import { logger } from './lib/logger.js';
import mongoose from 'mongoose';

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: unknown) => {
  logger.error('Unhandled Rejection:', reason);
  process.exit(1);
});

/**
 * Graceful shutdown handler
 */
const gracefulShutdown = async (signal: string): Promise<void> => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  // Stop accepting new connections
  if (server) {
    server.close(() => {
      logger.info('HTTP server closed');
    });
  }

  // Close database connections
  try {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected');
  } catch (error) {
    logger.error('Error disconnecting MongoDB:', error);
  }

  // Close Redis connection
  try {
    await disconnectRedis();
    logger.info('Redis disconnected');
  } catch (error) {
    logger.error('Error disconnecting Redis:', error);
  }

  logger.info('Graceful shutdown completed');
  process.exit(0);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Server instance
let server: ReturnType<typeof import('http').createServer>;

/**
 * Start the server
 */
const startServer = async (): Promise<void> => {
  try {
    // Connect to MongoDB
    await connectDatabase();

    // Connect to Redis
    await connectRedis();

    // Create Express app
    const app = createApp();

    // Start HTTP server - bind to 0.0.0.0 to allow external connections (e.g., from mobile devices)
    const host = '0.0.0.0';
    server = app.listen(config.port, host, () => {
      logger.info(`🚀 Server running on ${host}:${config.port}`);
      logger.info(`📚 API available at http://localhost:${config.port}/api/${config.apiVersion}`);
      logger.info(`📱 For mobile devices, use your machine's IP address`);
      logger.info(`🏥 Health check at http://localhost:${config.port}/health`);
      logger.info(`🌍 Environment: ${config.nodeEnv}`);
    });

    // Handle server errors
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${config.port} is already in use`);
      } else {
        logger.error('Server error:', error);
      }
      process.exit(1);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();
