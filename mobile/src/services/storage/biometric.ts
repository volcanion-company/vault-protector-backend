/**
 * @file Biometric Service - Fingerprint/Face ID authentication
 * @description Handle biometric authentication with expo-local-authentication
 */

import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';
import { getSecureItem, setSecureItem, deleteSecureItem, STORAGE_KEYS } from './secureStorage';

export interface BiometricResult {
  success: boolean;
  error?: string;
  errorCode?: string;
}

export interface BiometricStatus {
  isAvailable: boolean;
  isEnrolled: boolean;
  biometryType: 'fingerprint' | 'facial' | 'iris' | 'none';
  canAuthenticate: boolean;
}

/**
 * Check if biometric authentication is available and enrolled
 * @returns Biometric status information
 */
export async function getBiometricStatus(): Promise<BiometricStatus> {
  try {
    // Check hardware availability
    const isAvailable = await LocalAuthentication.hasHardwareAsync();
    
    // Check if biometrics are enrolled
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    
    // Get supported authentication types
    const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
    
    // Determine biometry type
    let biometryType: BiometricStatus['biometryType'] = 'none';
    if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      biometryType = 'facial';
    } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      biometryType = 'fingerprint';
    } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      biometryType = 'iris';
    }
    
    return {
      isAvailable,
      isEnrolled,
      biometryType,
      canAuthenticate: isAvailable && isEnrolled,
    };
  } catch (error) {
    console.error('Failed to get biometric status:', error);
    return {
      isAvailable: false,
      isEnrolled: false,
      biometryType: 'none',
      canAuthenticate: false,
    };
  }
}

/**
 * Get human-readable biometric type name
 * @param type - Biometry type
 * @returns Display name
 */
export function getBiometricTypeName(type: BiometricStatus['biometryType']): string {
  switch (type) {
    case 'facial':
      return Platform.OS === 'ios' ? 'Face ID' : 'Face Recognition';
    case 'fingerprint':
      return Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint';
    case 'iris':
      return 'Iris Scan';
    default:
      return 'Biometrics';
  }
}

/**
 * Authenticate user with biometrics
 * @param promptMessage - Optional custom prompt message
 * @returns Authentication result
 */
export async function authenticateWithBiometrics(
  promptMessage?: string
): Promise<BiometricResult> {
  try {
    const status = await getBiometricStatus();
    
    if (!status.canAuthenticate) {
      return {
        success: false,
        error: 'Biometric authentication is not available',
        errorCode: 'NOT_AVAILABLE',
      };
    }
    
    const biometricName = getBiometricTypeName(status.biometryType);
    
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: promptMessage || `Authenticate with ${biometricName}`,
      cancelLabel: 'Cancel',
      fallbackLabel: 'Use Password',
      disableDeviceFallback: false,
    });
    
    if (result.success) {
      return { success: true };
    }
    
    // Handle specific errors
    let error = 'Authentication failed';
    let errorCode = 'FAILED';
    
    if (result.error === 'user_cancel') {
      error = 'Authentication cancelled by user';
      errorCode = 'CANCELLED';
    } else if (result.error === 'user_fallback') {
      error = 'User chose to use password';
      errorCode = 'FALLBACK';
    } else if (result.error === 'lockout') {
      error = 'Too many failed attempts. Try again later';
      errorCode = 'LOCKOUT';
    } else if (result.error === 'not_enrolled') {
      error = 'No biometrics enrolled on this device';
      errorCode = 'NOT_ENROLLED';
    }
    
    return { success: false, error, errorCode };
  } catch (error) {
    console.error('Biometric authentication error:', error);
    return {
      success: false,
      error: 'An error occurred during authentication',
      errorCode: 'ERROR',
    };
  }
}

/**
 * Check if biometric unlock is enabled for this app
 * @returns True if enabled
 */
export async function isBiometricEnabled(): Promise<boolean> {
  const value = await getSecureItem(STORAGE_KEYS.BIOMETRIC_ENABLED);
  return value === 'true';
}

/**
 * Enable biometric unlock
 * @param encryptedKey - Encrypted master key to store
 * @returns Success status
 */
export async function enableBiometricUnlock(encryptedKey: string): Promise<BiometricResult> {
  try {
    // First verify biometrics work
    const authResult = await authenticateWithBiometrics(
      'Authenticate to enable biometric unlock'
    );
    
    if (!authResult.success) {
      return authResult;
    }
    
    // Store the encrypted key
    await setSecureItem(STORAGE_KEYS.BIOMETRIC_KEY, encryptedKey);
    await setSecureItem(STORAGE_KEYS.BIOMETRIC_ENABLED, 'true');
    
    return { success: true };
  } catch (error) {
    console.error('Failed to enable biometric unlock:', error);
    return {
      success: false,
      error: 'Failed to enable biometric unlock',
      errorCode: 'ENABLE_FAILED',
    };
  }
}

/**
 * Disable biometric unlock
 */
export async function disableBiometricUnlock(): Promise<void> {
  await deleteSecureItem(STORAGE_KEYS.BIOMETRIC_KEY);
  await setSecureItem(STORAGE_KEYS.BIOMETRIC_ENABLED, 'false');
}

/**
 * Unlock vault using biometrics
 * @returns Encrypted master key if successful
 */
export async function unlockWithBiometrics(): Promise<{
  success: boolean;
  key?: string;
  error?: string;
}> {
  try {
    const isEnabled = await isBiometricEnabled();
    if (!isEnabled) {
      return { success: false, error: 'Biometric unlock is not enabled' };
    }
    
    const authResult = await authenticateWithBiometrics('Unlock Vault');
    
    if (!authResult.success) {
      return { success: false, error: authResult.error };
    }
    
    const key = await getSecureItem(STORAGE_KEYS.BIOMETRIC_KEY);
    
    if (!key) {
      return { success: false, error: 'Biometric key not found' };
    }
    
    return { success: true, key };
  } catch (error) {
    console.error('Failed to unlock with biometrics:', error);
    return { success: false, error: 'Failed to unlock with biometrics' };
  }
}

// Export default object
export default {
  getStatus: getBiometricStatus,
  getTypeName: getBiometricTypeName,
  authenticate: authenticateWithBiometrics,
  isEnabled: isBiometricEnabled,
  enable: enableBiometricUnlock,
  disable: disableBiometricUnlock,
  unlock: unlockWithBiometrics,
};
