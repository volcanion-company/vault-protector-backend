/**
 * @file Crypto Services index
 * @description Export encryption and password generation services
 */

export {
  // Key derivation
  deriveKeyFromPassword,
  deriveSubKeys,
  generateRandomKey,
  generateSalt,
  
  // Encryption/Decryption
  encrypt,
  decrypt,
  encrypt as encryptData, // Alias for useAuth
  decrypt as decryptData, // Alias for useAuth
  encryptVaultItem,
  decryptVaultItem,
  
  // Utilities
  hash,
  generateSecureId,
  bytesToHex,
  hexToBytes,
  utf8ToBytes,
  
  // Types
  type EncryptedData,
  type DerivedKeys,
} from './encryption';

// Re-export randomBytes for generating random data
export { randomBytes as generateRandomBytes } from '@noble/ciphers/utils.js';

export {
  // Password generation
  generatePassword,
  generatePassphrase,
  generatePIN,
  calculatePasswordStrength,
  
  // Defaults
  DEFAULT_PASSWORD_OPTIONS,
  DEFAULT_PASSPHRASE_OPTIONS,
  
  // Types
  type PasswordOptions,
  type PassphraseOptions,
} from './generator';
