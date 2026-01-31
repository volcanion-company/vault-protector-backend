import { Request } from 'express';

// Extend Express Request to include authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        sessionId: string;
        deviceId: string;
      };
    }
  }
}

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    sessionId: string;
    deviceId: string;
  };
}

// Type guard for authenticated requests
export const isAuthenticated = (req: Request): req is AuthenticatedRequest => {
  return req.user !== undefined;
};
