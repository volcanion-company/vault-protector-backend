/**
 * @file useBiometric Hook - Biometric authentication
 * @description Custom hook for biometric unlock functionality
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';
import {
  getBiometricStatus,
  getBiometricTypeName,
  authenticateWithBiometrics,
  enableBiometricUnlock,
  disableBiometricUnlock,
  unlockWithBiometrics,
  type BiometricStatus,
} from '@/services/storage';
import { getEncryptionKey, storeEncryptionKey } from '@/services/storage';

export function useBiometric() {
  const [status, setStatus] = useState<BiometricStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { unlock } = useAuthStore();
  const { biometricEnabled, setBiometricEnabled } = useSettingsStore();

  // Load biometric status on mount
  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const biometricStatus = await getBiometricStatus();
      setStatus(biometricStatus);
    } catch (err) {
      setError('Failed to load biometric status');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get display name for biometric type
  const biometricName = status ? getBiometricTypeName(status.biometryType) : 'Biometrics';

  // Check if biometric can be enabled
  const canEnable = status?.canAuthenticate ?? false;

  // Enable biometric unlock
  const enable = useCallback(async (): Promise<boolean> => {
    setError(null);

    if (!status?.canAuthenticate) {
      setError('Biometric authentication is not available on this device');
      return false;
    }

    try {
      // Get current encryption key
      const key = await getEncryptionKey();
      if (!key) {
        setError('Encryption key not found. Please login again.');
        return false;
      }

      // Enable with encrypted key
      const result = await enableBiometricUnlock(key);

      if (result.success) {
        setBiometricEnabled(true);
        return true;
      } else {
        setError(result.error || 'Failed to enable biometric unlock');
        return false;
      }
    } catch (err) {
      setError('Failed to enable biometric unlock');
      console.error(err);
      return false;
    }
  }, [status, setBiometricEnabled]);

  // Disable biometric unlock
  const disable = useCallback(async (): Promise<boolean> => {
    setError(null);

    try {
      await disableBiometricUnlock();
      setBiometricEnabled(false);
      return true;
    } catch (err) {
      setError('Failed to disable biometric unlock');
      console.error(err);
      return false;
    }
  }, [setBiometricEnabled]);

  // Toggle biometric unlock
  const toggle = useCallback(async (): Promise<boolean> => {
    if (biometricEnabled) {
      return disable();
    } else {
      return enable();
    }
  }, [biometricEnabled, enable, disable]);

  // Authenticate with biometrics (just verify identity)
  const authenticate = useCallback(
    async (prompt?: string): Promise<boolean> => {
      setError(null);

      try {
        const result = await authenticateWithBiometrics(prompt);

        if (result.success) {
          return true;
        } else {
          if (result.errorCode !== 'CANCELLED') {
            setError(result.error || 'Authentication failed');
          }
          return false;
        }
      } catch (err) {
        setError('Authentication failed');
        console.error(err);
        return false;
      }
    },
    []
  );

  // Unlock vault with biometrics
  const unlockVault = useCallback(async (): Promise<boolean> => {
    setError(null);

    if (!biometricEnabled) {
      setError('Biometric unlock is not enabled');
      return false;
    }

    try {
      const result = await unlockWithBiometrics();

      if (result.success && result.key) {
        // Restore encryption key
        await storeEncryptionKey(result.key);
        // Unlock the vault
        unlock();
        return true;
      } else {
        if (result.error !== 'Authentication cancelled by user') {
          setError(result.error || 'Failed to unlock');
        }
        return false;
      }
    } catch (err) {
      setError('Failed to unlock with biometrics');
      console.error(err);
      return false;
    }
  }, [biometricEnabled, unlock]);

  return {
    // Status
    status,
    isLoading,
    error,
    biometricName,
    canEnable,
    isEnabled: biometricEnabled,

    // Actions
    refresh: loadStatus,
    enable,
    disable,
    toggle,
    authenticate,
    unlockVault,
    clearError: () => setError(null),
  };
}

export default useBiometric;
