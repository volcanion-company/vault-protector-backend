import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { ApiError } from '../utils/api-error.js';
import { logger } from '../lib/logger.js';
import { config } from '../config/index.js';
import { sendError } from '../utils/api-response.js';

/**
 * Global error handler middleware
 */
export const errorHandler: ErrorRequestHandler = (
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log the error
  logger.error({
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id,
  });

  // Handle known ApiError
  if (error instanceof ApiError) {
    sendError(res, error.message, error.statusCode, error.details);
    return;
  }

  // Handle Mongoose validation errors
  if (error.name === 'ValidationError') {
    sendError(res, 'Validation failed', 400, [error.message]);
    return;
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (error.name === 'CastError') {
    sendError(res, 'Invalid ID format', 400);
    return;
  }

  // Handle MongoDB duplicate key error
  if (error.name === 'MongoServerError' && (error as { code?: number }).code === 11000) {
    sendError(res, 'Resource already exists', 409);
    return;
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    sendError(res, 'Invalid token', 401);
    return;
  }

  if (error.name === 'TokenExpiredError') {
    sendError(res, 'Token expired', 401);
    return;
  }

  // Handle syntax errors (invalid JSON)
  if (error instanceof SyntaxError && 'body' in error) {
    sendError(res, 'Invalid JSON', 400);
    return;
  }

  // Default: Internal server error
  // Don't leak internal error messages in production
  const message = config.isProduction ? 'Internal server error' : error.message;

  sendError(res, message, 500);
};

/**
 * Not found handler for undefined routes
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  sendError(res, `Route ${req.method} ${req.path} not found`, 404);
};

/**
 * Async handler wrapper to catch async errors
 */
export const asyncHandler = <T>(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<T>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
