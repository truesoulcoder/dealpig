"use server";

import crypto from 'crypto';
import logger from './logger';

// Encryption constants
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // For AES, this is always 16 bytes
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32; // 256 bits

/**
 * Generates a secure encryption key from the environment variable or creates a new one
 * @returns Buffer containing the encryption key
 */
async function getEncryptionKey(): Promise<Buffer> {
  const envKey = process.env.ENCRYPTION_KEY;
  
  if (!envKey) {
    await logger.error('ENCRYPTION_KEY not found in environment variables, using a fallback key', 'security');
    // In production, this should throw an error instead of using a fallback
    // For now, we'll derive a key from a fallback phrase
    const fallbackPhrase = process.env.NEXT_PUBLIC_APP_URL || 'dealpig-secure-fallback';
    return crypto.scryptSync(fallbackPhrase, 'salt', KEY_LENGTH);
  }
  
  // If the key is provided as a hex string
  if (/^[0-9a-f]{64}$/i.test(envKey)) {
    return Buffer.from(envKey, 'hex');
  }
  
  // If the key is provided as a base64 string
  if (envKey.length === 44 && envKey.endsWith('==')) {
    return Buffer.from(envKey, 'base64');
  }
  
  // Otherwise, derive a key from the provided string
  return crypto.scryptSync(envKey, 'salt', KEY_LENGTH);
}

/**
 * Encrypts a string using AES-256-GCM
 * @param text Text to encrypt
 * @returns Encrypted text as a base64 string
 */
export async function encrypt(text: string): Promise<string> {
  try {
    // Generate a random initialization vector
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Get the encryption key
    const key = await getEncryptionKey();
    
    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    // Encrypt the text
    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    // Get the authentication tag
    const authTag = cipher.getAuthTag();
    
    // Combine IV, auth tag, and encrypted text for storage
    // Format: iv:authTag:encryptedText (all base64 encoded)
    const combined = Buffer.concat([iv, authTag, Buffer.from(encrypted, 'base64')]);
    
    return combined.toString('base64');
  } catch (error) {
    await logger.error('Encryption failed', error as Error, 'security');
    throw new Error('Encryption failed');
  }
}

/**
 * Decrypts a string that was encrypted with the encrypt function
 * @param encryptedText Encrypted text (base64 string)
 * @returns Decrypted text
 */
export async function decrypt(encryptedText: string): Promise<string> {
  try {
    // Decode the combined buffer
    const buffer = Buffer.from(encryptedText, 'base64');
    
    // Extract IV, auth tag, and encrypted data
    const iv = buffer.subarray(0, IV_LENGTH);
    const authTag = buffer.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const encrypted = buffer.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
    
    // Get the encryption key
    const key = await getEncryptionKey();
    
    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    
    // Set the authentication tag
    decipher.setAuthTag(authTag);
    
    // Decrypt the text
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString('utf8');
  } catch (error) {
    await logger.error('Decryption failed', error as Error, 'security');
    throw new Error('Decryption failed');
  }
}

/**
 * Generates a hash of a string using SHA-256
 * @param text Text to hash
 * @returns Hashed text as a hex string
 */
export async function hash(text: string): Promise<string> {
  return crypto.createHash('sha256').update(text).digest('hex');
}

/**
 * Validates whether a plaintext matches a hash
 * @param plaintext Plaintext to check
 * @param hashedValue Hash to compare against
 * @returns True if the plaintext matches the hash
 */
export async function validateHash(plaintext: string, hashedValue: string): Promise<boolean> {
  const hashedPlaintext = await hash(plaintext);
  return crypto.timingSafeEqual(
    Buffer.from(hashedPlaintext, 'hex'),
    Buffer.from(hashedValue, 'hex')
  );
}

/**
 * Generates a secure random token
 * @param length Length of the token in bytes
 * @returns Random token as a hex string
 */
export async function generateSecureToken(length: number = 32): Promise<string> {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Safely compares two strings to prevent timing attacks
 * @param a First string
 * @param b Second string
 * @returns True if the strings are equal
 */
export async function secureCompare(a: string, b: string): Promise<boolean> {
  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch (error) {
    return false;
  }
}