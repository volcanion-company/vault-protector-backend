import type { EncryptionAlgorithm } from '../../types/global.js';

// Vault data response
export interface VaultData {
  blob: string;
  encryption: {
    algorithm: EncryptionAlgorithm;
    iv: string;
    authTag: string; // API uses authTag
  };
  version: number;
  checksum: string;
  blobFormatVersion: number;
  lastSyncedAt: string;
}

// Get vault response
export interface GetVaultResult {
  vault: VaultData;
}

// Update vault response
export interface UpdateVaultResult {
  version: number;
  lastSyncedAt: string;
}

// Sync status response
export interface SyncStatusResult {
  currentVersion: number;
  lastSyncedAt: string;
  checksum: string;
}
