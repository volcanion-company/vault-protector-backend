import { Types } from 'mongoose';
import { Vault, type IVault } from '../../models/vault.model.js';
import { AuditLog } from '../../models/audit-log.model.js';
import { ApiError } from '../../utils/api-error.js';
import { AUDIT_ACTIONS } from '../../utils/constants.js';
import type { EncryptionAlgorithm } from '../../types/global.js';
import type {
  GetVaultResult,
  UpdateVaultResult,
  SyncStatusResult,
} from './vault.types.js';

class VaultService {
  /**
   * Get user's vault
   */
  async getVault(userId: string, clientVersion?: number): Promise<GetVaultResult | null> {
    const vault = await Vault.findOne({ userId: new Types.ObjectId(userId) });

    if (!vault) {
      throw ApiError.notFound('Vault not found');
    }

    // If client has the same version, return null (304 Not Modified)
    if (clientVersion !== undefined && vault.version <= clientVersion) {
      return null;
    }

    return {
      vault: {
        blob: vault.blob,
        encryption: {
          algorithm: vault.encryption.algorithm as EncryptionAlgorithm,
          iv: vault.encryption.iv,
          authTag: vault.encryption.tag, // Map tag (DB) to authTag (API)
        },
        version: vault.version,
        checksum: vault.checksum,
        blobFormatVersion: vault.blobFormatVersion,
        lastSyncedAt: vault.lastSyncedAt.toISOString(),
      },
    };
  }

  /**
   * Update user's vault
   */
  async updateVault(
    userId: string,
    blob: string,
    encryption: {
      algorithm: EncryptionAlgorithm;
      iv: string;
      authTag: string; // API uses authTag
    },
    expectedVersion: number,
    checksum: string,
    blobFormatVersion: number,
    context: { ipAddress: string; userAgent: string; sessionId?: string }
  ): Promise<UpdateVaultResult> {
    const userObjectId = new Types.ObjectId(userId);

    // Find vault with optimistic locking
    const vault = await Vault.findOne({ userId: userObjectId });

    if (!vault) {
      throw ApiError.notFound('Vault not found');
    }

    // Check version for conflict detection
    if (vault.version !== expectedVersion) {
      throw ApiError.conflict(
        `Version mismatch: expected ${expectedVersion}, current is ${vault.version}`
      );
    }

    // Update vault - map authTag (API) to tag (DB)
    vault.blob = blob;
    vault.encryption = {
      algorithm: encryption.algorithm,
      iv: encryption.iv,
      tag: encryption.authTag,
    };
    vault.version = vault.version + 1;
    vault.checksum = checksum;
    vault.blobFormatVersion = blobFormatVersion;
    vault.lastSyncedAt = new Date();

    await vault.save();

    // Log audit
    await this.logAudit(AUDIT_ACTIONS.VAULT.UPDATE, 'success', userObjectId, {
      ...context,
      newVersion: vault.version,
      previousVersion: expectedVersion,
    });

    return {
      version: vault.version,
      lastSyncedAt: vault.lastSyncedAt.toISOString(),
    };
  }

  /**
   * Get sync status (quick check)
   */
  async getSyncStatus(userId: string): Promise<SyncStatusResult> {
    const vault = await Vault.findOne({ userId: new Types.ObjectId(userId) })
      .select('version checksum lastSyncedAt')
      .lean();

    if (!vault) {
      throw ApiError.notFound('Vault not found');
    }

    return {
      currentVersion: vault.version,
      lastSyncedAt: vault.lastSyncedAt.toISOString(),
      checksum: vault.checksum,
    };
  }

  /**
   * Log sync activity
   */
  async logSync(
    userId: string,
    context: { ipAddress: string; userAgent: string; sessionId?: string }
  ): Promise<void> {
    await this.logAudit(
      AUDIT_ACTIONS.VAULT.SYNC,
      'success',
      new Types.ObjectId(userId),
      context
    );
  }

  // Private helper
  private async logAudit(
    action: string,
    status: 'success' | 'failure',
    userId: Types.ObjectId,
    metadata: Record<string, unknown>
  ): Promise<void> {
    try {
      await AuditLog.create({
        userId,
        action,
        status,
        metadata,
      });
    } catch (error) {
      console.error('Audit log failed:', error);
    }
  }
}

export const vaultService = new VaultService();
