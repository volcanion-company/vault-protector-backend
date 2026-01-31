/**
 * @file useVault Hook - Vault operations with encryption
 * @description Custom hook for vault CRUD operations with client-side encryption
 * 
 * Backend API contract (Zero-Knowledge):
 * - GET /vault - Get encrypted vault blob
 * - PUT /vault - Update encrypted vault blob (with version for optimistic locking)
 * - GET /vault/sync?version=X&checksum=Y - Check if vault is in sync
 * 
 * The vault is stored as a single encrypted blob on the server.
 * All vault items are decrypted locally and managed in memory/local storage.
 */

import { useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useVaultStore } from '@/stores/vaultStore';
import { api, VAULT_ENDPOINTS } from '@/services/api';
import {
  generateSecureId,
  hexToBytes,
  bytesToHex,
} from '@/services/crypto';
import { getEncryptionKey } from '@/services/storage';
import { gcm } from '@noble/ciphers/aes.js';
import { randomBytes } from '@noble/ciphers/utils.js';
import { sha256 } from '@noble/hashes/sha2.js';
import type { 
  DecryptedVaultItem, 
  VaultItemType, 
  PasswordEntry, 
  SecureNote, 
  CardEntry, 
  IdentityEntry 
} from '@/types/vault.types';

// ================== Types ==================

interface VaultData {
  items: DecryptedVaultItem[];
  folders: VaultFolder[];
  version: number;
  updatedAt: string;
}

interface VaultFolder {
  id: string;
  name: string;
  parentId?: string;
  createdAt: string;
}

interface EncryptionParams {
  algorithm: 'aes-256-gcm';
  iv: string; // base64 encoded
  authTag: string; // base64 encoded
}

interface VaultBlob {
  blob: string; // base64 encoded encrypted data
  encryption: EncryptionParams;
  checksum: string; // SHA256 of blob
  version: number;
}

interface GetVaultResponse {
  vault: VaultBlob;
}

interface UpdateVaultRequest {
  blob: string;
  encryption: EncryptionParams;
  checksum: string;
  expectedVersion: number;
}

interface UpdateVaultResponse {
  version: number;
  updatedAt: string;
}

interface SyncCheckResponse {
  inSync: boolean;
  serverVersion?: number;
  serverChecksum?: string;
}

// Query keys
export const VAULT_QUERY_KEYS = {
  all: ['vault'] as const,
  data: () => [...VAULT_QUERY_KEYS.all, 'data'] as const,
  sync: () => [...VAULT_QUERY_KEYS.all, 'sync'] as const,
};

// ================== Helper Functions ==================

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Encrypt vault data with AES-256-GCM
 */
function encryptVault(data: VaultData, key: Uint8Array): VaultBlob {
  const plaintext = JSON.stringify(data);
  const iv = randomBytes(12); // 96-bit IV for GCM
  
  const aes = gcm(key, iv);
  const ciphertext = aes.encrypt(new TextEncoder().encode(plaintext));
  
  // GCM appends auth tag to ciphertext (last 16 bytes)
  const authTag = ciphertext.slice(-16);
  const encryptedData = ciphertext.slice(0, -16);
  
  const blob = uint8ArrayToBase64(encryptedData);
  const checksum = bytesToHex(sha256(new TextEncoder().encode(blob)));
  
  return {
    blob,
    encryption: {
      algorithm: 'aes-256-gcm',
      iv: uint8ArrayToBase64(iv),
      authTag: uint8ArrayToBase64(authTag),
    },
    checksum,
    version: data.version,
  };
}

/**
 * Decrypt vault blob with AES-256-GCM
 */
function decryptVault(vault: VaultBlob, key: Uint8Array): VaultData {
  const iv = base64ToUint8Array(vault.encryption.iv);
  const authTag = base64ToUint8Array(vault.encryption.authTag);
  const encryptedData = base64ToUint8Array(vault.blob);
  
  // Reconstruct full ciphertext with auth tag
  const ciphertext = new Uint8Array(encryptedData.length + authTag.length);
  ciphertext.set(encryptedData);
  ciphertext.set(authTag, encryptedData.length);
  
  const aes = gcm(key, iv);
  const plaintext = aes.decrypt(ciphertext);
  
  const data = JSON.parse(new TextDecoder().decode(plaintext));
  return {
    ...data,
    version: vault.version,
  };
}

// ================== Hook ==================

export function useVault() {
  const queryClient = useQueryClient();
  const {
    items,
    folders,
    version,
    addItem,
    updateItem,
    deleteItem,
    setItems,
    setFolders,
    setVersion,
    lastSyncTime,
    setLastSyncTime,
    localChecksum,
    setLocalChecksum,
  } = useVaultStore();

  // Get encryption key
  const getKey = useCallback(async (): Promise<Uint8Array> => {
    const keyHex = await getEncryptionKey();
    if (!keyHex) {
      throw new Error('Encryption key not found. Please login again.');
    }
    return hexToBytes(keyHex);
  }, []);

  // ================== Fetch Vault ==================
  const vaultQuery = useQuery({
    queryKey: VAULT_QUERY_KEYS.data(),
    queryFn: async (): Promise<VaultData> => {
      console.log('[VaultQuery] Fetching vault from server...');
      const key = await getKey();
      
      const response = await api.get<GetVaultResponse>(VAULT_ENDPOINTS.GET);
      
      if (!response.success || !response.data) {
        console.log('[VaultQuery] Failed to fetch vault:', response.error);
        throw new Error(response.error?.message || 'Failed to fetch vault');
      }
      
      console.log('[VaultQuery] Got vault, version from server:', response.data.vault.version);
      
      // Decrypt vault
      const vaultData = decryptVault(response.data.vault, key);
      
      console.log('[VaultQuery] Decrypted vault, updating store with version:', vaultData.version);
      
      // Update store
      setItems(vaultData.items);
      setFolders(vaultData.folders);
      setVersion(vaultData.version);
      setLocalChecksum(response.data.vault.checksum);
      setLastSyncTime(new Date().toISOString());
      
      console.log('[VaultQuery] Store updated, current version:', useVaultStore.getState().version);
      
      return vaultData;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });

  // ================== Save Vault ==================
  const saveMutation = useMutation({
    mutationFn: async (): Promise<UpdateVaultResponse> => {
      const key = await getKey();
      
      // Get current state from store (not from closure to avoid stale values)
      const currentState = useVaultStore.getState();
      const currentItems = currentState.items;
      const currentFolders = currentState.folders;
      const currentVersion = currentState.version;
      
      console.log('[Save] Current version from store:', currentVersion);
      
      // Build vault data from store
      const vaultData: VaultData = {
        items: currentItems,
        folders: currentFolders,
        version: currentVersion + 1,
        updatedAt: new Date().toISOString(),
      };
      
      // Encrypt vault
      const encryptedVault = encryptVault(vaultData, key);
      
      // Send to server
      const response = await api.put<UpdateVaultResponse>(VAULT_ENDPOINTS.UPDATE, {
        blob: encryptedVault.blob,
        encryption: encryptedVault.encryption,
        checksum: encryptedVault.checksum,
        expectedVersion: currentVersion,
      } as UpdateVaultRequest);
      
      if (!response.success || !response.data) {
        // Handle version conflict
        if (response.error?.code === 'VERSION_CONFLICT') {
          // Trigger sync to get latest version
          await vaultQuery.refetch();
          throw new Error('Vault was modified on another device. Please try again.');
        }
        throw new Error(response.error?.message || 'Failed to save vault');
      }
      
      // Update local state
      setVersion(response.data.version);
      setLocalChecksum(encryptedVault.checksum);
      setLastSyncTime(response.data.updatedAt);
      
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VAULT_QUERY_KEYS.data() });
    },
  });

  // ================== Sync Check ==================
  const syncCheckQuery = useQuery({
    queryKey: VAULT_QUERY_KEYS.sync(),
    queryFn: async (): Promise<SyncCheckResponse> => {
      const response = await api.get<SyncCheckResponse>(VAULT_ENDPOINTS.SYNC, {
        params: {
          version,
          checksum: localChecksum,
        },
      });
      
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to check sync status');
      }
      
      // If not in sync, trigger full vault fetch
      if (!response.data.inSync) {
        await vaultQuery.refetch();
      }
      
      return response.data;
    },
    enabled: false, // Manual trigger only
  });

  // Direct vault fetch function (for use in mutations)
  const fetchVaultDirect = async (): Promise<VaultData> => {
    console.log('[FetchVaultDirect] Fetching vault from server...');
    const key = await getKey();
    
    const response = await api.get<GetVaultResponse>(VAULT_ENDPOINTS.GET);
    
    if (!response.success || !response.data) {
      console.log('[FetchVaultDirect] Failed to fetch vault:', response.error);
      throw new Error(response.error?.message || 'Failed to fetch vault');
    }
    
    console.log('[FetchVaultDirect] Got vault, version from server:', response.data.vault.version);
    
    // Decrypt vault
    const vaultData = decryptVault(response.data.vault, key);
    
    console.log('[FetchVaultDirect] Decrypted vault, updating store with version:', vaultData.version);
    
    // Update store
    setItems(vaultData.items);
    setFolders(vaultData.folders);
    setVersion(vaultData.version);
    setLocalChecksum(response.data.vault.checksum);
    setLastSyncTime(new Date().toISOString());
    
    console.log('[FetchVaultDirect] Store updated, current version:', useVaultStore.getState().version);
    
    return vaultData;
  };

  // ================== Local CRUD Operations ==================
  
  // Create item (local + save to server)
  const createItemMutation = useMutation({
    mutationFn: async (
      params: Omit<DecryptedVaultItem, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'isSynced'>
    ): Promise<DecryptedVaultItem> => {
      // Ensure we have the latest vault version from server
      const currentVersion = useVaultStore.getState().version;
      console.log('[CreateItem] Current version:', currentVersion);
      
      if (currentVersion === 0) {
        console.log('[CreateItem] Version is 0, fetching vault from server...');
        await fetchVaultDirect();
        const newVersion = useVaultStore.getState().version;
        console.log('[CreateItem] After fetch, version is:', newVersion);
      }
      
      const id = generateSecureId();
      const now = new Date().toISOString();
      
      const newItem: DecryptedVaultItem = {
        ...params,
        id,
        version: 1,
        isSynced: false,
        createdAt: now,
        updatedAt: now,
      };
      
      // Add to local store
      addItem(newItem);
      
      // Save entire vault to server
      await saveMutation.mutateAsync();
      
      // Mark as synced
      updateItem(id, { isSynced: true });
      
      return newItem;
    },
  });

  // Update item (local + save to server)
  const updateItemMutation = useMutation({
    mutationFn: async (params: { id: string; updates: Partial<DecryptedVaultItem> }) => {
      // Ensure we have the latest vault version from server
      if (useVaultStore.getState().version === 0) {
        await fetchVaultDirect();
      }
      
      const existing = useVaultStore.getState().items.find((i) => i.id === params.id);
      if (!existing) {
        throw new Error('Item not found');
      }
      
      // Update local store
      updateItem(params.id, {
        ...params.updates,
        updatedAt: new Date().toISOString(),
        isSynced: false,
      });
      
      // Save entire vault to server
      await saveMutation.mutateAsync();
      
      // Mark as synced
      updateItem(params.id, { isSynced: true });
      
      return { ...existing, ...params.updates };
    },
  });

  // Delete item (soft delete + save to server)
  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      // Ensure we have the latest vault version from server
      if (useVaultStore.getState().version === 0) {
        await fetchVaultDirect();
      }
      
      // Soft delete
      updateItem(id, {
        isDeleted: true,
        deletedAt: new Date().toISOString(),
        isSynced: false,
      });
      
      // Save to server
      await saveMutation.mutateAsync();
      
      updateItem(id, { isSynced: true });
      
      return id;
    },
  });

  // Permanent delete
  const permanentDeleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Ensure we have the latest vault version from server
      if (useVaultStore.getState().version === 0) {
        await fetchVaultDirect();
      }
      
      // Remove from local store
      deleteItem(id);
      
      // Save to server
      await saveMutation.mutateAsync();
      
      return id;
    },
  });

  // Restore item
  const restoreMutation = useMutation({
    mutationFn: async (id: string) => {
      // Ensure we have the latest vault version from server
      if (useVaultStore.getState().version === 0) {
        await fetchVaultDirect();
      }
      
      updateItem(id, {
        isDeleted: false,
        deletedAt: undefined,
        isSynced: false,
      });
      
      await saveMutation.mutateAsync();
      
      updateItem(id, { isSynced: true });
      
      return id;
    },
  });

  // Toggle favorite
  const toggleFavoriteMutation = useMutation({
    mutationFn: async (id: string) => {
      const item = items.find((i) => i.id === id);
      if (!item) throw new Error('Item not found');
      
      updateItem(id, {
        isFavorite: !item.isFavorite,
        isSynced: false,
      });
      
      await saveMutation.mutateAsync();
      
      updateItem(id, { isSynced: true });
      
      return id;
    },
  });

  // ================== Filtered Views ==================
  
  const passwords = useMemo(
    () => items.filter((i) => i.type === 'password' && !i.isDeleted),
    [items]
  );

  const notes = useMemo(
    () => items.filter((i) => i.type === 'note' && !i.isDeleted),
    [items]
  );

  const cards = useMemo(
    () => items.filter((i) => i.type === 'card' && !i.isDeleted),
    [items]
  );

  const identities = useMemo(
    () => items.filter((i) => i.type === 'identity' && !i.isDeleted),
    [items]
  );

  const favorites = useMemo(
    () => items.filter((i) => i.isFavorite && !i.isDeleted),
    [items]
  );

  const trash = useMemo(() => items.filter((i) => i.isDeleted), [items]);

  const activeItems = useMemo(() => items.filter((i) => !i.isDeleted), [items]);

  // ================== Typed Create Helpers ==================
  
  const createPassword = useCallback(
    (data: PasswordEntry, options?: { folderId?: string; isFavorite?: boolean }) => {
      return createItemMutation.mutateAsync({
        type: 'password',
        data,
        folderId: options?.folderId,
        isFavorite: options?.isFavorite ?? false,
        isDeleted: false,
      });
    },
    [createItemMutation]
  );

  const createNote = useCallback(
    (data: SecureNote, options?: { folderId?: string; isFavorite?: boolean }) => {
      return createItemMutation.mutateAsync({
        type: 'note',
        data,
        folderId: options?.folderId,
        isFavorite: options?.isFavorite ?? false,
        isDeleted: false,
      });
    },
    [createItemMutation]
  );

  const createCard = useCallback(
    (data: CardEntry, options?: { folderId?: string; isFavorite?: boolean }) => {
      return createItemMutation.mutateAsync({
        type: 'card',
        data,
        folderId: options?.folderId,
        isFavorite: options?.isFavorite ?? false,
        isDeleted: false,
      });
    },
    [createItemMutation]
  );

  const createIdentity = useCallback(
    (data: IdentityEntry, options?: { folderId?: string; isFavorite?: boolean }) => {
      return createItemMutation.mutateAsync({
        type: 'identity',
        data,
        folderId: options?.folderId,
        isFavorite: options?.isFavorite ?? false,
        isDeleted: false,
      });
    },
    [createItemMutation]
  );

  return {
    // Data
    items: activeItems,
    passwords,
    notes,
    cards,
    identities,
    favorites,
    trash,
    folders,
    allItems: items,
    version,

    // Loading states
    isLoading: vaultQuery.isLoading,
    isSyncing: vaultQuery.isFetching || saveMutation.isPending,
    syncError: vaultQuery.error,
    lastSyncTime,

    // Sync operations
    sync: vaultQuery.refetch,
    checkSync: syncCheckQuery.refetch,
    save: saveMutation.mutateAsync,

    // Create
    create: createItemMutation.mutateAsync,
    createPassword,
    createNote,
    createCard,
    createIdentity,
    isCreating: createItemMutation.isPending,

    // Update
    update: updateItemMutation.mutateAsync,
    isUpdating: updateItemMutation.isPending,

    // Delete
    delete: deleteItemMutation.mutateAsync,
    permanentDelete: permanentDeleteMutation.mutateAsync,
    restore: restoreMutation.mutateAsync,
    isDeleting: deleteItemMutation.isPending,

    // Favorite
    toggleFavorite: toggleFavoriteMutation.mutateAsync,
    isTogglingFavorite: toggleFavoriteMutation.isPending,

    // Get single item
    getItem: (id: string) => items.find((i) => i.id === id),
  };
}

export default useVault;
