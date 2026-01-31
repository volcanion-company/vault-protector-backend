import { Request, Response } from 'express';
import { vaultService } from './vault.service.js';
import { sendSuccess, sendNoContent } from '../../utils/api-response.js';
import { getClientIp, getUserAgent } from '../../utils/helpers.js';
import type { AuthenticatedRequest } from '../../types/express.js';
import type { UpdateVaultDto, GetVaultQueryDto } from './vault.dto.js';

class VaultController {
  /**
   * GET /api/v1/vault
   */
  async getVault(req: Request, res: Response): Promise<void> {
    const { id: userId, sessionId } = (req as AuthenticatedRequest).user;
    const query = req.query as unknown as GetVaultQueryDto;
    const context = {
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
      sessionId,
    };

    const result = await vaultService.getVault(userId, query.version);

    // Log sync activity
    await vaultService.logSync(userId, context);

    if (result === null) {
      // Client has latest version
      res.status(304).send();
      return;
    }

    sendSuccess(res, result);
  }

  /**
   * PUT /api/v1/vault
   */
  async updateVault(req: Request, res: Response): Promise<void> {
    const { id: userId, sessionId } = (req as AuthenticatedRequest).user;
    const body = req.body as UpdateVaultDto;
    const context = {
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
      sessionId,
    };

    const result = await vaultService.updateVault(
      userId,
      body.blob,
      body.encryption,
      body.expectedVersion,
      body.checksum,
      body.blobFormatVersion,
      context
    );

    sendSuccess(res, result);
  }

  /**
   * GET /api/v1/vault/sync
   */
  async getSyncStatus(req: Request, res: Response): Promise<void> {
    const { id: userId } = (req as AuthenticatedRequest).user;
    const result = await vaultService.getSyncStatus(userId);
    sendSuccess(res, result);
  }
}

export const vaultController = new VaultController();
