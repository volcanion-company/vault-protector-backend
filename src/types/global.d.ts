// Global type declarations

// Device platform types
export type DevicePlatform =
  | 'web'
  | 'desktop-windows'
  | 'desktop-macos'
  | 'desktop-linux'
  | 'ios'
  | 'android';

// Audit action types
export type AuditAction =
  | 'user.register'
  | 'user.login'
  | 'user.login.failed'
  | 'user.logout'
  | 'user.password.change'
  | 'user.email.verify'
  | 'vault.sync'
  | 'vault.update'
  | 'session.create'
  | 'session.revoke'
  | 'device.add'
  | 'device.remove'
  | 'device.trust';

// User status types
export type UserStatus = 'active' | 'locked' | 'suspended';

// Encryption algorithms
export type EncryptionAlgorithm = 'aes-256-gcm' | 'xchacha20-poly1305';

// KDF algorithms
export type KdfAlgorithm = 'argon2id' | 'pbkdf2';

// Pagination params
export interface PaginationParams {
  page: number;
  limit: number;
}

// Sort params
export interface SortParams {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}
