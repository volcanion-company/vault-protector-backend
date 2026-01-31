import { z } from 'zod';
import { VAULT } from '../../utils/constants.js';

// Encryption metadata schema
const encryptionSchema = z.object({
  algorithm: z.enum(VAULT.SUPPORTED_ALGORITHMS),
  iv: z.string().min(1, 'IV is required'),
  authTag: z.string().min(1, 'Auth tag is required'),
});

/**
 * Update vault request DTO
 */
export const updateVaultDto = z.object({
  blob: z
    .string()
    .min(1, 'Vault blob is required')
    .max(VAULT.MAX_BLOB_SIZE_BYTES, `Vault blob exceeds maximum size of ${VAULT.MAX_BLOB_SIZE_MB}MB`),
  encryption: encryptionSchema,
  expectedVersion: z.number().int().min(1, 'Expected version must be at least 1'),
  checksum: z.string().min(1, 'Checksum is required'),
  blobFormatVersion: z.number().int().min(1).default(1),
});

export type UpdateVaultDto = z.infer<typeof updateVaultDto>;

/**
 * Get vault query DTO
 */
export const getVaultQueryDto = z.object({
  version: z.string().optional().transform((v) => (v ? parseInt(v, 10) : undefined)),
});

export type GetVaultQueryDto = z.infer<typeof getVaultQueryDto>;

/**
 * Vault history query DTO
 */
export const vaultHistoryQueryDto = z.object({
  limit: z.string().default('10').transform((v) => Math.min(parseInt(v, 10), 50)),
});

export type VaultHistoryQueryDto = z.infer<typeof vaultHistoryQueryDto>;
