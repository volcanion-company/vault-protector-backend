/**
 * Custom API Error class for consistent error handling
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly details?: string[];
  public readonly isOperational: boolean;

  constructor(statusCode: number, message: string, details?: string[]) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;

    // Maintains proper stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  // Factory methods for common errors
  static badRequest(message: string = 'Bad Request', details?: string[]): ApiError {
    return new ApiError(400, message, details);
  }

  static unauthorized(message: string = 'Unauthorized'): ApiError {
    return new ApiError(401, message);
  }

  static forbidden(message: string = 'Forbidden'): ApiError {
    return new ApiError(403, message);
  }

  static notFound(message: string = 'Resource not found'): ApiError {
    return new ApiError(404, message);
  }

  static conflict(message: string = 'Resource already exists'): ApiError {
    return new ApiError(409, message);
  }

  static tooManyRequests(message: string = 'Too many requests'): ApiError {
    return new ApiError(429, message);
  }

  static internal(message: string = 'Internal server error'): ApiError {
    return new ApiError(500, message);
  }
}
