import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark';
type Language = 'en' | 'vi';
type ClipboardTimeout = 30 | 60 | 120; // seconds
type AutoLockTimeout = 1 | 5 | 15 | 30; // minutes

interface SettingsState {
  // Appearance
  themeMode: ThemeMode;
  language: Language;
  
  // Security
  biometricEnabled: boolean;
  clipboardTimeout: ClipboardTimeout;
  autoLockTimeout: AutoLockTimeout;
  lockOnBackground: boolean;
  screenshotPrevention: boolean;
  
  // Sync
  autoSyncEnabled: boolean;
  syncOnStartup: boolean;
  
  // Generator defaults
  generatorLength: number;
  generatorUppercase: boolean;
  generatorLowercase: boolean;
  generatorNumbers: boolean;
  generatorSymbols: boolean;
}

interface SettingsActions {
  setThemeMode: (mode: ThemeMode) => void;
  setLanguage: (lang: Language) => void;
  setBiometricEnabled: (enabled: boolean) => void;
  setClipboardTimeout: (timeout: ClipboardTimeout) => void;
  setAutoLockTimeout: (timeout: AutoLockTimeout) => void;
  setLockOnBackground: (enabled: boolean) => void;
  setScreenshotPrevention: (enabled: boolean) => void;
  setAutoSyncEnabled: (enabled: boolean) => void;
  setSyncOnStartup: (enabled: boolean) => void;
  setGeneratorDefaults: (defaults: Partial<Pick<SettingsState, 
    'generatorLength' | 'generatorUppercase' | 'generatorLowercase' | 
    'generatorNumbers' | 'generatorSymbols'>>) => void;
  resetSettings: () => void;
  // Aliases for convenience
  autoSync: boolean;
  setAutoSync: (enabled: boolean) => void;
  // Computed property for generator defaults
  generatorDefaults: {
    length: number;
    uppercase: boolean;
    lowercase: boolean;
    numbers: boolean;
    symbols: boolean;
  };
}

type SettingsStore = SettingsState & SettingsActions;

const initialState: SettingsState = {
  themeMode: 'dark',
  language: 'en',
  biometricEnabled: false,
  clipboardTimeout: 60,
  autoLockTimeout: 5,
  lockOnBackground: true,
  screenshotPrevention: true,
  autoSyncEnabled: true,
  syncOnStartup: true,
  generatorLength: 16,
  generatorUppercase: true,
  generatorLowercase: true,
  generatorNumbers: true,
  generatorSymbols: true,
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setThemeMode: (themeMode) => set({ themeMode }),

      setLanguage: (language) => set({ language }),

      setBiometricEnabled: (biometricEnabled) => set({ biometricEnabled }),

      setClipboardTimeout: (clipboardTimeout) => set({ clipboardTimeout }),

      setAutoLockTimeout: (autoLockTimeout) => set({ autoLockTimeout }),

      setLockOnBackground: (lockOnBackground) => set({ lockOnBackground }),

      setScreenshotPrevention: (screenshotPrevention) => set({ screenshotPrevention }),

      setAutoSyncEnabled: (autoSyncEnabled) => set({ autoSyncEnabled }),

      setSyncOnStartup: (syncOnStartup) => set({ syncOnStartup }),

      setGeneratorDefaults: (defaults) => set((state) => ({ ...state, ...defaults })),

      resetSettings: () => set(initialState),

      // Alias properties
      get autoSync() {
        return get().autoSyncEnabled;
      },
      setAutoSync: (enabled: boolean) => set({ autoSyncEnabled: enabled }),

      // Computed generatorDefaults
      get generatorDefaults() {
        const state = get();
        return {
          length: state.generatorLength,
          uppercase: state.generatorUppercase,
          lowercase: state.generatorLowercase,
          numbers: state.generatorNumbers,
          symbols: state.generatorSymbols,
        };
      },
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
