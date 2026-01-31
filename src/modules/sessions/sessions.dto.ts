import { z } from 'zod';

/**
 * Revoke session params DTO
 */
export const revokeSessionParamsDto = z.object({
  id: z.string().min(1, 'Session ID is required'),
});

export type RevokeSessionParamsDto = z.infer<typeof revokeSessionParamsDto>;
