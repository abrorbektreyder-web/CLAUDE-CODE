import { customType } from 'drizzle-orm/pg-core';

// ════════════════════════════════════════════════════════════════════════════
// CUSTOM POSTGRESQL TYPES
// ════════════════════════════════════════════════════════════════════════════
// PostgreSQL has types Drizzle doesn't natively support.
// We define them here using customType helper.
// ════════════════════════════════════════════════════════════════════════════

/**
 * CITEXT — Case-insensitive text
 * Used for: emails, subdomains, anywhere case shouldn't matter
 *
 * Requires: CREATE EXTENSION citext;
 */
export const citext = customType<{ data: string; driverData: string }>({
  dataType() {
    return 'citext';
  },
});

/**
 * BYTEA — Binary data (used for AES-256 encrypted fields)
 * Used for: imei_encrypted, phone_encrypted, passport_encrypted
 *
 * The application layer handles encryption/decryption via PostgreSQL
 * pgp_sym_encrypt() / pgp_sym_decrypt() functions
 */
export const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return 'bytea';
  },
});

/**
 * TSVECTOR — Full-text search vector
 * Used for: products.search_vector
 *
 * Auto-populated by trigger from name, brand, model, sku, barcode
 */
export const tsvector = customType<{ data: string; driverData: string }>({
  dataType() {
    return 'tsvector';
  },
});

/**
 * INET — IP address type
 * Drizzle has built-in support, but we re-export for consistency
 */
// export { inet } from 'drizzle-orm/pg-core';
