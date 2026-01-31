import { z } from 'zod';

/**
 * Audit log query DTO
 */
export const auditLogQueryDto = z.object({
  page: z.string().default('1').transform((v) => Math.max(1, parseInt(v, 10))),
  limit: z.string().default('20').transform((v) => Math.min(100, Math.max(1, parseInt(v, 10)))),
  action: z.string().optional(),
});

export type AuditLogQueryDto = z.infer<typeof auditLogQueryDto>;

/**
 * Delete account DTO
 */
export const deleteAccountDto = z.object({
  authVerifier: z.string().min(1, 'Auth verifier is required for confirmation'),
});

export type DeleteAccountDto = z.infer<typeof deleteAccountDto>;
