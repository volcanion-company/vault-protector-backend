import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../lib/logger.js';

export const connectDatabase = async (): Promise<typeof mongoose> => {
  try {
    mongoose.set('strictQuery', true);

    const connection = await mongoose.connect(env.MONGODB_URI, {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info(`✅ MongoDB connected: ${connection.connection.host}`);

    // Connection event handlers
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

    return connection;
  } catch (error) {
    logger.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected gracefully');
  } catch (error) {
    logger.error('Error disconnecting MongoDB:', error);
  }
};
