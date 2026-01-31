import { Request, Response } from 'express';
import { authService } from './auth.service.js';
import { sendSuccess, sendCreated, sendNoContent } from '../../utils/api-response.js';
import { getClientIp, getUserAgent } from '../../utils/helpers.js';
import type { AuthenticatedRequest } from '../../types/express.js';
import type {
  RegisterDto,
  LoginDto,
  PreloginQueryDto,
  RefreshTokenDto,
  ChangePasswordDto,
  SetMasterPasswordDto,
} from './auth.dto.js';

class AuthController {
  /**
   * POST /api/v1/auth/register
   */
  async register(req: Request, res: Response): Promise<void> {
    const body = req.body as RegisterDto;
    const context = {
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
    };

    const result = await authService.register(
      body.email,
      body.authVerifier,
      body.kdf,
      body.wrappedVaultKey,
      body.initialVault,
      body.device,
      context
    );

    sendCreated(res, result);
  }

  /**
   * GET /api/v1/auth/prelogin
   */
  async prelogin(req: Request, res: Response): Promise<void> {
    const query = req.query as unknown as PreloginQueryDto;
    const result = await authService.prelogin(query.email);
    sendSuccess(res, result);
  }

  /**
   * POST /api/v1/auth/login
   */
  async login(req: Request, res: Response): Promise<void> {
    const body = req.body as LoginDto;
    const context = {
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
    };

    const result = await authService.login(
      body.email,
      body.authVerifier,
      body.device,
      context
    );

    sendSuccess(res, result);
  }

  /**
   * POST /api/v1/auth/refresh
   */
  async refresh(req: Request, res: Response): Promise<void> {
    const body = req.body as RefreshTokenDto;
    const result = await authService.refresh(body.refreshToken);
    sendSuccess(res, result);
  }

  /**
   * POST /api/v1/auth/logout
   */
  async logout(req: Request, res: Response): Promise<void> {
    const { sessionId } = (req as AuthenticatedRequest).user;
    const context = {
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
      sessionId,
    };

    await authService.logout(sessionId, context);
    sendNoContent(res);
  }

  /**
   * POST /api/v1/auth/change-password
   */
  async changePassword(req: Request, res: Response): Promise<void> {
    const { id: userId, sessionId } = (req as AuthenticatedRequest).user;
    const body = req.body as ChangePasswordDto;
    const context = {
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
      sessionId,
    };

    await authService.changePassword(
      userId,
      body.currentAuthVerifier,
      body.newAuthVerifier,
      body.newWrappedVaultKey,
      body.newKdf,
      context
    );

    sendNoContent(res);
  }

  /**
   * POST /api/v1/auth/set-master-password
   * Set Master Password for users who registered without one
   */
  async setMasterPassword(req: Request, res: Response): Promise<void> {
    const { id: userId, sessionId } = (req as AuthenticatedRequest).user;
    const body = req.body as SetMasterPasswordDto;
    const context = {
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
      sessionId,
    };

    const result = await authService.setMasterPassword(
      userId,
      body.wrappedVaultKey,
      body.initialVault,
      context
    );

    sendSuccess(res, result);
  }
}

export const authController = new AuthController();
