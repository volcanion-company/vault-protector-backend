// API Version
export const API_VERSION = 'v1';
export const API_PREFIX = `/api/${API_VERSION}`;

// Rate Limiting
export const RATE_LIMIT = {
  API: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX: 100,
  },
  AUTH: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX: 10,
  },
  PASSWORD_RESET: {
    WINDOW_MS: 60 * 60 * 1000, // 1 hour
    MAX: 3,
  },
} as const;

// Session & Token
export const SESSION = {
  ACCESS_TOKEN_EXPIRY: '15m',
  REFRESH_TOKEN_EXPIRY: '7d',
  MAX_SESSIONS_PER_USER: 10,
  ACTIVITY_UPDATE_INTERVAL: 5 * 60 * 1000, // 5 minutes
} as const;

// Security
export const SECURITY = {
  MAX_FAILED_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION_MINUTES: 30,
  EMAIL_VERIFICATION_EXPIRY_HOURS: 24,
  PASSWORD_RESET_EXPIRY_MINUTES: 60,
} as const;

// Vault
export const VAULT = {
  MAX_BLOB_SIZE_MB: 10,
  MAX_BLOB_SIZE_BYTES: 10 * 1024 * 1024,
  SUPPORTED_ALGORITHMS: ['aes-256-gcm', 'xchacha20-poly1305'] as const,
} as const;

// Device Platforms
export const DEVICE_PLATFORMS = [
  'web',
  'desktop-windows',
  'desktop-macos',
  'desktop-linux',
  'ios',
  'android',
] as const;

// Audit Actions
export const AUDIT_ACTIONS = {
  USER: {
    REGISTER: 'user.register',
    LOGIN: 'user.login',
    LOGIN_FAILED: 'user.login.failed',
    LOGOUT: 'user.logout',
    PASSWORD_CHANGE: 'user.password.change',
    EMAIL_VERIFY: 'user.email.verify',
  },
  VAULT: {
    SYNC: 'vault.sync',
    UPDATE: 'vault.update',
  },
  SESSION: {
    CREATE: 'session.create',
    REVOKE: 'session.revoke',
  },
  DEVICE: {
    ADD: 'device.add',
    REMOVE: 'device.remove',
    TRUST: 'device.trust',
  },
} as const;

// Redis Key Prefixes
export const REDIS_KEYS = {
  RATE_LIMIT: {
    API: 'rl:api:',
    AUTH: 'rl:auth:',
    RESET: 'rl:reset:',
  },
  SESSION: {
    DATA: 'session:',
    ACTIVITY: 'session:activity:',
  },
  BLACKLIST: 'blacklist:',
  EMAIL_VERIFY: 'email:verify:',
  PASSWORD_RESET: 'pwd:reset:',
  LOGIN_ATTEMPTS: 'login:attempts:',
  PRELOGIN: 'prelogin:',
} as const;
