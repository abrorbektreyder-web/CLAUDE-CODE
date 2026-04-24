import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  jsonb,
  integer,
  inet,
  bigint,
  index,
  uniqueIndex,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { citext } from '../lib/custom-types';
import { idColumn, timestamps, softDelete, userRole } from './_shared';
import { tenants, branches } from './tenants';

// ════════════════════════════════════════════════════════════════════════════
// USERS — All system users (owner, admin, cashier, warehouse)
// ════════════════════════════════════════════════════════════════════════════

export const user = pgTable(
  'users',
  {
    id: idColumn,
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),

    // Identification
    email: citext('email'),
    phone: varchar('phone', { length: 20 }).notNull(),
    fullName: varchar('full_name', { length: 150 }).notNull(),
    image: text('image'), // Better Auth compatibility
    avatarUrl: text('avatar_url'), // Custom field
    emailVerified: boolean('email_verified').notNull().default(false), // Better Auth compatibility

    // Authentication
    passwordHash: text('password_hash'), // Argon2id
    pinHash: text('pin_hash'), // bcrypt cost 12
    twoFactorEnabled: boolean('two_factor_enabled').notNull().default(false),
    twoFactorSecret: text('two_factor_secret'), // Encrypted TOTP
    recoveryCodes: text('recovery_codes').array(),

    // Authorization
    role: userRole('role').notNull(),
    branchId: uuid('branch_id').references(() => branches.id),
    permissions: jsonb('permissions').default({}),

    // Status
    isActive: boolean('is_active').notNull().default(true),
    isLocked: boolean('is_locked').notNull().default(false),
    lockedUntil: timestamp('locked_until', { withTimezone: true }),
    failedLoginAttempts: integer('failed_login_attempts').notNull().default(0),

    // Session tracking
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    lastLoginIp: inet('last_login_ip'),
    lastLoginUserAgent: text('last_login_user_agent'),
    lastActiveAt: timestamp('last_active_at', { withTimezone: true }),

    // Device fingerprinting
    allowedDevices: jsonb('allowed_devices').default([]),

    // Telegram
    telegramChatId: bigint('telegram_chat_id', { mode: 'bigint' }),
    telegramUsername: varchar('telegram_username', { length: 50 }),

    ...timestamps,
    ...softDelete,
  },
  (table) => ({
    tenantIdx: index('idx_users_tenant')
      .on(table.tenantId)
      .where(sql`deleted_at IS NULL`),
    emailIdx: index('idx_users_email')
      .on(sql`LOWER(${table.email})`)
      .where(sql`deleted_at IS NULL`),
    phoneIdx: index('idx_users_phone')
      .on(table.phone)
      .where(sql`deleted_at IS NULL`),
    roleBranchIdx: index('idx_users_role_branch')
      .on(table.tenantId, table.role, table.branchId)
      .where(sql`deleted_at IS NULL`),
    phoneUnique: uniqueIndex('idx_users_phone_unique').on(
      table.tenantId,
      table.phone
    ),
    emailUnique: uniqueIndex('idx_users_email_unique')
      .on(table.tenantId, table.email)
      .where(sql`email IS NOT NULL`),

    // Constraints
    emailOrPhone: check(
      'email_or_phone',
      sql`email IS NOT NULL OR phone IS NOT NULL`
    ),
    authMethod: check(
      'auth_method',
      sql`(role IN ('cashier') AND pin_hash IS NOT NULL) OR (role NOT IN ('cashier') AND password_hash IS NOT NULL)`
    ),
  })
);

// ════════════════════════════════════════════════════════════════════════════
// SESSIONS — Active user sessions
// ════════════════════════════════════════════════════════════════════════════

export const session = pgTable(
  'sessions',
  {
    id: idColumn,
    userId: uuid('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),

    // Token info
    tokenHash: varchar('token_hash', { length: 255 }).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),

    // Device info
    deviceFingerprint: varchar('device_fingerprint', { length: 255 }),
    deviceName: varchar('device_name', { length: 100 }),
    ipAddress: inet('ip_address'),
    userAgent: text('user_agent'),

    // Tracking
    lastActiveAt: timestamp('last_active_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    revokeReason: varchar('revoke_reason', { length: 100 }),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userIdx: index('idx_sessions_user')
      .on(table.userId)
      .where(sql`revoked_at IS NULL`),
    tokenIdx: index('idx_sessions_token')
      .on(table.tokenHash)
      .where(sql`revoked_at IS NULL`),
    expiredIdx: index('idx_sessions_expired')
      .on(table.expiresAt)
      .where(sql`revoked_at IS NULL`),
  })
);

// ════════════════════════════════════════════════════════════════════════════
// TYPE EXPORTS
// ════════════════════════════════════════════════════════════════════════════

export { user as users, session as sessions };

export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
export type Session = typeof session.$inferSelect;
export type NewSession = typeof session.$inferInsert;

// Public user (no sensitive fields) — for client responses
export type PublicUser = Omit<
  User,
  | 'passwordHash'
  | 'pinHash'
  | 'twoFactorSecret'
  | 'recoveryCodes'
  | 'allowedDevices'
>;

// Helper type guards
export const isCashier = (user: User): boolean => user.role === 'cashier';
export const isAdmin = (user: User): boolean =>
  user.role === 'admin' || user.role === 'tenant_owner';
export const canViewCostPrice = (user: User): boolean =>
  ['tenant_owner', 'admin', 'manager', 'accountant'].includes(user.role);
