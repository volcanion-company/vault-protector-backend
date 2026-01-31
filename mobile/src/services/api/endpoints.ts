/**
 * @file API Endpoints - Centralized endpoint constants
 * @description All API routes used by the mobile app
 */

export const AUTH_ENDPOINTS = {
  // Authentication
  REGISTER: '/auth/register',
  PRELOGIN: '/auth/prelogin', // Get KDF params before login
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  REFRESH: '/auth/refresh',
  CHANGE_PASSWORD: '/auth/change-password',
  SET_MASTER_PASSWORD: '/auth/set-master-password', // Set Master Password after registration

  // Email verification (future)
  VERIFY_EMAIL: '/auth/verify-email',
  RESEND_VERIFICATION: '/auth/resend-verification',

  // Password recovery (future)
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',

  // 2FA (future)
  ENABLE_2FA: '/auth/2fa/enable',
  VERIFY_2FA: '/auth/2fa/verify',
  DISABLE_2FA: '/auth/2fa/disable',
  BACKUP_CODES: '/auth/2fa/backup-codes',
} as const;

export const USER_ENDPOINTS = {
  // Profile
  PROFILE: '/users/me',
  UPDATE_PROFILE: '/users/me',
  DELETE_ACCOUNT: '/users/me',

  // Audit logs
  AUDIT_LOGS: '/users/me/audit-logs',

  // Settings (future)
  SETTINGS: '/users/me/settings',
  UPDATE_SETTINGS: '/users/me/settings',
} as const;

export const VAULT_ENDPOINTS = {
  // Vault - encrypted blob storage
  GET: '/vault',
  UPDATE: '/vault',
  SYNC: '/vault/sync',
} as const;

export const DEVICE_ENDPOINTS = {
  // Devices
  LIST: '/devices',
  DEVICE: (id: string) => `/devices/${id}`,
  UPDATE: (id: string) => `/devices/${id}`,
  DELETE: (id: string) => `/devices/${id}`,
  TRUST: (id: string) => `/devices/${id}/trust`,
} as const;

export const SESSION_ENDPOINTS = {
  // Sessions
  LIST: '/sessions',
  REVOKE: (id: string) => `/sessions/${id}`,
  REVOKE_ALL: '/sessions/revoke-all',
} as const;

// All endpoints
export const ENDPOINTS = {
  AUTH: AUTH_ENDPOINTS,
  USER: USER_ENDPOINTS,
  VAULT: VAULT_ENDPOINTS,
  DEVICE: DEVICE_ENDPOINTS,
  SESSION: SESSION_ENDPOINTS,
} as const;

export default ENDPOINTS;
