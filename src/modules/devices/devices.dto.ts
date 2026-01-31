import { z } from 'zod';

/**
 * Device ID params DTO
 */
export const deviceParamsDto = z.object({
  id: z.string().min(1, 'Device ID is required'),
});

export type DeviceParamsDto = z.infer<typeof deviceParamsDto>;

/**
 * Update device DTO
 */
export const updateDeviceDto = z.object({
  name: z.string().min(1).max(100).optional(),
});

export type UpdateDeviceDto = z.infer<typeof updateDeviceDto>;
