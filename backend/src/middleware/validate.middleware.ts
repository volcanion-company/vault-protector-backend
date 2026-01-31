import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ApiError } from '../utils/api-error.js';

type ValidationTarget = 'body' | 'query' | 'params';

/**
 * Validation middleware factory
 * Uses Zod schema to validate request data
 */
export const validate = (
  schema: ZodSchema,
  target: ValidationTarget = 'body'
): RequestHandler => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const data = req[target];
      const parsed = schema.parse(data);

      // Replace with parsed and transformed data
      (req as unknown as Record<string, unknown>)[target] = parsed;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.errors.map((e) => {
          const path = e.path.join('.');
          return path ? `${path}: ${e.message}` : e.message;
        });
        next(new ApiError(400, 'Validation failed', messages));
      } else {
        next(error);
      }
    }
  };
};

/**
 * Validate multiple targets
 */
export const validateMultiple = (
  schemas: Partial<Record<ValidationTarget, ZodSchema>>
): RequestHandler => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const errors: string[] = [];

    for (const [target, schema] of Object.entries(schemas) as [ValidationTarget, ZodSchema][]) {
      try {
        const data = req[target];
        const parsed = schema.parse(data);
        (req as unknown as Record<string, unknown>)[target] = parsed;
      } catch (error) {
        if (error instanceof ZodError) {
          const messages = error.errors.map((e) => {
            const path = e.path.join('.');
            return path ? `${target}.${path}: ${e.message}` : `${target}: ${e.message}`;
          });
          errors.push(...messages);
        } else {
          next(error);
          return;
        }
      }
    }

    if (errors.length > 0) {
      next(new ApiError(400, 'Validation failed', errors));
    } else {
      next();
    }
  };
};
