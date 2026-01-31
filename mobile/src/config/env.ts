import Constants from 'expo-constants';

const ENV = {
  development: {
    API_URL: 'http://192.168.10.126:5000/api/v1',
    DEBUG: true,
  },
  staging: {
    API_URL: 'https://staging-api.vaultprotector.com/api/v1',
    DEBUG: true,
  },
  production: {
    API_URL: 'https://api.vaultprotector.com/api/v1',
    DEBUG: false,
  },
};

type Environment = 'development' | 'staging' | 'production';

const getEnvVars = (): (typeof ENV)['development'] => {
  const releaseChannel = Constants.expoConfig?.extra?.releaseChannel as Environment | undefined;

  if (releaseChannel === 'staging') {
    return ENV.staging;
  }
  if (releaseChannel === 'production') {
    return ENV.production;
  }
  return ENV.development;
};

export const { API_URL, DEBUG } = getEnvVars();

// App constants
export const APP_NAME = 'Vault Protector';
export const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';
export const BUILD_NUMBER = Constants.expoConfig?.ios?.buildNumber ?? Constants.expoConfig?.android?.versionCode?.toString() ?? '1';

// API settings
export const REQUEST_TIMEOUT = 30000; // 30 seconds

// Security settings
export const CLIPBOARD_TIMEOUT_MS = 60000; // 1 minute
export const AUTO_LOCK_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 128;

// KDF parameters for Argon2id (when using native build)
export const KDF_PARAMS_ARGON2 = {
  memory: 65536, // 64 MB
  iterations: 3,
  parallelism: 4,
  hashLength: 32,
};

// KDF parameters for PBKDF2 (Expo Go compatible)
// Using lower iterations for dev/testing - increase for production
export const KDF_PARAMS = {
  memory: 0, // Not used for PBKDF2, but required by backend
  iterations: 10000, // 10k for dev testing - increase to 310k+ for production
  parallelism: 1, // Not used for PBKDF2, but required by backend
  hashLength: 32,
};
