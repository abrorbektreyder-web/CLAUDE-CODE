import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  decimal,
  time,
  index,
  uniqueIndex,
  check,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { citext } from '../lib/custom-types';
import {
  idColumn,
  timestamps,
  softDelete,
  planTier,
  tenantStatus,
} from './_shared';

// ════════════════════════════════════════════════════════════════════════════
// TENANTS — SaaS multi-tenancy root table
// ════════════════════════════════════════════════════════════════════════════

export const tenants = pgTable(
  'tenants',
  {
    id: idColumn,

    // Identification
    subdomain: citext('subdomain').notNull().unique(),
    businessName: varchar('business_name', { length: 150 }).notNull(),
    businessType: varchar('business_type', { length: 50 }).default('mobile_retail'),
    legalName: varchar('legal_name', { length: 200 }),
    inn: varchar('inn', { length: 20 }),

    // Contact
    ownerEmail: citext('owner_email').notNull(),
    ownerPhone: varchar('owner_phone', { length: 20 }),
    address: text('address'),
    country: varchar('country', { length: 2 }).default('UZ'),
    timezone: varchar('timezone', { length: 50 }).default('Asia/Tashkent'),
    currency: varchar('currency', { length: 3 }).default('UZS'),
    locale: varchar('locale', { length: 10 }).default('uz-UZ'),

    // Subscription
    plan: planTier('plan').notNull().default('free'),
    status: tenantStatus('status').notNull().default('trial'),
    trialEndsAt: timestamp('trial_ends_at', { withTimezone: true })
      .default(sql`NOW() + INTERVAL '14 days'`),
    subscriptionStartsAt: timestamp('subscription_starts_at', { withTimezone: true }),
    subscriptionEndsAt: timestamp('subscription_ends_at', { withTimezone: true }),

    // Limits
    maxUsers: integer('max_users').notNull().default(2),
    maxBranches: integer('max_branches').notNull().default(1),
    maxProducts: integer('max_products').notNull().default(100),

    // Settings (JSON for flexibility)
    settings: jsonb('settings').notNull().default({
      default_warranty_months: 12,
      default_credit_interest: 3,
      max_credit_months: 12,
      min_down_payment_percent: 30,
      low_stock_threshold: 5,
      fiscal_module_enabled: false,
      trade_in_enabled: false,
    }),

    // Branding
    logoUrl: text('logo_url'),
    brandColor: varchar('brand_color', { length: 7 }).default('#FF6B35'),

    ...timestamps,
    ...softDelete,
  },
  (table) => ({
    subdomainIdx: index('idx_tenants_subdomain')
      .on(table.subdomain)
      .where(sql`deleted_at IS NULL`),
    statusIdx: index('idx_tenants_status')
      .on(table.status)
      .where(sql`deleted_at IS NULL`),
    ownerEmailIdx: index('idx_tenants_owner_email').on(table.ownerEmail),
    subdomainCheck: check(
      'valid_subdomain',
      sql`subdomain ~ '^[a-z0-9-]{3,30}$' AND subdomain NOT IN ('www', 'api', 'admin', 'app', 'dashboard')`
    ),
  })
);

// ════════════════════════════════════════════════════════════════════════════
// BRANCHES — Filiallar
// ════════════════════════════════════════════════════════════════════════════

export const branches = pgTable(
  'branches',
  {
    id: idColumn,
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),

    name: varchar('name', { length: 100 }).notNull(),
    code: varchar('code', { length: 20 }),
    address: text('address'),
    phone: varchar('phone', { length: 20 }),

    // Geo
    latitude: decimal('latitude', { precision: 10, scale: 7 }),
    longitude: decimal('longitude', { precision: 10, scale: 7 }),

    // Operations
    isMain: boolean('is_main').notNull().default(false),
    isActive: boolean('is_active').notNull().default(true),
    opensAt: time('opens_at').default('09:00'),
    closesAt: time('closes_at').default('21:00'),

    ...timestamps,
    ...softDelete,
  },
  (table) => ({
    tenantIdx: index('idx_branches_tenant')
      .on(table.tenantId)
      .where(sql`deleted_at IS NULL`),
    activeIdx: index('idx_branches_active')
      .on(table.tenantId, table.isActive)
      .where(sql`deleted_at IS NULL`),
    codeUnique: uniqueIndex('idx_branches_code_unique').on(
      table.tenantId,
      table.code
    ),
    oneMainIdx: uniqueIndex('idx_branches_one_main')
      .on(table.tenantId)
      .where(sql`is_main = TRUE AND deleted_at IS NULL`),
  })
);

// ════════════════════════════════════════════════════════════════════════════
// TYPE EXPORTS — for use throughout the app
// ════════════════════════════════════════════════════════════════════════════

export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;
export type Branch = typeof branches.$inferSelect;
export type NewBranch = typeof branches.$inferInsert;
