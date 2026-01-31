/**
 * @file Password Generator Service
 * @description Secure password generation with configurable options
 */

import { randomBytes } from '@noble/ciphers/utils.js';

export interface PasswordOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
  excludeAmbiguous: boolean;
  excludeCharacters?: string;
  minNumbers?: number;
  minSymbols?: number;
}

export interface PassphraseOptions {
  wordCount: number;
  separator: string;
  capitalize: boolean;
  includeNumber: boolean;
}

// Character sets
const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const NUMBERS = '0123456789';
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';

// Ambiguous characters (can be confused visually)
const AMBIGUOUS = 'O0l1I|';

// Common English words for passphrase (sample - should be expanded)
const WORDLIST = [
  'apple', 'banana', 'cherry', 'dragon', 'elephant', 'forest', 'garden', 'harbor',
  'island', 'jungle', 'kitchen', 'lemon', 'mountain', 'nature', 'ocean', 'planet',
  'quantum', 'rainbow', 'sunset', 'thunder', 'umbrella', 'village', 'winter', 'yellow',
  'zebra', 'anchor', 'bridge', 'castle', 'desert', 'engine', 'falcon', 'galaxy',
  'horizon', 'iceberg', 'jasmine', 'kingdom', 'lantern', 'marble', 'nebula', 'oracle',
  'phantom', 'quartz', 'river', 'shadow', 'temple', 'universe', 'volcano', 'whisper',
  'crystal', 'diamond', 'emerald', 'flame', 'glacier', 'harvest', 'ivory', 'journey',
  'keystone', 'lunar', 'meadow', 'nomad', 'oasis', 'phoenix', 'quest', 'radiant',
  'silver', 'tiger', 'unity', 'velvet', 'wisdom', 'xenon', 'youth', 'zenith',
  'ancient', 'beacon', 'cosmic', 'dawn', 'echo', 'frost', 'golden', 'haven',
  'infinite', 'jade', 'kite', 'lotus', 'mystic', 'noble', 'orbit', 'prism',
];

/**
 * Generate cryptographically secure random number in range
 * @param max - Maximum value (exclusive)
 * @returns Random number from 0 to max-1
 */
function secureRandom(max: number): number {
  const bytes = randomBytes(4);
  const view = new DataView(bytes.buffer);
  const value = view.getUint32(0, true);
  return value % max;
}

/**
 * Shuffle array using Fisher-Yates algorithm with secure random
 * @param array - Array to shuffle
 * @returns Shuffled array
 */
function secureShuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = secureRandom(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Generate a secure random password
 * @param options - Password generation options
 * @returns Generated password
 */
export function generatePassword(options: PasswordOptions): string {
  const {
    length,
    uppercase,
    lowercase,
    numbers,
    symbols,
    excludeAmbiguous,
    excludeCharacters = '',
    minNumbers = 0,
    minSymbols = 0,
  } = options;

  // Build character set
  let charset = '';
  if (uppercase) charset += UPPERCASE;
  if (lowercase) charset += LOWERCASE;
  if (numbers) charset += NUMBERS;
  if (symbols) charset += SYMBOLS;

  // Remove ambiguous characters if requested
  if (excludeAmbiguous) {
    for (const char of AMBIGUOUS) {
      charset = charset.replace(new RegExp(char, 'g'), '');
    }
  }

  // Remove excluded characters
  for (const char of excludeCharacters) {
    charset = charset.replace(new RegExp(escapeRegExp(char), 'g'), '');
  }

  if (charset.length === 0) {
    throw new Error('At least one character type must be selected');
  }

  // Generate password with guaranteed minimums
  const password: string[] = [];

  // Add minimum required numbers
  if (numbers && minNumbers > 0) {
    let numCharset = NUMBERS;
    if (excludeAmbiguous) {
      for (const char of AMBIGUOUS) {
        numCharset = numCharset.replace(new RegExp(char, 'g'), '');
      }
    }
    for (let i = 0; i < minNumbers && numCharset.length > 0; i++) {
      password.push(numCharset[secureRandom(numCharset.length)]);
    }
  }

  // Add minimum required symbols
  if (symbols && minSymbols > 0) {
    for (let i = 0; i < minSymbols; i++) {
      password.push(SYMBOLS[secureRandom(SYMBOLS.length)]);
    }
  }

  // Fill remaining length with random characters
  while (password.length < length) {
    password.push(charset[secureRandom(charset.length)]);
  }

  // Shuffle to randomize positions
  return secureShuffle(password).join('');
}

/**
 * Generate a memorable passphrase
 * @param options - Passphrase generation options
 * @returns Generated passphrase
 */
export function generatePassphrase(options: PassphraseOptions): string {
  const { wordCount, separator, capitalize, includeNumber } = options;

  // Select random words
  const words: string[] = [];
  const usedIndices = new Set<number>();

  while (words.length < wordCount) {
    const index = secureRandom(WORDLIST.length);
    if (!usedIndices.has(index)) {
      usedIndices.add(index);
      let word = WORDLIST[index];
      if (capitalize) {
        word = word.charAt(0).toUpperCase() + word.slice(1);
      }
      words.push(word);
    }
  }

  // Add number if requested
  if (includeNumber) {
    const position = secureRandom(wordCount);
    const number = secureRandom(100);
    words[position] = words[position] + number;
  }

  return words.join(separator);
}

/**
 * Calculate password strength score (0-100)
 * @param password - Password to analyze
 * @returns Strength score and feedback
 */
export function calculatePasswordStrength(password: string): {
  score: number;
  level: 'weak' | 'fair' | 'good' | 'strong' | 'excellent';
  feedback: string[];
} {
  let score = 0;
  const feedback: string[] = [];

  // Length scoring
  if (password.length >= 8) score += 10;
  if (password.length >= 12) score += 10;
  if (password.length >= 16) score += 10;
  if (password.length >= 20) score += 10;

  // Character diversity
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^a-zA-Z0-9]/.test(password);

  if (hasLower) score += 10;
  if (hasUpper) score += 10;
  if (hasNumber) score += 10;
  if (hasSymbol) score += 15;

  // Complexity bonus
  const uniqueChars = new Set(password).size;
  score += Math.min(15, Math.floor(uniqueChars / 2));

  // Penalties
  if (password.length < 8) {
    feedback.push('Password should be at least 8 characters');
    score -= 20;
  }

  if (!hasLower && !hasUpper) {
    feedback.push('Add letters');
  }

  if (!hasNumber) {
    feedback.push('Add numbers');
  }

  if (!hasSymbol) {
    feedback.push('Add special characters');
  }

  // Common patterns penalty
  if (/^[a-zA-Z]+$/.test(password)) {
    score -= 10;
    feedback.push('Avoid using only letters');
  }

  if (/^[0-9]+$/.test(password)) {
    score -= 20;
    feedback.push('Avoid using only numbers');
  }

  // Repeating characters penalty
  if (/(.)\1{2,}/.test(password)) {
    score -= 10;
    feedback.push('Avoid repeating characters');
  }

  // Sequential characters penalty
  if (/(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i.test(password)) {
    score -= 10;
    feedback.push('Avoid sequential characters');
  }

  // Ensure score is between 0-100
  score = Math.max(0, Math.min(100, score));

  // Determine level
  let level: 'weak' | 'fair' | 'good' | 'strong' | 'excellent';
  if (score < 20) level = 'weak';
  else if (score < 40) level = 'fair';
  else if (score < 60) level = 'good';
  else if (score < 80) level = 'strong';
  else level = 'excellent';

  return { score, level, feedback };
}

/**
 * Generate a PIN code
 * @param length - PIN length (4-8 digits)
 * @returns Generated PIN
 */
export function generatePIN(length: number = 4): string {
  const clampedLength = Math.max(4, Math.min(8, length));
  let pin = '';
  for (let i = 0; i < clampedLength; i++) {
    pin += secureRandom(10).toString();
  }
  return pin;
}

// Helper function to escape regex special characters
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Default password options
export const DEFAULT_PASSWORD_OPTIONS: PasswordOptions = {
  length: 16,
  uppercase: true,
  lowercase: true,
  numbers: true,
  symbols: true,
  excludeAmbiguous: false,
  minNumbers: 1,
  minSymbols: 1,
};

// Default passphrase options
export const DEFAULT_PASSPHRASE_OPTIONS: PassphraseOptions = {
  wordCount: 4,
  separator: '-',
  capitalize: true,
  includeNumber: true,
};
