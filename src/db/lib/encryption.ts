import { createHash } from 'node:crypto';
import { sql } from 'drizzle-orm';
import { db } from './db';

// ════════════════════════════════════════════════════════════════════════════
// ENCRYPTION & HASHING UTILITIES
// ════════════════════════════════════════════════════════════════════════════
// Strategy:
//   - HASH (SHA-256, deterministic) → for indexed lookups
//   - ENCRYPT (AES-256, via PostgreSQL pgcrypto) → for storage
//
// Usage in app:
//   1. Hash on JS side (fast, deterministic) for WHERE clauses
//   2. Encrypt via SQL (uses session encryption key)
//   3. Store both: phoneHash + phoneEncrypted
// ════════════════════════════════════════════════════════════════════════════

/**
 * SHA-256 hash for indexed lookups
 * Deterministic — same input → same output
 *
 * @example
 * hashSensitive('+998901234567') → 'a1b2c3d4...'
 */
export function hashSensitive(plaintext: string | null | undefined): string | null {
  if (!plaintext || plaintext.trim() === '') return null;
  return createHash('sha256').update(plaintext.trim()).digest('hex');
}

/**
 * Get last N characters for display purposes
 *
 * @example
 * getLastChars('+998901234567', 4) → '4567'
 */
export function getLastChars(plaintext: string | null | undefined, n: number): string | null {
  if (!plaintext) return null;
  const cleaned = plaintext.trim();
  return cleaned.slice(-n);
}

/**
 * Encrypt a value using PostgreSQL pgp_sym_encrypt
 * Returns SQL fragment that can be used in INSERT/UPDATE
 *
 * @example
 * await db.insert(customers).values({
 *   phoneEncrypted: encryptSql('+998901234567'),
 *   phoneHash: hashSensitive('+998901234567'),
 *   phoneLastFour: getLastChars('+998901234567', 4),
 * });
 */
export function encryptSql(plaintext: string | null | undefined) {
  if (!plaintext || plaintext.trim() === '') return null;
  return sql`encrypt_sensitive(${plaintext.trim()})`;
}

/**
 * Decrypt a BYTEA value using PostgreSQL pgp_sym_decrypt
 * Returns SQL fragment for SELECT statements
 *
 * @example
 * const result = await db
 *   .select({
 *     phone: decryptSql('phone_encrypted'),
 *   })
 *   .from(customers);
 */
export function decryptSql(columnName: string) {
  return sql.raw(`decrypt_sensitive(${columnName})`);
}

// ════════════════════════════════════════════════════════════════════════════
// HIGH-LEVEL HELPERS — combine hash + encrypt + last_four
// ════════════════════════════════════════════════════════════════════════════

export interface EncryptedFieldValues {
  encrypted: ReturnType<typeof encryptSql>;
  hash: string | null;
  lastFour: string | null;
}

/**
 * Prepare an encrypted field for insert.
 * Returns all 3 components needed: encrypted blob, hash, last_four.
 *
 * @example
 * const phoneFields = prepareEncryptedField('+998901234567', 4);
 *
 * await db.insert(customers).values({
 *   fullName: 'Sardor',
 *   phoneEncrypted: phoneFields.encrypted,
 *   phoneHash: phoneFields.hash,
 *   phoneLastFour: phoneFields.lastFour,
 * });
 */
export function prepareEncryptedField(
  plaintext: string | null | undefined,
  lastChars: number = 4
): EncryptedFieldValues {
  return {
    encrypted: encryptSql(plaintext),
    hash: hashSensitive(plaintext),
    lastFour: getLastChars(plaintext, lastChars),
  };
}

// ════════════════════════════════════════════════════════════════════════════
// PHONE NORMALIZATION (Uzbekistan format)
// ════════════════════════════════════════════════════════════════════════════

/**
 * Normalize Uzbek phone number to international format
 *
 * Accepts:
 *   "901234567"        → "+998901234567"
 *   "0901234567"       → "+998901234567"
 *   "+998901234567"    → "+998901234567"
 *   "998 90 123 45 67" → "+998901234567"
 *   "+998 (90) 123-45-67" → "+998901234567"
 */
export function normalizePhone(input: string | null | undefined): string | null {
  if (!input) return null;

  // Remove all non-digit characters
  let digits = input.replace(/\D/g, '');

  // Handle different prefixes
  if (digits.startsWith('998') && digits.length === 12) {
    // Already has country code
    return `+${digits}`;
  } else if (digits.startsWith('0') && digits.length === 10) {
    // Local format starting with 0
    return `+998${digits.slice(1)}`;
  } else if (digits.length === 9) {
    // Just operator code + number
    return `+998${digits}`;
  }

  // Invalid format
  return null;
}

/**
 * Validate Uzbek phone number
 */
export function isValidUzPhone(phone: string | null | undefined): boolean {
  if (!phone) return false;
  const normalized = normalizePhone(phone);
  if (!normalized) return false;

  // Must be +998 followed by 9 digits
  // First digit after 998 must be 8 or 9 (mobile operator codes)
  return /^\+998[89]\d{8}$/.test(normalized);
}

/**
 * Format phone for display
 *
 * "+998901234567" → "+998 90 123 45 67"
 */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return '';
  const normalized = normalizePhone(phone);
  if (!normalized) return phone;

  // +998 90 123 45 67
  return normalized.replace(
    /^(\+998)(\d{2})(\d{3})(\d{2})(\d{2})$/,
    '$1 $2 $3 $4 $5'
  );
}

/**
 * Mask phone for display (privacy)
 *
 * "+998901234567" → "+998 ** *** ** 67"
 */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return '+998 ** *** ** **';
  const normalized = normalizePhone(phone);
  if (!normalized) return '+998 ** *** ** **';

  const lastTwo = normalized.slice(-2);
  return `+998 ** *** ** ${lastTwo}`;
}

// ════════════════════════════════════════════════════════════════════════════
// IMEI VALIDATION (Luhn algorithm)
// ════════════════════════════════════════════════════════════════════════════

/**
 * Validate IMEI using Luhn algorithm
 * IMEI must be 15 digits and pass checksum
 */
export function isValidImei(imei: string | null | undefined): boolean {
  if (!imei) return false;
  const digits = imei.replace(/\D/g, '');

  // Must be exactly 15 digits
  if (digits.length !== 15) return false;

  // Luhn algorithm
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    let digit = parseInt(digits[i]);
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }

  const checksum = (10 - (sum % 10)) % 10;
  return checksum === parseInt(digits[14]);
}

/**
 * Format IMEI for display (groups of 2-6-6-1)
 *
 * "356789102345678" → "35-678910-234567-8"
 */
export function formatImei(imei: string | null | undefined): string {
  if (!imei) return '';
  const digits = imei.replace(/\D/g, '');
  if (digits.length !== 15) return imei;

  return `${digits.slice(0, 2)}-${digits.slice(2, 8)}-${digits.slice(8, 14)}-${digits.slice(14)}`;
}
