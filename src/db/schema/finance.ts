import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  decimal,
  timestamp,
  boolean,
  date,
  index,
  uniqueIndex,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import {
  idColumn,
  timestamps,
  paymentMethod,
  paymentType,
  debtStatus,
  notificationChannel,
} from './_shared';
import { tenants, branches } from './tenants';
import { users } from './users';
import { customers } from './customers';
import { sales, shifts } from './sales';

// ════════════════════════════════════════════════════════════════════════════
// PAYMENTS — All payment transactions (sale, debt, refund)
// ════════════════════════════════════════════════════════════════════════════

export const payments = pgTable(
  'payments',
  {
    id: idColumn,
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),

    // What this payment is for
    paymentType: paymentType('payment_type').notNull(),
    saleId: uuid('sale_id').references(() => sales.id),
    debtId: uuid('debt_id'), // FK added below after debts table
    refundForSaleId: uuid('refund_for_sale_id').references(() => sales.id),

    // Payment details
    method: paymentMethod('method').notNull(),
    amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),

    // Bank/transfer
    cardLastFour: varchar('card_last_four', { length: 4 }),
    transactionReference: varchar('transaction_reference', { length: 100 }),

    // Who and when
    receivedBy: uuid('received_by')
      .notNull()
      .references(() => users.id),
    shiftId: uuid('shift_id').references(() => shifts.id),
    branchId: uuid('branch_id').references(() => branches.id),

    notes: text('notes'),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tenantIdx: index('idx_payments_tenant').on(table.tenantId),
    saleIdx: index('idx_payments_sale').on(table.saleId),
    debtIdx: index('idx_payments_debt').on(table.debtId),
    shiftIdx: index('idx_payments_shift').on(table.shiftId),
    dateIdx: index('idx_payments_date').on(
      table.tenantId,
      sql`${table.createdAt} DESC`
    ),

    amountCheck: check('positive_amount', sql`amount > 0`),
  })
);

// ════════════════════════════════════════════════════════════════════════════
// DEBTS — Customer credit (nasiya)
// ════════════════════════════════════════════════════════════════════════════

export const debts = pgTable(
  'debts',
  {
    id: idColumn,
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id),
    saleId: uuid('sale_id')
      .notNull()
      .references(() => sales.id),

    // Original amount
    principalAmount: decimal('principal_amount', { precision: 15, scale: 2 }).notNull(),
    interestRate: decimal('interest_rate', { precision: 5, scale: 2 })
      .notNull()
      .default('0'),
    totalAmount: decimal('total_amount', { precision: 15, scale: 2 }).notNull(),
    totalInterest: decimal('total_interest', { precision: 15, scale: 2 })
      .notNull()
      .default('0'),

    // Schedule
    totalMonths: integer('total_months').notNull(),
    monthlyPayment: decimal('monthly_payment', { precision: 15, scale: 2 }).notNull(),
    startDate: date('start_date').notNull(),
    endDate: date('end_date').notNull(),

    // Tracking
    paidAmount: decimal('paid_amount', { precision: 15, scale: 2 })
      .notNull()
      .default('0'),
    remainingAmount: decimal('remaining_amount', { precision: 15, scale: 2 }).notNull(),
    nextPaymentDate: date('next_payment_date'),
    nextPaymentAmount: decimal('next_payment_amount', { precision: 15, scale: 2 }),
    paymentsMade: integer('payments_made').notNull().default(0),
    paymentsOverdue: integer('payments_overdue').notNull().default(0),

    // Status
    status: debtStatus('status').notNull().default('active'),
    isOverdue: boolean('is_overdue').notNull().default(false),
    overdueDays: integer('overdue_days').notNull().default(0),

    // Reminders
    reminderCount: integer('reminder_count').notNull().default(0),
    lastReminderAt: timestamp('last_reminder_at', { withTimezone: true }),
    lastReminderChannel: notificationChannel('last_reminder_channel'),

    // Resolution
    paidInFullAt: timestamp('paid_in_full_at', { withTimezone: true }),
    defaultedAt: timestamp('defaulted_at', { withTimezone: true }),
    defaultReason: text('default_reason'),

    notes: text('notes'),

    ...timestamps,
  },
  (table) => ({
    tenantIdx: index('idx_debts_tenant').on(table.tenantId),
    customerIdx: index('idx_debts_customer').on(table.customerId),
    statusIdx: index('idx_debts_status').on(table.tenantId, table.status),
    overdueIdx: index('idx_debts_overdue')
      .on(table.tenantId, table.isOverdue)
      .where(sql`status = 'active'`),
    nextPaymentIdx: index('idx_debts_next_payment')
      .on(table.tenantId, table.nextPaymentDate)
      .where(sql`status = 'active'`),

    monthsCheck: check('positive_months', sql`total_months > 0`),
    amountsCheck: check(
      'valid_debt_amounts',
      sql`paid_amount >= 0 AND paid_amount <= total_amount AND remaining_amount = total_amount - paid_amount`
    ),
  })
);

// ════════════════════════════════════════════════════════════════════════════
// DEBT_SCHEDULES — Monthly payment schedule
// ════════════════════════════════════════════════════════════════════════════

export const debtSchedules = pgTable(
  'debt_schedules',
  {
    id: idColumn,
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    debtId: uuid('debt_id')
      .notNull()
      .references(() => debts.id, { onDelete: 'cascade' }),

    installmentNumber: integer('installment_number').notNull(),
    dueDate: date('due_date').notNull(),
    expectedAmount: decimal('expected_amount', { precision: 15, scale: 2 }).notNull(),

    paidAmount: decimal('paid_amount', { precision: 15, scale: 2 })
      .notNull()
      .default('0'),
    paidAt: timestamp('paid_at', { withTimezone: true }),
    // is_paid is GENERATED column — read-only
    isOverdue: boolean('is_overdue').notNull().default(false),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    debtInstallmentUnique: uniqueIndex('idx_schedules_unique').on(
      table.debtId,
      table.installmentNumber
    ),
    debtIdx: index('idx_schedules_debt').on(table.debtId),
    dueIdx: index('idx_schedules_due')
      .on(table.tenantId, table.dueDate)
      .where(sql`paid_amount < expected_amount`),
  })
);

// ════════════════════════════════════════════════════════════════════════════
// TYPE EXPORTS
// ════════════════════════════════════════════════════════════════════════════

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
export type Debt = typeof debts.$inferSelect;
export type NewDebt = typeof debts.$inferInsert;
export type DebtSchedule = typeof debtSchedules.$inferSelect;
export type NewDebtSchedule = typeof debtSchedules.$inferInsert;

// Composed type
export type DebtWithSchedule = Debt & { schedules: DebtSchedule[] };

// ════════════════════════════════════════════════════════════════════════════
// HELPER: Calculate debt payment schedule
// ════════════════════════════════════════════════════════════════════════════

export interface DebtCalculation {
  principalAmount: number;
  interestRate: number; // monthly %
  totalMonths: number;
  monthlyPayment: number;
  totalAmount: number;
  totalInterest: number;
  schedule: Array<{
    installmentNumber: number;
    dueDate: Date;
    amount: number;
  }>;
}

/**
 * Calculate debt payment plan
 *
 * @example
 * calculateDebt(8000000, 3, 3, new Date('2026-04-23'))
 * // → 3 monthly payments of 2,746,667 sum, 240,000 total interest
 */
export function calculateDebt(
  principalAmount: number,
  interestRate: number,
  totalMonths: number,
  startDate: Date
): DebtCalculation {
  const totalInterest = (principalAmount * interestRate * totalMonths) / 100;
  const totalAmount = principalAmount + totalInterest;
  const monthlyPayment = Math.ceil(totalAmount / totalMonths);

  const schedule = Array.from({ length: totalMonths }, (_, i) => {
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + i + 1);
    return {
      installmentNumber: i + 1,
      dueDate,
      amount: i === totalMonths - 1
        ? totalAmount - monthlyPayment * (totalMonths - 1) // Last payment adjusts for rounding
        : monthlyPayment,
    };
  });

  return {
    principalAmount,
    interestRate,
    totalMonths,
    monthlyPayment,
    totalAmount,
    totalInterest,
    schedule,
  };
}
