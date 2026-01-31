/**
 * @file useAuth Hook - Authentication logic
 * @description Custom hook for auth operations with Zero-Knowledge API integration
 * 
 * Backend API contract:
 * - POST /auth/prelogin - Get KDF params for email
 * - POST /auth/register - Register with authVerifier, kdf, wrappedVaultKey, initialVault, device
 * - POST /auth/login - Login with authVerifier, device
 * - POST /auth/refresh - Refresh tokens
 * - POST /auth/logout - Logout current session
 * - POST /auth/change-password - Change password with new authVerifier and re-wrapped vault key
 */

import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { api, AUTH_ENDPOINTS } from '@/services/api';
import {
  deriveKeyFromPassword,
  deriveSubKeys,
  generateSalt,
  bytesToHex,
  hexToBytes,
  encryptData,
  generateRandomBytes,
} from '@/services/crypto';
import { sha256 } from '@noble/hashes/sha2.js';
import { gcm } from '@noble/ciphers/aes.js';
import { randomBytes } from '@noble/ciphers/utils.js';
import {
  storeAuthTokens,
  getAuthTokens,
  clearAllSecureStorage,
  storeEncryptionKey,
  setSecureItem,
  getSecureItem,
  STORAGE_KEYS,
} from '@/services/storage';
import { KDF_PARAMS } from '@/config/env';
import type { User } from '@/types/auth.types';
import * as Device from 'expo-device';
import * as Application from 'expo-application';

// ================== API Types (matching backend) ==================

interface KdfParams {
  algorithm: 'argon2id' | 'pbkdf2';
  salt: string; // base64 encoded
  memory: number;
  iterations: number;
  parallelism: number;
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
}

interface DeviceInfo {
  name: string;
  platform: 'ios' | 'android' | 'web';
  deviceIdentifier: string;
}

// Prelogin response
interface PreloginResponse {
  kdf: KdfParams;
}

// Register request/response
interface RegisterRequest {
  email: string;
  authVerifier: string; // base64 encoded
  kdf: KdfParams;
  wrappedVaultKey?: string; // base64 encoded - optional until Master Password is set
  initialVault?: VaultBlob; // optional until Master Password is set
  device: DeviceInfo;
}

interface RegisterResponse {
  user: {
    id: string;
    email: string;
    emailVerified: boolean;
    hasMasterPassword: boolean;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
  device: {
    id: string;
    name: string;
    isNew: boolean;
  };
}

// Login request/response
interface LoginRequest {
  email: string;
  authVerifier: string; // base64 encoded
  device: DeviceInfo;
}

interface LoginResponse {
  user: {
    id: string;
    email: string;
    emailVerified: boolean;
    hasMasterPassword: boolean;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
  device: {
    id: string;
    name: string;
    isNew: boolean;
  };
  wrappedVaultKey: string | null; // base64 encoded - null if Master Password not set
}

// Hook params
interface LoginParams {
  email: string;
  password: string;
}

interface RegisterParams {
  email: string;
  password: string;
}

// ================== Helper Functions ==================

/**
 * Get device info for API requests
 */
async function getDeviceInfo(): Promise<DeviceInfo> {
  const deviceName = Device.deviceName || Device.modelName || 'Unknown Device';
  const platform = Device.osName?.toLowerCase() === 'ios' ? 'ios' : 'android';
  
  // Get or generate device identifier
  let deviceIdentifier = await getSecureItem(STORAGE_KEYS.DEVICE_ID);
  if (!deviceIdentifier) {
    // Generate unique device ID
    const androidId = Application.getAndroidId?.() || '';
    const randomPart = bytesToHex(generateRandomBytes(8));
    deviceIdentifier = `${platform}-${androidId || randomPart}-${Date.now()}`;
    await setSecureItem(STORAGE_KEYS.DEVICE_ID, deviceIdentifier);
  }

  return {
    name: deviceName,
    platform,
    deviceIdentifier,
  };
}

/**
 * Convert Uint8Array to base64 string
 */
function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert base64 string to Uint8Array
 */
function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Create an empty encrypted vault for new users
 * Uses direct AES-256-GCM encryption (matching decryptVault in useVault.ts)
 */
function createInitialVault(vaultKey: Uint8Array): VaultBlob {
  const emptyVault = JSON.stringify({
    items: [],
    folders: [],
    version: 1,
    createdAt: new Date().toISOString(),
  });

  // Use direct GCM encryption (same as encryptVault in useVault.ts)
  const iv = randomBytes(12); // 96-bit IV for GCM
  const aes = gcm(vaultKey, iv);
  const ciphertext = aes.encrypt(new TextEncoder().encode(emptyVault));
  
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
  };
}

/**
 * Wrap the vault key with the master key for storage on server
 */
function wrapVaultKey(vaultKey: Uint8Array, masterKey: Uint8Array): string {
  const { ciphertext, iv, tag, salt } = encryptData(
    uint8ArrayToBase64(vaultKey),
    masterKey
  );
  // Format: iv:ciphertext:tag:salt (all hex encoded)
  return `${iv}:${ciphertext}:${tag}:${salt}`;
}

/**
 * Unwrap the vault key using the master key
 */
function unwrapVaultKey(wrappedKey: string, masterKey: Uint8Array): Uint8Array {
  const parts = wrappedKey.split(':');
  // Support both old format (iv:ciphertext:tag) and new format (iv:ciphertext:tag:salt)
  const [iv, ciphertext, tag, salt = ''] = parts;
  
  // Import decrypt function dynamically to avoid circular imports
  const { decryptData } = require('@/services/crypto');
  const vaultKeyBase64 = decryptData(
    { ciphertext, iv, tag, salt },
    masterKey
  );
  return base64ToUint8Array(vaultKeyBase64);
}

// ================== Hook ==================

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    login: storeLogin,
    logout: storeLogout,
    setDeviceId,
    isAuthenticated,
    isLocked,
    user,
  } = useAuthStore();

  // ================== Prelogin ==================
  const preloginMutation = useMutation({
    mutationFn: async (email: string): Promise<PreloginResponse> => {
      // GET request with query parameter
      const response = await api.get<PreloginResponse>(
        `${AUTH_ENDPOINTS.PRELOGIN}?email=${encodeURIComponent(email)}`
      );

      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Prelogin failed');
      }

      return response.data;
    },
  });

  // ================== Login ==================
  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: LoginParams): Promise<LoginResponse> => {
      // Step 1: Get KDF params from server
      const preloginResponse = await preloginMutation.mutateAsync(email);
      const { kdf } = preloginResponse;

      // Step 2: Derive keys from login password
      const salt = base64ToUint8Array(kdf.salt);
      const derivedKey = await deriveKeyFromPassword(password, salt);
      const { authKey } = deriveSubKeys(derivedKey);

      // Step 3: Create auth verifier (hash of auth key)
      const authVerifier = uint8ArrayToBase64(authKey);

      // Step 4: Get device info
      const device = await getDeviceInfo();

      // Step 5: Send login request
      const response = await api.post<LoginResponse>(AUTH_ENDPOINTS.LOGIN, {
        email,
        authVerifier,
        device,
      } as LoginRequest);

      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Login failed');
      }

      const hasMasterPassword = response.data.user.hasMasterPassword;

      // Step 6: Store tokens and salt
      await storeAuthTokens(
        response.data.tokens.accessToken,
        response.data.tokens.refreshToken
      );
      await setSecureItem(STORAGE_KEYS.KEY_SALT, kdf.salt);

      // Step 7: If user has Master Password, store the wrapped vault key for unlock screen
      if (hasMasterPassword && response.data.wrappedVaultKey) {
        await setSecureItem(STORAGE_KEYS.WRAPPED_VAULT_KEY, response.data.wrappedVaultKey);
      }

      // Step 8: Update store with hasMasterPassword flag
      // isLocked = true because user still needs to enter Master Password
      await storeLogin(
        {
          id: response.data.user.id,
          email: response.data.user.email,
          emailVerified: response.data.user.emailVerified,
        } as User,
        response.data.tokens.accessToken,
        response.data.tokens.refreshToken,
        hasMasterPassword
      );
      setDeviceId(response.data.device.id);

      return response.data;
    },
    onSuccess: (data) => {
      // Navigate based on whether Master Password is set
      if (data.user.hasMasterPassword) {
        // User has Master Password, go to unlock screen to enter it
        router.replace('/(auth)/unlock');
      } else {
        // User doesn't have Master Password, go to set it
        router.replace({ pathname: '/(auth)/set-master-password' } as never);
      }
    },
  });

  // ================== Register ==================
  // Registration now only creates the account with email/password
  // Master Password and vault are set up separately after registration
  const registerMutation = useMutation({
    mutationFn: async ({ email, password }: RegisterParams): Promise<RegisterResponse> => {
      // Step 1: Generate salt for this user
      const salt = generateSalt();

      // Step 2: Derive keys from password (login password, not Master Password)
      const derivedKey = await deriveKeyFromPassword(password, salt);
      const { authKey } = deriveSubKeys(derivedKey);

      // Step 3: Create auth verifier
      const authVerifier = uint8ArrayToBase64(authKey);

      // Step 4: Get device info
      const device = await getDeviceInfo();

      // Step 5: Build KDF params
      const kdfParams: KdfParams = {
        algorithm: 'pbkdf2', // Using PBKDF2 for Expo Go compatibility
        salt: uint8ArrayToBase64(salt),
        memory: KDF_PARAMS.memory,
        iterations: KDF_PARAMS.iterations,
        parallelism: KDF_PARAMS.parallelism,
      };

      // Build request payload - NO wrappedVaultKey or initialVault yet
      const requestPayload: RegisterRequest = {
        email,
        authVerifier,
        kdf: kdfParams,
        device,
        // wrappedVaultKey and initialVault will be set when user creates Master Password
      };

      // Debug: Log the request payload structure
      console.log('Registration payload:', JSON.stringify({
        email: requestPayload.email,
        authVerifier: requestPayload.authVerifier?.substring(0, 20) + '...',
        kdf: requestPayload.kdf,
        device: requestPayload.device,
      }, null, 2));

      // Step 6: Send registration request
      const response = await api.post<RegisterResponse>(AUTH_ENDPOINTS.REGISTER, requestPayload);

      if (!response.success || !response.data) {
        // Log full error details
        console.error('Registration API error:', JSON.stringify(response.error, null, 2));
        throw new Error(response.error?.message || 'Registration failed');
      }

      // Step 7: Store tokens and salt (but no vault key yet - Master Password not set)
      await storeAuthTokens(
        response.data.tokens.accessToken,
        response.data.tokens.refreshToken
      );
      await setSecureItem(STORAGE_KEYS.KEY_SALT, uint8ArrayToBase64(salt));

      // Step 8: Update store with hasMasterPassword = false
      await storeLogin(
        {
          id: response.data.user.id,
          email: response.data.user.email,
          emailVerified: response.data.user.emailVerified,
        } as User,
        response.data.tokens.accessToken,
        response.data.tokens.refreshToken,
        false // hasMasterPassword = false
      );
      setDeviceId(response.data.device.id);

      return response.data;
    },
    onSuccess: () => {
      // After registration, go to set Master Password screen
      router.replace({ pathname: '/(auth)/set-master-password' } as never);
    },
  });

  // ================== Logout ==================
  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        await api.post(AUTH_ENDPOINTS.LOGOUT);
      } catch (error) {
        console.warn('Logout API call failed:', error);
      }

      await clearAllSecureStorage();
      await storeLogout();
      queryClient.clear();
    },
    onSuccess: () => {
      router.replace('/(auth)/login');
    },
  });

  // ================== Lock Vault ==================
  const lockVault = useCallback(() => {
    useAuthStore.getState().lock();
    router.replace('/(auth)/unlock');
  }, [router]);

  // ================== Set Master Password ==================
  // Used after registration or login when Master Password hasn't been set yet
  interface SetMasterPasswordResponse {
    success: boolean;
  }

  const setMasterPasswordMutation = useMutation({
    mutationFn: async (masterPassword: string): Promise<SetMasterPasswordResponse> => {
      // Step 1: Generate vault key
      const vaultKey = generateRandomBytes(32); // 256-bit key for vault encryption

      // Step 2: Derive master key from Master Password
      // Use the same salt that was created during registration
      const saltBase64 = await getSecureItem(STORAGE_KEYS.KEY_SALT);
      if (!saltBase64) throw new Error('Salt not found');
      
      const salt = base64ToUint8Array(saltBase64);
      const derivedKey = await deriveKeyFromPassword(masterPassword, salt);
      const { masterKey } = deriveSubKeys(derivedKey);

      // Step 3: Wrap vault key with master key
      const wrappedVaultKey = wrapVaultKey(vaultKey, masterKey);

      // Step 4: Create initial empty vault
      const initialVault = createInitialVault(vaultKey);

      // Step 5: Send to backend
      const response = await api.post<SetMasterPasswordResponse>(
        AUTH_ENDPOINTS.SET_MASTER_PASSWORD,
        {
          wrappedVaultKey,
          initialVault,
        }
      );

      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to set Master Password');
      }

      // Step 6: Store vault key and master key hash locally
      await storeEncryptionKey(bytesToHex(vaultKey));
      await setSecureItem(STORAGE_KEYS.MASTER_KEY_HASH, bytesToHex(sha256(masterKey)));

      // Step 7: Update store - now has Master Password and is unlocked
      useAuthStore.getState().setHasMasterPassword(true);
      useAuthStore.getState().unlock();

      return { success: true };
    },
    onSuccess: () => {
      // Go to main vault screen
      router.replace('/(tabs)/vault');
    },
  });

  // ================== Forgot Password ==================
  const forgotPasswordMutation = useMutation({
    mutationFn: async (email: string): Promise<void> => {
      const response = await api.post(AUTH_ENDPOINTS.FORGOT_PASSWORD, { email });

      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to send reset email');
      }
    },
  });

  // ================== Change Password ==================
  const changePasswordMutation = useMutation({
    mutationFn: async ({
      currentPassword,
      newPassword,
    }: {
      currentPassword: string;
      newPassword: string;
    }) => {
      // Get current salt
      const currentSaltBase64 = await getSecureItem(STORAGE_KEYS.KEY_SALT);
      if (!currentSaltBase64) throw new Error('Salt not found');

      const currentSalt = base64ToUint8Array(currentSaltBase64);

      // Derive current keys
      const currentDerived = await deriveKeyFromPassword(currentPassword, currentSalt);
      const { authKey: currentAuthKey } = deriveSubKeys(currentDerived);

      // Get current vault key
      const vaultKeyHex = await getSecureItem(STORAGE_KEYS.ENCRYPTION_KEY);
      if (!vaultKeyHex) throw new Error('Vault key not found');
      const vaultKey = hexToBytes(vaultKeyHex);

      // Generate new salt and derive new keys
      const newSalt = generateSalt();
      const newDerived = await deriveKeyFromPassword(newPassword, newSalt);
      const { masterKey: newMasterKey, authKey: newAuthKey } = deriveSubKeys(newDerived);

      // Re-wrap vault key with new master key
      const newWrappedVaultKey = wrapVaultKey(vaultKey, newMasterKey);

      // Build new KDF params
      const newKdf: KdfParams = {
        algorithm: 'pbkdf2',
        salt: uint8ArrayToBase64(newSalt),
        memory: KDF_PARAMS.memory,
        iterations: KDF_PARAMS.iterations,
        parallelism: KDF_PARAMS.parallelism,
      };

      // Send change password request
      const response = await api.post(AUTH_ENDPOINTS.CHANGE_PASSWORD, {
        currentAuthVerifier: uint8ArrayToBase64(currentAuthKey),
        newAuthVerifier: uint8ArrayToBase64(newAuthKey),
        newWrappedVaultKey,
        newKdf,
      });

      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to change password');
      }

      // Update stored salt
      await setSecureItem(STORAGE_KEYS.KEY_SALT, uint8ArrayToBase64(newSalt));
      await setSecureItem(STORAGE_KEYS.MASTER_KEY_HASH, bytesToHex(sha256(newMasterKey)));

      return response;
    },
  });

  // ================== Unlock with Password ==================
  const unlockWithPassword = useCallback(
    async (masterPassword: string): Promise<boolean> => {
      try {
        console.log('[Unlock] Starting unlock flow...');
        
        const saltBase64 = await getSecureItem(STORAGE_KEYS.KEY_SALT);
        const wrappedVaultKey = await getSecureItem(STORAGE_KEYS.WRAPPED_VAULT_KEY);
        const storedMasterKeyHash = await getSecureItem(STORAGE_KEYS.MASTER_KEY_HASH);

        console.log('[Unlock] Salt retrieved:', saltBase64 ? 'yes' : 'no');
        console.log('[Unlock] Wrapped vault key:', wrappedVaultKey ? 'yes' : 'no');
        console.log('[Unlock] Stored master key hash:', storedMasterKeyHash ? 'yes' : 'no');

        if (!saltBase64) {
          console.log('[Unlock] Missing salt, cannot unlock');
          return false;
        }

        // Derive master key from Master Password
        const salt = base64ToUint8Array(saltBase64);
        console.log('[Unlock] Deriving key from Master Password...');
        const derivedKey = await deriveKeyFromPassword(masterPassword, salt);
        const { masterKey } = deriveSubKeys(derivedKey);

        // Two verification paths:
        // 1. If we have stored master key hash - verify against it (quick local verification)
        // 2. If we have wrapped vault key - try to unwrap it (proves password is correct)
        
        if (storedMasterKeyHash) {
          // Quick verification using stored hash
          const currentHash = bytesToHex(sha256(masterKey));
          if (currentHash !== storedMasterKeyHash) {
            console.log('[Unlock] Master key hash mismatch - invalid password');
            return false;
          }
          console.log('[Unlock] Master key hash verified');
        }

        // Unwrap the vault key if we have it
        if (wrappedVaultKey) {
          try {
            console.log('[Unlock] Unwrapping vault key...');
            const vaultKey = unwrapVaultKey(wrappedVaultKey, masterKey);
            await storeEncryptionKey(bytesToHex(vaultKey));
            console.log('[Unlock] Vault key unwrapped and stored');
          } catch (error) {
            console.error('[Unlock] Failed to unwrap vault key:', error);
            return false; // Wrong Master Password
          }
        }

        // Store master key hash for future quick verification
        if (!storedMasterKeyHash) {
          await setSecureItem(STORAGE_KEYS.MASTER_KEY_HASH, bytesToHex(sha256(masterKey)));
        }

        // Restore tokens from secure storage to the store
        console.log('[Unlock] Restoring tokens to store...');
        const { accessToken, refreshToken } = await getAuthTokens();
        if (accessToken && refreshToken) {
          useAuthStore.getState().setTokens(accessToken, refreshToken);
          console.log('[Unlock] Tokens restored successfully');
        } else {
          console.log('[Unlock] Warning: No tokens found in secure storage');
        }

        // Unlock the store
        console.log('[Unlock] Unlocking store...');
        useAuthStore.getState().unlock();
        return true;
      } catch (error) {
        console.error('[Unlock] Failed to unlock:', error);
        return false;
      }
    },
    []
  );

  return {
    // State
    isAuthenticated,
    isLocked,
    user,
    hasMasterPassword: useAuthStore.getState().hasMasterPassword,

    // Prelogin
    prelogin: preloginMutation.mutateAsync,
    isPrelogging: preloginMutation.isPending,

    // Login
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,

    // Register
    register: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    registerError: registerMutation.error,

    // Logout
    logout: logoutMutation.mutateAsync,
    isLoggingOut: logoutMutation.isPending,

    // Lock Vault
    lockVault,

    // Set Master Password
    setMasterPassword: setMasterPasswordMutation.mutateAsync,
    isSettingMasterPassword: setMasterPasswordMutation.isPending,
    setMasterPasswordError: setMasterPasswordMutation.error,

    // Forgot Password
    forgotPassword: forgotPasswordMutation.mutateAsync,
    isSendingReset: forgotPasswordMutation.isPending,
    forgotPasswordError: forgotPasswordMutation.error,

    // Change password
    changePassword: changePasswordMutation.mutateAsync,
    isChangingPassword: changePasswordMutation.isPending,
    changePasswordError: changePasswordMutation.error,

    // Unlock
    unlockWithPassword,
  };
}

export default useAuth;
