import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  decimal,
  date,
  bigint,
  index,
  uniqueIndex,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { citext, bytea } from '../lib/custom-types';
import { idColumn, timestamps, softDelete } from './_shared';
import { tenants } from './tenants';

// ════════════════════════════════════════════════════════════════════════════
// CUSTOMERS — End customers buying from the store
// ════════════════════════════════════════════════════════════════════════════

export const customers = pgTable(
  'customers',
  {
    id: idColumn,
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),

    // Identity (ENCRYPTED + HASHED)
    fullName: varchar('full_name', { length: 200 }).notNull(),
    phoneEncrypted: bytea('phone_encrypted'),
    phoneHash: varchar('phone_hash', { length: 64 }).notNull(),
    phoneLastFour: varchar('phone_last_four', { length: 4 }),

    // Optional secondary phone
    secondaryPhoneEncrypted: bytea('secondary_phone_encrypted'),
    secondaryPhoneHash: varchar('secondary_phone_hash', { length: 64 }),

    // Documents (required for credit)
    passportEncrypted: bytea('passport_encrypted'),
    passportHash: varchar('passport_hash', { length: 64 }),
    passportLastFour: varchar('passport_last_four', { length: 4 }),
    birthDate: date('birth_date'),

    // Contact
    address: text('address'),
    email: citext('email'),
    telegramChatId: bigint('telegram_chat_id', { mode: 'bigint' }),
    telegramUsername: varchar('telegram_username', { length: 50 }),

    // Financial
    totalPurchases: decimal('total_purchases', { precision: 15, scale: 2 })
      .notNull()
      .default('0'),
    totalDebt: decimal('total_debt', { precision: 15, scale: 2 })
      .notNull()
      .default('0'),
    totalPaid: decimal('total_paid', { precision: 15, scale: 2 })
      .notNull()
      .default('0'),
    purchaseCount: integer('purchase_count').notNull().default(0),

    // Credit scoring (0-100)
    creditScore: integer('credit_score').notNull().default(50),
    isBlacklisted: boolean('is_blacklisted').notNull().default(false),
    blacklistReason: text('blacklist_reason'),

    // Tags & notes
    tags: text('tags').array(),
    notes: text('notes'),

    marketingConsent: boolean('marketing_consent').notNull().default(false),

    ...timestamps,
    ...softDelete,
  },
  (table) => ({
    tenantIdx: index('idx_customers_tenant')
      .on(table.tenantId)
      .where(sql`deleted_at IS NULL`),
    phoneHashUnique: uniqueIndex('idx_customers_phone_hash').on(
      table.tenantId,
      table.phoneHash
    ),
    passportHashIdx: index('idx_customers_passport_hash')
      .on(table.tenantId, table.passportHash)
      .where(sql`passport_hash IS NOT NULL AND deleted_at IS NULL`),
    telegramIdx: index('idx_customers_telegram')
      .on(table.telegramChatId)
      .where(sql`telegram_chat_id IS NOT NULL`),
    blacklistIdx: index('idx_customers_blacklist')
      .on(table.tenantId)
      .where(sql`is_blacklisted = TRUE AND deleted_at IS NULL`),

    creditScoreCheck: check(
      'credit_score_range',
      sql`credit_score BETWEEN 0 AND 100`
    ),
  })
);

// ════════════════════════════════════════════════════════════════════════════
// TYPE EXPORTS
// ════════════════════════════════════════════════════════════════════════════

export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;

// Safe customer (no encrypted blobs) — for client responses
export type SafeCustomer = Omit<
  Customer,
  | 'phoneEncrypted'
  | 'secondaryPhoneEncrypted'
  | 'passportEncrypted'
  | 'phoneHash'
  | 'secondaryPhoneHash'
  | 'passportHash'
> & {
  phoneMasked?: string; // "+998 ** *** ** 67"
  passportMasked?: string; // "** *****67"
};

/**
 * Mask phone number for display
 * Input: "+998901234567" → Output: "+998 ** *** ** 67"
 */
export function maskPhone(phoneLastFour: string | null): string {
  if (!phoneLastFour) return '+998 *** *** ** **';
  return `+998 ** *** ** ${phoneLastFour.slice(-2)}`;
}

/**
 * Mask passport for display
 * Input: "AA1234567" → Output: "** *****67"
 */
export function maskPassport(passportLastFour: string | null): string {
  if (!passportLastFour) return '** *******';
  return `** *****${passportLastFour.slice(-2)}`;
}
