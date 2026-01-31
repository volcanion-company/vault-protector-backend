import { Request, Response } from 'express';
import { devicesService } from './devices.service.js';
import { sendSuccess, sendNoContent } from '../../utils/api-response.js';
import { getClientIp, getUserAgent } from '../../utils/helpers.js';
import type { AuthenticatedRequest } from '../../types/express.js';
import type { DeviceParamsDto, UpdateDeviceDto } from './devices.dto.js';

class DevicesController {
  /**
   * GET /api/v1/devices
   */
  async getDevices(req: Request, res: Response): Promise<void> {
    const { id: userId } = (req as AuthenticatedRequest).user;
    const devices = await devicesService.getDevices(userId);
    sendSuccess(res, { devices });
  }

  /**
   * PATCH /api/v1/devices/:id
   */
  async updateDevice(req: Request, res: Response): Promise<void> {
    const { id: userId } = (req as AuthenticatedRequest).user;
    const params = req.params as unknown as DeviceParamsDto;
    const body = req.body as UpdateDeviceDto;

    if (!body.name) {
      sendSuccess(res, {}); // Nothing to update
      return;
    }

    const device = await devicesService.updateDevice(userId, params.id, body.name);
    sendSuccess(res, { device });
  }

  /**
   * DELETE /api/v1/devices/:id
   */
  async deleteDevice(req: Request, res: Response): Promise<void> {
    const { id: userId, deviceId: currentDeviceId } = (req as AuthenticatedRequest).user;
    const params = req.params as unknown as DeviceParamsDto;
    const context = {
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
    };

    await devicesService.deleteDevice(userId, params.id, currentDeviceId, context);
    sendNoContent(res);
  }

  /**
   * POST /api/v1/devices/:id/trust
   */
  async trustDevice(req: Request, res: Response): Promise<void> {
    const { id: userId } = (req as AuthenticatedRequest).user;
    const params = req.params as unknown as DeviceParamsDto;
    const context = {
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
    };

    const device = await devicesService.trustDevice(userId, params.id, context);
    sendSuccess(res, { device });
  }

  /**
   * POST /api/v1/devices/cleanup
   * Cleanup duplicate devices (keeps most recently active one for each name+platform)
   */
  async cleanupDuplicates(req: Request, res: Response): Promise<void> {
    const { id: userId } = (req as AuthenticatedRequest).user;
    const context = {
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
    };

    const result = await devicesService.cleanupDuplicateDevices(userId, context);
    sendSuccess(res, result);
  }
}

export const devicesController = new DevicesController();
