/**
 * @file usePasswordGenerator Hook - Password generation
 * @description Custom hook for generating secure passwords
 */

import { useState, useCallback, useMemo } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';
import {
  generatePassword,
  generatePassphrase,
  generatePIN,
  calculatePasswordStrength,
  DEFAULT_PASSWORD_OPTIONS,
  DEFAULT_PASSPHRASE_OPTIONS,
  type PasswordOptions,
  type PassphraseOptions,
} from '@/services/crypto';

export type GeneratorMode = 'password' | 'passphrase' | 'pin';

export function usePasswordGenerator() {
  const { generatorDefaults } = useSettingsStore();

  // Mode state
  const [mode, setMode] = useState<GeneratorMode>('password');

  // Password options state
  const [passwordOptions, setPasswordOptions] = useState<PasswordOptions>({
    ...DEFAULT_PASSWORD_OPTIONS,
    length: generatorDefaults.length,
    uppercase: generatorDefaults.uppercase,
    lowercase: generatorDefaults.lowercase,
    numbers: generatorDefaults.numbers,
    symbols: generatorDefaults.symbols,
  });

  // Passphrase options state
  const [passphraseOptions, setPassphraseOptions] = useState<PassphraseOptions>({
    ...DEFAULT_PASSPHRASE_OPTIONS,
  });

  // PIN options state
  const [pinLength, setPinLength] = useState(4);

  // Generated value
  const [generatedValue, setGeneratedValue] = useState<string>('');

  // Generate based on current mode
  const generate = useCallback(() => {
    let value: string;

    switch (mode) {
      case 'password':
        value = generatePassword(passwordOptions);
        break;
      case 'passphrase':
        value = generatePassphrase(passphraseOptions);
        break;
      case 'pin':
        value = generatePIN(pinLength);
        break;
      default:
        value = generatePassword(passwordOptions);
    }

    setGeneratedValue(value);
    return value;
  }, [mode, passwordOptions, passphraseOptions, pinLength]);

  // Calculate strength of current generated value
  const strength = useMemo(() => {
    if (!generatedValue) {
      return { score: 0, level: 'weak' as const, feedback: [] };
    }
    return calculatePasswordStrength(generatedValue);
  }, [generatedValue]);

  // Update individual password option
  const updatePasswordOption = useCallback(
    <K extends keyof PasswordOptions>(key: K, value: PasswordOptions[K]) => {
      setPasswordOptions((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  // Update individual passphrase option
  const updatePassphraseOption = useCallback(
    <K extends keyof PassphraseOptions>(key: K, value: PassphraseOptions[K]) => {
      setPassphraseOptions((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  // Reset to defaults
  const resetToDefaults = useCallback(() => {
    setPasswordOptions({
      ...DEFAULT_PASSWORD_OPTIONS,
      length: generatorDefaults.length,
      uppercase: generatorDefaults.uppercase,
      lowercase: generatorDefaults.lowercase,
      numbers: generatorDefaults.numbers,
      symbols: generatorDefaults.symbols,
    });
    setPassphraseOptions({ ...DEFAULT_PASSPHRASE_OPTIONS });
    setPinLength(4);
    setGeneratedValue('');
  }, [generatorDefaults]);

  // Quick generate functions
  const generateQuickPassword = useCallback(
    (length?: number) => {
      const options: PasswordOptions = {
        ...passwordOptions,
        length: length ?? passwordOptions.length,
      };
      return generatePassword(options);
    },
    [passwordOptions]
  );

  const generateQuickPassphrase = useCallback(
    (wordCount?: number) => {
      const options: PassphraseOptions = {
        ...passphraseOptions,
        wordCount: wordCount ?? passphraseOptions.wordCount,
      };
      return generatePassphrase(options);
    },
    [passphraseOptions]
  );

  const generateQuickPIN = useCallback((length?: number) => {
    return generatePIN(length ?? 4);
  }, []);

  // Check password strength (for external passwords)
  const checkStrength = useCallback((password: string) => {
    return calculatePasswordStrength(password);
  }, []);

  return {
    // Mode
    mode,
    setMode,

    // Generated value
    generatedValue,
    strength,
    generate,

    // Password options
    passwordOptions,
    setPasswordOptions,
    updatePasswordOption,

    // Passphrase options
    passphraseOptions,
    setPassphraseOptions,
    updatePassphraseOption,

    // PIN options
    pinLength,
    setPinLength,

    // Utilities
    resetToDefaults,
    generateQuickPassword,
    generateQuickPassphrase,
    generateQuickPIN,
    checkStrength,
  };
}

export default usePasswordGenerator;
