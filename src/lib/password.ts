import argon2 from 'argon2';
import { config } from '../config/index.js';

// Argon2 options for server-side hashing
const argon2Options: argon2.Options & { raw: false } = {
  type: argon2.argon2id,
  memoryCost: config.argon2.memory,
  timeCost: config.argon2.iterations,
  parallelism: config.argon2.parallelism,
  hashLength: 32,
  raw: false,
};

/**
 * Hash the auth verifier received from client
 * This is NOT the master password - it's derived from it
 */
export const hashAuthVerifier = async (authVerifier: string): Promise<string> => {
  return argon2.hash(authVerifier, argon2Options);
};

/**
 * Verify auth verifier against stored hash
 */
export const verifyAuthVerifier = async (
  authVerifier: string,
  hash: string
): Promise<boolean> => {
  try {
    return await argon2.verify(hash, authVerifier);
  } catch {
    return false;
  }
};

/**
 * Check if hash needs rehashing (params changed)
 */
export const needsRehash = (hash: string): boolean => {
  return argon2.needsRehash(hash, argon2Options);
};
