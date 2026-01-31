// Types
export interface VaultItem {
  id: string;
  type: VaultItemType;
  encryptedData: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  isSynced: boolean;
  isDeleted: boolean;
}

export type VaultItemType = 'password' | 'note' | 'card' | 'identity';

// Decrypted data types
export interface PasswordEntry {
  title: string;
  username: string;
  password: string;
  url?: string;
  notes?: string;
  tags: string[];
  favorite: boolean;
}

export interface SecureNote {
  title: string;
  content: string;
  tags: string[];
  favorite: boolean;
}

export interface CardEntry {
  title: string;
  cardholderName: string;
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  notes?: string;
  tags: string[];
  favorite: boolean;
}

export interface IdentityEntry {
  title: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  tags: string[];
  favorite: boolean;
}

// Sync
export interface SyncMetadata {
  lastSyncAt: string | null;
  serverVersion: number;
  etag: string | null;
}

// Decrypted vault item wrapper
export interface DecryptedVaultItem<T = PasswordEntry | SecureNote | CardEntry | IdentityEntry> {
  id: string;
  type: VaultItemType;
  data: T;
  version: number;
  createdAt: string;
  updatedAt: string;
  isSynced: boolean;
  isFavorite: boolean;
  isDeleted: boolean;
  folderId?: string;
  deletedAt?: string;
}

// Type alias for backwards compatibility
export type NoteEntry = SecureNote;
