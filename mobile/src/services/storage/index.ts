/**
 * @file Storage Services index
 * @description Export secure storage and biometric services
 */

export {
  // Secure storage
  setSecureItem,
  getSecureItem,
  deleteSecureItem,
  hasSecureItem,
  setSecureItems,
  deleteSecureItems,
  clearAuthStorage,
  clearKeyStorage,
  clearAllSecureStorage,
  storeAuthTokens,
  getAuthTokens,
  storeEncryptionKey,
  getEncryptionKey,
  storeDeviceId,
  getDeviceId,
  STORAGE_KEYS,
  type StorageKey,
  default as secureStorage,
} from './secureStorage';

export {
  // Biometric authentication
  getBiometricStatus,
  getBiometricTypeName,
  authenticateWithBiometrics,
  isBiometricEnabled,
  enableBiometricUnlock,
  disableBiometricUnlock,
  unlockWithBiometrics,
  type BiometricResult,
  type BiometricStatus,
  default as biometric,
} from './biometric';
