import { pgEnum, uuid, timestamp, varchar, boolean } from 'drizzle-orm/pg-core';

// ════════════════════════════════════════════════════════════════════════════
// ENUM TYPES — must match SQL schema exactly
// ════════════════════════════════════════════════════════════════════════════

export const planTier = pgEnum('plan_tier', [
  'free',
  'starter',
  'pro',
  'enterprise',
]);

export const tenantStatus = pgEnum('tenant_status', [
  'active',
  'suspended',
  'cancelled',
  'trial',
]);

export const userRole = pgEnum('user_role', [
  'super_admin',
  'tenant_owner',
  'admin',
  'manager',
  'accountant',
  'warehouse',
  'cashier',
]);

export const phoneCondition = pgEnum('phone_condition', [
  'new',
  'opened',
  'used',
  'demo',
  'refurbished',
]);

export const phoneStatus = pgEnum('phone_status', [
  'in_stock',
  'reserved',
  'sold',
  'returned',
  'defective',
  'transferred',
  'demo_active',
  'lost',
]);

export const saleStatus = pgEnum('sale_status', [
  'draft',
  'completed',
  'partially_refunded',
  'refunded',
  'cancelled',
]);

export const paymentMethod = pgEnum('payment_method', [
  'cash',
  'card',
  'transfer',
  'credit',
  'mixed',
]);

export const paymentType = pgEnum('payment_type', [
  'sale',
  'debt_payment',
  'refund',
]);

export const debtStatus = pgEnum('debt_status', [
  'active',
  'overdue',
  'paid',
  'defaulted',
  'restructured',
]);

export const movementType = pgEnum('movement_type', [
  'incoming',
  'outgoing',
  'transfer_in',
  'transfer_out',
  'adjustment',
  'return',
  'defect',
]);

export const shiftStatus = pgEnum('shift_status', [
  'open',
  'closed',
  'forced_closed',
]);

export const notificationChannel = pgEnum('notification_channel', [
  'telegram',
  'sms',
  'email',
  'in_app',
]);

export const expenseType = pgEnum('expense_type', [
  'operating', // Daily small expenses (lunch, taxi)
  'fixed',     // Big monthly expenses (rent, salary, utilities)
  'inventory', // Purchases of goods
  'marketing', // Ad costs
  'other',
]);

export const notificationType = pgEnum('notification_type', [
  'sale_made',
  'daily_report',
  'low_stock',
  'debt_reminder',
  'debt_overdue',
  'warranty_expiring',
  'shift_anomaly',
  'large_refund_request',
  'new_login_alert',
  'system_alert',
]);

export const auditAction = pgEnum('audit_action', [
  'create',
  'update',
  'delete',
  'view',
  'login',
  'logout',
  'login_failed',
  'export',
  'import',
  'restore',
  'refund',
  'discount_apply',
  'price_change',
  'shift_open',
  'shift_close',
  'cash_count',
  'permission_grant',
  'permission_revoke',
  'data_decrypt',
]);

// ════════════════════════════════════════════════════════════════════════════
// SHARED COLUMNS — DRY pattern for common fields
// ════════════════════════════════════════════════════════════════════════════

/**
 * Standard ID column with UUID v4 default
 */
export const idColumn = uuid('id').primaryKey().defaultRandom();

/**
 * Standard timestamps for all tables
 */
export const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
};

/**
 * Soft delete timestamp
 */
export const softDelete = {
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
};

/**
 * Combined timestamps with soft delete
 */
export const allTimestamps = {
  ...timestamps,
  ...softDelete,
};
