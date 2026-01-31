/**
 * @file Secure Storage Service - Wrapper for expo-secure-store
 * @description Platform-secure storage for sensitive data (iOS Keychain, Android Keystore)
 */

import * as SecureStore from 'expo-secure-store';

// Storage keys
export const STORAGE_KEYS = {
  // Authentication
  ACCESS_TOKEN: 'vault_access_token',
  REFRESH_TOKEN: 'vault_refresh_token',
  DEVICE_ID: 'vault_device_id',
  
  // Encryption
  MASTER_KEY: 'vault_master_key',
  MASTER_KEY_HASH: 'vault_master_key_hash', // Hash for password verification
  VAULT_KEY: 'vault_encryption_key',
  ENCRYPTION_KEY: 'vault_encryption_key', // Alias for VAULT_KEY
  KEY_SALT: 'vault_key_salt',
  WRAPPED_VAULT_KEY: 'vault_wrapped_key', // Wrapped vault key from server (for unlock)
  
  // Biometrics
  BIOMETRIC_KEY: 'vault_biometric_key',
  BIOMETRIC_ENABLED: 'vault_biometric_enabled',
  
  // User
  USER_ID: 'vault_user_id',
  USER_EMAIL: 'vault_user_email',
  
  // Session
  LAST_ACTIVE: 'vault_last_active',
  SESSION_ID: 'vault_session_id',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

// Secure store options
const SECURE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

/**
 * Store a value securely
 * @param key - Storage key
 * @param value - Value to store
 */
export async function setSecureItem(key: StorageKey, value: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(key, value, SECURE_OPTIONS);
  } catch (error) {
    console.error(`Failed to store secure item [${key}]:`, error);
    throw new Error(`Failed to store secure item: ${key}`);
  }
}

/**
 * Retrieve a value from secure storage
 * @param key - Storage key
 * @returns Stored value or null if not found
 */
export async function getSecureItem(key: StorageKey): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key, SECURE_OPTIONS);
  } catch (error) {
    console.error(`Failed to retrieve secure item [${key}]:`, error);
    return null;
  }
}

/**
 * Delete a value from secure storage
 * @param key - Storage key
 */
export async function deleteSecureItem(key: StorageKey): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(key, SECURE_OPTIONS);
  } catch (error) {
    console.error(`Failed to delete secure item [${key}]:`, error);
    // Don't throw - deletion failure is not critical
  }
}

/**
 * Check if a key exists in secure storage
 * @param key - Storage key
 * @returns True if key exists
 */
export async function hasSecureItem(key: StorageKey): Promise<boolean> {
  const value = await getSecureItem(key);
  return value !== null;
}

/**
 * Store multiple values securely
 * @param items - Object with key-value pairs to store
 */
export async function setSecureItems(
  items: Partial<Record<StorageKey, string>>
): Promise<void> {
  const promises = Object.entries(items).map(([key, value]) =>
    value !== undefined ? setSecureItem(key as StorageKey, value) : Promise.resolve()
  );
  await Promise.all(promises);
}

/**
 * Delete multiple values from secure storage
 * @param keys - Array of keys to delete
 */
export async function deleteSecureItems(keys: StorageKey[]): Promise<void> {
  const promises = keys.map((key) => deleteSecureItem(key));
  await Promise.all(promises);
}

/**
 * Clear all authentication-related secure storage
 */
export async function clearAuthStorage(): Promise<void> {
  await deleteSecureItems([
    STORAGE_KEYS.ACCESS_TOKEN,
    STORAGE_KEYS.REFRESH_TOKEN,
    STORAGE_KEYS.SESSION_ID,
    STORAGE_KEYS.LAST_ACTIVE,
  ]);
}

/**
 * Clear all encryption keys from secure storage
 */
export async function clearKeyStorage(): Promise<void> {
  await deleteSecureItems([
    STORAGE_KEYS.MASTER_KEY,
    STORAGE_KEYS.VAULT_KEY,
    STORAGE_KEYS.KEY_SALT,
    STORAGE_KEYS.BIOMETRIC_KEY,
  ]);
}

/**
 * Clear all secure storage (logout)
 */
export async function clearAllSecureStorage(): Promise<void> {
  const allKeys = Object.values(STORAGE_KEYS) as StorageKey[];
  await deleteSecureItems(allKeys);
}

/**
 * Store auth tokens securely
 * @param accessToken - JWT access token
 * @param refreshToken - JWT refresh token
 */
export async function storeAuthTokens(
  accessToken: string,
  refreshToken: string
): Promise<void> {
  await setSecureItems({
    [STORAGE_KEYS.ACCESS_TOKEN]: accessToken,
    [STORAGE_KEYS.REFRESH_TOKEN]: refreshToken,
  });
}

/**
 * Retrieve auth tokens
 * @returns Object with access and refresh tokens
 */
export async function getAuthTokens(): Promise<{
  accessToken: string | null;
  refreshToken: string | null;
}> {
  const [accessToken, refreshToken] = await Promise.all([
    getSecureItem(STORAGE_KEYS.ACCESS_TOKEN),
    getSecureItem(STORAGE_KEYS.REFRESH_TOKEN),
  ]);
  return { accessToken, refreshToken };
}

/**
 * Store encryption key
 * @param key - Hex-encoded encryption key
 */
export async function storeEncryptionKey(key: string): Promise<void> {
  await setSecureItem(STORAGE_KEYS.VAULT_KEY, key);
}

/**
 * Retrieve encryption key
 * @returns Hex-encoded encryption key or null
 */
export async function getEncryptionKey(): Promise<string | null> {
  return getSecureItem(STORAGE_KEYS.VAULT_KEY);
}

/**
 * Store device ID
 * @param deviceId - Unique device identifier
 */
export async function storeDeviceId(deviceId: string): Promise<void> {
  await setSecureItem(STORAGE_KEYS.DEVICE_ID, deviceId);
}

/**
 * Retrieve device ID
 * @returns Device ID or null
 */
export async function getDeviceId(): Promise<string | null> {
  return getSecureItem(STORAGE_KEYS.DEVICE_ID);
}

// Export default object for convenience
export default {
  get: getSecureItem,
  set: setSecureItem,
  delete: deleteSecureItem,
  has: hasSecureItem,
  setMany: setSecureItems,
  deleteMany: deleteSecureItems,
  clearAuth: clearAuthStorage,
  clearKeys: clearKeyStorage,
  clearAll: clearAllSecureStorage,
  storeTokens: storeAuthTokens,
  getTokens: getAuthTokens,
  storeKey: storeEncryptionKey,
  getKey: getEncryptionKey,
  storeDeviceId,
  getDeviceId,
  KEYS: STORAGE_KEYS,
};
