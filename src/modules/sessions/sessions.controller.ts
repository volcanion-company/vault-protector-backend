import { Request, Response } from 'express';
import { sessionsService } from './sessions.service.js';
import { sendSuccess, sendNoContent } from '../../utils/api-response.js';
import { getClientIp, getUserAgent } from '../../utils/helpers.js';
import type { AuthenticatedRequest } from '../../types/express.js';
import type { RevokeSessionParamsDto } from './sessions.dto.js';

class SessionsController {
  /**
   * GET /api/v1/sessions
   */
  async getSessions(req: Request, res: Response): Promise<void> {
    const { id: userId, sessionId } = (req as AuthenticatedRequest).user;
    const sessions = await sessionsService.getSessions(userId, sessionId);
    sendSuccess(res, { sessions });
  }

  /**
   * DELETE /api/v1/sessions/:id
   */
  async revokeSession(req: Request, res: Response): Promise<void> {
    const { id: userId, sessionId: currentSessionId } = (req as AuthenticatedRequest).user;
    const params = req.params as unknown as RevokeSessionParamsDto;
    const context = {
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
    };

    await sessionsService.revokeSession(userId, params.id, currentSessionId, context);
    sendNoContent(res);
  }

  /**
   * DELETE /api/v1/sessions
   */
  async revokeAllSessions(req: Request, res: Response): Promise<void> {
    const { id: userId, sessionId: currentSessionId } = (req as AuthenticatedRequest).user;
    const context = {
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
    };

    const revokedCount = await sessionsService.revokeAllSessions(
      userId,
      currentSessionId,
      context
    );

    sendSuccess(res, { revokedCount });
  }
}

export const sessionsController = new SessionsController();
