import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  decimal,
  timestamp,
  jsonb,
  inet,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import {
  idColumn,
  timestamps,
  movementType,
  notificationChannel,
  notificationType,
  auditAction,
} from './_shared';
import { tenants, branches } from './tenants';
import { users } from './users';
import { customers } from './customers';
import { products, productVariants, phoneUnits } from './inventory';
import { suppliers } from './inventory';
import { sales } from './sales';

// ════════════════════════════════════════════════════════════════════════════
// STOCK_MOVEMENTS — Audit trail of inventory changes
// ════════════════════════════════════════════════════════════════════════════

export const stockMovements = pgTable(
  'stock_movements',
  {
    id: idColumn,
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),

    movementType: movementType('movement_type').notNull(),

    productId: uuid('product_id').references(() => products.id),
    variantId: uuid('variant_id').references(() => productVariants.id),
    phoneUnitId: uuid('phone_unit_id').references(() => phoneUnits.id),

    fromBranchId: uuid('from_branch_id').references(() => branches.id),
    toBranchId: uuid('to_branch_id').references(() => branches.id),

    quantity: integer('quantity').notNull(),
    unitCost: decimal('unit_cost', { precision: 15, scale: 2 }),

    referenceType: varchar('reference_type', { length: 50 }),
    referenceId: uuid('reference_id'),
    documentNumber: varchar('document_number', { length: 100 }),

    reason: text('reason'),
    notes: text('notes'),

    performedBy: uuid('performed_by')
      .notNull()
      .references(() => users.id),
    approvedBy: uuid('approved_by').references(() => users.id),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tenantDateIdx: index('idx_movements_tenant').on(
      table.tenantId,
      sql`${table.createdAt} DESC`
    ),
    productIdx: index('idx_movements_product').on(
      table.productId,
      sql`${table.createdAt} DESC`
    ),
    variantIdx: index('idx_movements_variant').on(
      table.variantId,
      sql`${table.createdAt} DESC`
    ),
    phoneIdx: index('idx_movements_phone').on(table.phoneUnitId),
    branchIdx: index('idx_movements_branch').on(
      table.fromBranchId,
      table.toBranchId
    ),
    referenceIdx: index('idx_movements_reference').on(
      table.referenceType,
      table.referenceId
    ),
  })
);

// ════════════════════════════════════════════════════════════════════════════
// PURCHASE_ORDERS — Incoming inventory from suppliers
// ════════════════════════════════════════════════════════════════════════════

export const purchaseOrders = pgTable(
  'purchase_orders',
  {
    id: idColumn,
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    supplierId: uuid('supplier_id')
      .notNull()
      .references(() => suppliers.id),
    branchId: uuid('branch_id')
      .notNull()
      .references(() => branches.id),

    orderNumber: varchar('order_number', { length: 50 }).notNull(),
    invoiceNumber: varchar('invoice_number', { length: 50 }),

    subtotal: decimal('subtotal', { precision: 15, scale: 2 })
      .notNull()
      .default('0'),
    taxAmount: decimal('tax_amount', { precision: 15, scale: 2 })
      .notNull()
      .default('0'),
    total: decimal('total', { precision: 15, scale: 2 }).notNull().default('0'),
    paidAmount: decimal('paid_amount', { precision: 15, scale: 2 })
      .notNull()
      .default('0'),

    status: varchar('status', { length: 20 }).notNull().default('draft'),
    orderedAt: timestamp('ordered_at', { withTimezone: true }),
    receivedAt: timestamp('received_at', { withTimezone: true }),

    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id),
    receivedBy: uuid('received_by').references(() => users.id),

    notes: text('notes'),

    ...timestamps,
  },
  (table) => ({
    orderNumberUnique: uniqueIndex('idx_po_number').on(
      table.tenantId,
      table.orderNumber
    ),
    tenantIdx: index('idx_po_tenant').on(table.tenantId),
    supplierIdx: index('idx_po_supplier').on(table.supplierId),
    statusIdx: index('idx_po_status').on(table.tenantId, table.status),
  })
);

// ════════════════════════════════════════════════════════════════════════════
// AUDIT_LOGS — Immutable audit trail (UPDATE/DELETE blocked by trigger)
// ════════════════════════════════════════════════════════════════════════════

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: idColumn,
    // No FK — to allow logging deleted tenants
    tenantId: uuid('tenant_id').notNull(),
    userId: uuid('user_id'),

    action: auditAction('action').notNull(),
    entityType: varchar('entity_type', { length: 50 }).notNull(),
    entityId: uuid('entity_id'),

    oldValues: jsonb('old_values'),
    newValues: jsonb('new_values'),
    changes: jsonb('changes'),

    ipAddress: inet('ip_address'),
    userAgent: text('user_agent'),
    sessionId: uuid('session_id'),
    requestId: uuid('request_id'),

    severity: varchar('severity', { length: 10 }).notNull().default('info'),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tenantDateIdx: index('idx_audit_tenant_date').on(
      table.tenantId,
      sql`${table.createdAt} DESC`
    ),
    userIdx: index('idx_audit_user')
      .on(table.userId, sql`${table.createdAt} DESC`)
      .where(sql`user_id IS NOT NULL`),
    entityIdx: index('idx_audit_entity').on(table.entityType, table.entityId),
    actionIdx: index('idx_audit_action').on(
      table.tenantId,
      table.action,
      sql`${table.createdAt} DESC`
    ),
    severityIdx: index('idx_audit_severity')
      .on(table.tenantId, table.severity, sql`${table.createdAt} DESC`)
      .where(sql`severity != 'info'`),
  })
);

// ════════════════════════════════════════════════════════════════════════════
// NOTIFICATIONS — Telegram, SMS, Email queue
// ════════════════════════════════════════════════════════════════════════════

export const notifications = pgTable(
  'notifications',
  {
    id: idColumn,
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),

    notificationType: notificationType('notification_type').notNull(),
    channel: notificationChannel('channel').notNull(),

    recipientUserId: uuid('recipient_user_id').references(() => users.id),
    recipientCustomerId: uuid('recipient_customer_id').references(() => customers.id),
    recipientAddress: varchar('recipient_address', { length: 200 }),

    subject: varchar('subject', { length: 200 }),
    message: text('message').notNull(),
    payload: jsonb('payload'),

    status: varchar('status', { length: 20 }).notNull().default('pending'),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    deliveredAt: timestamp('delivered_at', { withTimezone: true }),
    failedAt: timestamp('failed_at', { withTimezone: true }),
    errorMessage: text('error_message'),
    retryCount: integer('retry_count').notNull().default(0),

    referenceType: varchar('reference_type', { length: 50 }),
    referenceId: uuid('reference_id'),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tenantIdx: index('idx_notifications_tenant').on(
      table.tenantId,
      sql`${table.createdAt} DESC`
    ),
    pendingIdx: index('idx_notifications_pending')
      .on(table.status, table.createdAt)
      .where(sql`status = 'pending'`),
    userIdx: index('idx_notifications_user').on(
      table.recipientUserId,
      sql`${table.createdAt} DESC`
    ),
    customerIdx: index('idx_notifications_customer').on(
      table.recipientCustomerId,
      sql`${table.createdAt} DESC`
    ),
    referenceIdx: index('idx_notifications_reference').on(
      table.referenceType,
      table.referenceId
    ),
  })
);

// ════════════════════════════════════════════════════════════════════════════
// WARRANTY_CLAIMS — Customer warranty service requests
// ════════════════════════════════════════════════════════════════════════════

export const warrantyClaims = pgTable(
  'warranty_claims',
  {
    id: idColumn,
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),

    phoneUnitId: uuid('phone_unit_id').references(() => phoneUnits.id),
    saleId: uuid('sale_id')
      .notNull()
      .references(() => sales.id),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id),

    claimNumber: varchar('claim_number', { length: 50 }).notNull(),
    issueDescription: text('issue_description').notNull(),

    status: varchar('status', { length: 20 }).notNull().default('open'),
    resolution: varchar('resolution', { length: 50 }),
    resolutionNotes: text('resolution_notes'),

    receivedAt: timestamp('received_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),

    createdBy: uuid('created_by').references(() => users.id),
    resolvedBy: uuid('resolved_by').references(() => users.id),

    ...timestamps,
  },
  (table) => ({
    claimNumberUnique: uniqueIndex('idx_warranty_claim_number').on(
      table.tenantId,
      table.claimNumber
    ),
    tenantIdx: index('idx_warranty_tenant').on(table.tenantId),
    phoneIdx: index('idx_warranty_phone').on(table.phoneUnitId),
    statusIdx: index('idx_warranty_status').on(table.tenantId, table.status),
  })
);

// ════════════════════════════════════════════════════════════════════════════
// TYPE EXPORTS
// ════════════════════════════════════════════════════════════════════════════

export type StockMovement = typeof stockMovements.$inferSelect;
export type NewStockMovement = typeof stockMovements.$inferInsert;
export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type NewPurchaseOrder = typeof purchaseOrders.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type WarrantyClaim = typeof warrantyClaims.$inferSelect;
export type NewWarrantyClaim = typeof warrantyClaims.$inferInsert;
