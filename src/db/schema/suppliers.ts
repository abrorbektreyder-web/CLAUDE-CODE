
import {
  pgTable,
  uuid,
  varchar,
  text,
  decimal,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { idColumn, timestamps } from './_shared';
import { tenants } from './tenants';
import { suppliers } from './inventory';
import { users } from './users';

// ════════════════════════════════════════════════════════════════════════════
// SUPPLIER_TRANSACTIONS — Audit trail of payments and purchases
// ════════════════════════════════════════════════════════════════════════════

export const supplierTransactions = pgTable(
  'supplier_transactions',
  {
    id: idColumn,
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    supplierId: uuid('supplier_id')
      .notNull()
      .references(() => suppliers.id, { onDelete: 'cascade' }),

    // Transaction info
    type: varchar('type', { length: 20 }).notNull(), // 'purchase', 'payment', 'return', 'adjustment'
    amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
    currency: varchar('currency', { length: 3 }).notNull().default('USD'),
    
    // Balance AFTER this transaction (snapshot)
    balanceSnapshot: decimal('balance_snapshot', { precision: 15, scale: 2 }),

    // References
    referenceType: varchar('reference_type', { length: 50 }), // 'purchase_order', 'manual_payment'
    referenceId: uuid('reference_id'),
    documentNumber: varchar('document_number', { length: 100 }),

    notes: text('notes'),
    performedBy: uuid('performed_by')
      .notNull()
      .references(() => users.id),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tenantIdx: index('idx_sup_trans_tenant').on(table.tenantId),
    supplierIdx: index('idx_sup_trans_supplier').on(
      table.supplierId,
      sql`${table.createdAt} DESC`
    ),
    refIdx: index('idx_sup_trans_reference').on(table.referenceType, table.referenceId),
  })
);

export type SupplierTransaction = typeof supplierTransactions.$inferSelect;
export type NewSupplierTransaction = typeof supplierTransactions.$inferInsert;
