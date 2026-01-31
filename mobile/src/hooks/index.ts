/**
 * @file Hooks index
 * @description Export all custom hooks
 */

export { useAuth, default as useAuthHook } from './useAuth';
export { useBiometric, default as useBiometricHook } from './useBiometric';
export { useClipboard, default as useClipboardHook, type ClipboardOptions } from './useClipboard';
export { useVault, VAULT_QUERY_KEYS, default as useVaultHook } from './useVault';
export { usePasswordGenerator, type GeneratorMode, default as usePasswordGeneratorHook } from './usePasswordGenerator';
