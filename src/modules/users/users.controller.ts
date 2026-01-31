import { Request, Response } from 'express';
import { usersService } from './users.service.js';
import { sendSuccess, sendNoContent } from '../../utils/api-response.js';
import { getClientIp, getUserAgent } from '../../utils/helpers.js';
import type { AuthenticatedRequest } from '../../types/express.js';
import type { AuditLogQueryDto, DeleteAccountDto } from './users.dto.js';

class UsersController {
  /**
   * GET /api/v1/users/me
   */
  async getProfile(req: Request, res: Response): Promise<void> {
    const { id: userId } = (req as AuthenticatedRequest).user;
    const profile = await usersService.getProfile(userId);
    sendSuccess(res, { user: profile });
  }

  /**
   * GET /api/v1/users/me/audit-logs
   */
  async getAuditLogs(req: Request, res: Response): Promise<void> {
    const { id: userId } = (req as AuthenticatedRequest).user;
    const query = req.query as unknown as AuditLogQueryDto;

    const result = await usersService.getAuditLogs(
      userId,
      query.page,
      query.limit,
      query.action
    );

    sendSuccess(res, result, 200, {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    });
  }

  /**
   * DELETE /api/v1/users/me
   */
  async deleteAccount(req: Request, res: Response): Promise<void> {
    const { id: userId } = (req as AuthenticatedRequest).user;
    const body = req.body as DeleteAccountDto;
    const context = {
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
    };

    await usersService.deleteAccount(userId, body.authVerifier, context);
    sendNoContent(res);
  }
}

export const usersController = new UsersController();
