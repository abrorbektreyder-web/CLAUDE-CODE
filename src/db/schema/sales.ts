import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  decimal,
  timestamp,
  bigserial,
  inet,
  jsonb,
  date,
  index,
  uniqueIndex,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import {
  idColumn,
  timestamps,
  saleStatus,
  paymentMethod,
  paymentType,
  shiftStatus,
} from './_shared';
import { tenants, branches } from './tenants';
import { users } from './users';
import { customers } from './customers';
import { products, phoneUnits, productVariants } from './inventory';

// ════════════════════════════════════════════════════════════════════════════
// SHIFTS — Cashier work shifts
// ════════════════════════════════════════════════════════════════════════════

export const shifts = pgTable(
  'shifts',
  {
    id: idColumn,
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    cashierId: uuid('cashier_id')
      .notNull()
      .references(() => users.id),
    branchId: uuid('branch_id')
      .notNull()
      .references(() => branches.id),

    shiftNumber: integer('shift_number').notNull(),

    // Times
    openedAt: timestamp('opened_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    closedAt: timestamp('closed_at', { withTimezone: true }),

    // Cash management
    openingCash: decimal('opening_cash', { precision: 15, scale: 2 })
      .notNull()
      .default('0'),
    expectedCash: decimal('expected_cash', { precision: 15, scale: 2 }),
    closingCash: decimal('closing_cash', { precision: 15, scale: 2 }),
    cashDifference: decimal('cash_difference', { precision: 15, scale: 2 }),

    // Statistics
    totalSalesCount: integer('total_sales_count').notNull().default(0),
    totalSalesAmount: decimal('total_sales_amount', { precision: 15, scale: 2 })
      .notNull()
      .default('0'),
    totalRefundsCount: integer('total_refunds_count').notNull().default(0),
    totalRefundsAmount: decimal('total_refunds_amount', { precision: 15, scale: 2 })
      .notNull()
      .default('0'),

    closingNotes: text('closing_notes'),
    status: shiftStatus('status').notNull().default('open'),

    // IP tracking
    openedIp: inet('opened_ip'),
    closedIp: inet('closed_ip'),

    ...timestamps,
  },
  (table) => ({
    shiftNumberUnique: uniqueIndex('idx_shifts_number').on(
      table.tenantId,
      table.shiftNumber
    ),
    tenantIdx: index('idx_shifts_tenant').on(table.tenantId),
    cashierIdx: index('idx_shifts_cashier').on(table.cashierId, table.openedAt),
    branchIdx: index('idx_shifts_branch').on(table.branchId, table.openedAt),
    openIdx: index('idx_shifts_open')
      .on(table.tenantId, table.status)
      .where(sql`status = 'open'`),
    oneOpenPerCashier: uniqueIndex('idx_shifts_one_open_per_cashier')
      .on(table.cashierId)
      .where(sql`status = 'open'`),
  })
);

// ════════════════════════════════════════════════════════════════════════════
// SALES — Main sales transactions
// ════════════════════════════════════════════════════════════════════════════

export const sales = pgTable(
  'sales',
  {
    id: idColumn,
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    branchId: uuid('branch_id')
      .notNull()
      .references(() => branches.id),
    cashierId: uuid('cashier_id')
      .notNull()
      .references(() => users.id),
    shiftId: uuid('shift_id').references(() => shifts.id),
    customerId: uuid('customer_id').references(() => customers.id),

    // Receipt number (auto-incrementing per row)
    receiptNumber: bigserial('receipt_number', { mode: 'bigint' }),

    // Idempotency (prevent double-submit)
    idempotencyKey: uuid('idempotency_key').unique(),

    // Amounts
    subtotal: decimal('subtotal', { precision: 15, scale: 2 }).notNull(),
    discountAmount: decimal('discount_amount', { precision: 15, scale: 2 })
      .notNull()
      .default('0'),
    discountPercent: decimal('discount_percent', { precision: 5, scale: 2 }),
    discountReason: text('discount_reason'),
    taxAmount: decimal('tax_amount', { precision: 15, scale: 2 })
      .notNull()
      .default('0'),
    total: decimal('total', { precision: 15, scale: 2 }).notNull(),

    // Payment
    paymentMethod: paymentMethod('payment_method').notNull(),
    paidAmount: decimal('paid_amount', { precision: 15, scale: 2 })
      .notNull()
      .default('0'),
    debtAmount: decimal('debt_amount', { precision: 15, scale: 2 })
      .notNull()
      .default('0'),
    changeDue: decimal('change_due', { precision: 15, scale: 2 })
      .notNull()
      .default('0'),

    // Status
    status: saleStatus('status').notNull().default('completed'),

    // Refund tracking
    refundedAmount: decimal('refunded_amount', { precision: 15, scale: 2 })
      .notNull()
      .default('0'),
    refundedAt: timestamp('refunded_at', { withTimezone: true }),
    refundedBy: uuid('refunded_by').references(() => users.id),
    refundReason: text('refund_reason'),
    originalSaleId: uuid('original_sale_id'),

    // Receipt
    printedAt: timestamp('printed_at', { withTimezone: true }),
    printCount: integer('print_count').notNull().default(0),

    // Customer notification
    notificationSentAt: timestamp('notification_sent_at', { withTimezone: true }),

    notes: text('notes'),

    ...timestamps,
  },
  (table) => ({
    tenantIdx: index('idx_sales_tenant').on(table.tenantId),
    receiptIdx: index('idx_sales_receipt').on(table.tenantId, table.receiptNumber),
    branchDateIdx: index('idx_sales_branch_date').on(
      table.branchId,
      sql`${table.createdAt} DESC`
    ),
    cashierDateIdx: index('idx_sales_cashier_date').on(
      table.cashierId,
      sql`${table.createdAt} DESC`
    ),
    customerIdx: index('idx_sales_customer')
      .on(table.customerId)
      .where(sql`customer_id IS NOT NULL`),
    shiftIdx: index('idx_sales_shift').on(table.shiftId),
    statusIdx: index('idx_sales_status').on(table.tenantId, table.status),
    dateIdx: index('idx_sales_date').on(
      table.tenantId,
      sql`${table.createdAt} DESC`
    ),
    idempotencyIdx: index('idx_sales_idempotency')
      .on(table.idempotencyKey)
      .where(sql`idempotency_key IS NOT NULL`),

    totalCheck: check(
      'valid_total',
      sql`total = subtotal - discount_amount + tax_amount`
    ),
    paymentCheck: check(
      'valid_payment',
      sql`paid_amount + debt_amount >= total`
    ),
  })
);

// ════════════════════════════════════════════════════════════════════════════
// SALE_ITEMS — Individual items within a sale
// ════════════════════════════════════════════════════════════════════════════

export const saleItems = pgTable(
  'sale_items',
  {
    id: idColumn,
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    saleId: uuid('sale_id')
      .notNull()
      .references(() => sales.id, { onDelete: 'cascade' }),

    // What was sold (one of these)
    productId: uuid('product_id').references(() => products.id),
    phoneUnitId: uuid('phone_unit_id').references(() => phoneUnits.id),
    variantId: uuid('variant_id').references(() => productVariants.id),

    // Snapshot
    productName: varchar('product_name', { length: 200 }).notNull(),
    productSku: varchar('product_sku', { length: 50 }),
    imeiLastFour: varchar('imei_last_four', { length: 4 }),

    // Quantities & pricing
    quantity: integer('quantity').notNull().default(1),
    unitPrice: decimal('unit_price', { precision: 15, scale: 2 }).notNull(),
    costPrice: decimal('cost_price', { precision: 15, scale: 2 }).notNull(),
    discountAmount: decimal('discount_amount', { precision: 15, scale: 2 })
      .notNull()
      .default('0'),
    total: decimal('total', { precision: 15, scale: 2 }).notNull(),

    // Warranty
    warrantyMonths: integer('warranty_months'),
    warrantyUntil: date('warranty_until'),

    // Refund tracking
    refundedQuantity: integer('refunded_quantity').notNull().default(0),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    saleIdx: index('idx_sale_items_sale').on(table.saleId),
    productIdx: index('idx_sale_items_product').on(table.productId),
    phoneIdx: index('idx_sale_items_phone')
      .on(table.phoneUnitId)
      .where(sql`phone_unit_id IS NOT NULL`),
    variantIdx: index('idx_sale_items_variant')
      .on(table.variantId)
      .where(sql`variant_id IS NOT NULL`),
    tenantIdx: index('idx_sale_items_tenant').on(table.tenantId),

    quantityCheck: check('positive_quantity', sql`quantity > 0`),
    refundCheck: check('refund_lte_quantity', sql`refunded_quantity <= quantity`),
  })
);

// ════════════════════════════════════════════════════════════════════════════
// SUSPENDED_SALES — Saved/parked sales (resumable later)
// ════════════════════════════════════════════════════════════════════════════

export const suspendedSales = pgTable(
  'suspended_sales',
  {
    id: idColumn,
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    cashierId: uuid('cashier_id')
      .notNull()
      .references(() => users.id),
    branchId: uuid('branch_id')
      .notNull()
      .references(() => branches.id),
    customerId: uuid('customer_id').references(() => customers.id),

    cartData: jsonb('cart_data').notNull(),
    totalAmount: decimal('total_amount', { precision: 15, scale: 2 }).notNull(),

    label: varchar('label', { length: 100 }),

    expiresAt: timestamp('expires_at', { withTimezone: true })
      .notNull()
      .default(sql`NOW() + INTERVAL '24 hours'`),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tenantIdx: index('idx_suspended_tenant').on(
      table.tenantId,
      sql`${table.createdAt} DESC`
    ),
    cashierIdx: index('idx_suspended_cashier').on(
      table.cashierId,
      sql`${table.createdAt} DESC`
    ),
    expiresIdx: index('idx_suspended_expires').on(table.expiresAt),
  })
);

// ════════════════════════════════════════════════════════════════════════════
// TYPE EXPORTS
// ════════════════════════════════════════════════════════════════════════════

export type Shift = typeof shifts.$inferSelect;
export type NewShift = typeof shifts.$inferInsert;
export type Sale = typeof sales.$inferSelect;
export type NewSale = typeof sales.$inferInsert;
export type SaleItem = typeof saleItems.$inferSelect;
export type NewSaleItem = typeof saleItems.$inferInsert;
export type SuspendedSale = typeof suspendedSales.$inferSelect;
export type NewSuspendedSale = typeof suspendedSales.$inferInsert;

// Composed type — Sale with all its items
export type SaleWithItems = Sale & { items: SaleItem[] };
