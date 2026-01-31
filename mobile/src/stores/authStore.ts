import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import type { User, AuthState } from '@/types';

// Storage keys for tokens
const TOKEN_KEYS = {
  ACCESS_TOKEN: 'vault_access_token',
  REFRESH_TOKEN: 'vault_refresh_token',
};

interface AuthStore extends AuthState {
  // Additional state
  deviceId: string | null;
  isInitialized: boolean;
  hasMasterPassword: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setTokens: (accessToken: string | null, refreshToken: string | null) => void;
  setLocked: (locked: boolean) => void;
  setDeviceId: (deviceId: string | null) => void;
  setHasMasterPassword: (hasMasterPassword: boolean) => void;
  login: (user: User, accessToken: string, refreshToken: string, hasMasterPassword?: boolean) => void;
  logout: () => void;
  lock: () => void;
  unlock: () => void;
  initialize: () => Promise<void>;
}

// Custom storage adapter for expo-secure-store
const secureStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(name);
    } catch {
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(name, value);
    } catch (error) {
      console.error('Failed to save to secure store:', error);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(name);
    } catch (error) {
      console.error('Failed to remove from secure store:', error);
    }
  },
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLocked: true,
      accessToken: null,
      refreshToken: null,
      deviceId: null,
      isInitialized: false,
      hasMasterPassword: false,

      // Actions
      setUser: (user) => set({ user }),

      setTokens: (accessToken, refreshToken) => {
        // Also persist to secure storage
        if (accessToken && refreshToken) {
          SecureStore.setItemAsync(TOKEN_KEYS.ACCESS_TOKEN, accessToken).catch(console.error);
          SecureStore.setItemAsync(TOKEN_KEYS.REFRESH_TOKEN, refreshToken).catch(console.error);
        }
        set({ accessToken, refreshToken });
      },

      setLocked: (locked) => set({ isLocked: locked }),

      setDeviceId: (deviceId) => set({ deviceId }),

      setHasMasterPassword: (hasMasterPassword) => set({ hasMasterPassword }),

      login: (user, accessToken, refreshToken, hasMasterPassword = false) => {
        // Also persist tokens to secure storage
        SecureStore.setItemAsync(TOKEN_KEYS.ACCESS_TOKEN, accessToken).catch(console.error);
        SecureStore.setItemAsync(TOKEN_KEYS.REFRESH_TOKEN, refreshToken).catch(console.error);
        console.log('[AuthStore] Login - tokens saved to store and secure storage');
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          // If user has Master Password, vault is locked until they enter it
          // If user doesn't have Master Password, they'll be redirected to set-master-password screen
          isLocked: hasMasterPassword,
          hasMasterPassword,
        });
      },

      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLocked: true,
          hasMasterPassword: false,
        }),

      lock: () => set({ isLocked: true }),

      unlock: () => set({ isLocked: false }),

      initialize: async () => {
        // Load tokens from secure storage
        try {
          const accessToken = await SecureStore.getItemAsync(TOKEN_KEYS.ACCESS_TOKEN);
          const refreshToken = await SecureStore.getItemAsync(TOKEN_KEYS.REFRESH_TOKEN);
          
          if (accessToken && refreshToken) {
            console.log('[AuthStore] Loaded tokens from secure storage');
            set({ accessToken, refreshToken });
          } else {
            console.log('[AuthStore] No tokens found in secure storage');
          }
        } catch (error) {
          console.error('[AuthStore] Failed to load tokens:', error);
        }
        
        set({ isInitialized: true });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        hasMasterPassword: state.hasMasterPassword,
        // Don't persist tokens here - store separately for security
      }),
      onRehydrateStorage: () => {
        return async (state, error) => {
          if (error) {
            console.error('[AuthStore] Rehydration error:', error);
            return;
          }
          
          // Load tokens from secure storage after rehydration
          try {
            const accessToken = await SecureStore.getItemAsync(TOKEN_KEYS.ACCESS_TOKEN);
            const refreshToken = await SecureStore.getItemAsync(TOKEN_KEYS.REFRESH_TOKEN);
            
            if (accessToken && refreshToken) {
              console.log('[AuthStore] Rehydration - loaded tokens from secure storage');
              useAuthStore.setState({ accessToken, refreshToken });
            }
          } catch (err) {
            console.error('[AuthStore] Failed to load tokens on rehydration:', err);
          }
        };
      },
    }
  )
);
