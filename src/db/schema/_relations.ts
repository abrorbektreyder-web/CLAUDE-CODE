import { relations } from 'drizzle-orm';
import { tenants, branches } from './tenants';
import { user, session } from './users';
import {
  categories,
  suppliers,
  products,
  phoneUnits,
  productVariants,
  stockLevels,
} from './inventory';
import { customers } from './customers';
import { shifts, sales, saleItems, suspendedSales } from './sales';
import { payments, debts, debtSchedules } from './finance';
import {
  stockMovements,
  purchaseOrders,
  auditLogs,
  notifications,
  warrantyClaims,
} from './operations';

// ════════════════════════════════════════════════════════════════════════════
// TENANTS
// ════════════════════════════════════════════════════════════════════════════

export const tenantsRelations = relations(tenants, ({ many }) => ({
  branches: many(branches),
  users: many(user),
  customers: many(customers),
  products: many(products),
  sales: many(sales),
}));

// ════════════════════════════════════════════════════════════════════════════
// BRANCHES
// ════════════════════════════════════════════════════════════════════════════

export const branchesRelations = relations(branches, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [branches.tenantId],
    references: [tenants.id],
  }),
  users: many(user),
  phoneUnits: many(phoneUnits),
  shifts: many(shifts),
  sales: many(sales),
}));

// ════════════════════════════════════════════════════════════════════════════
// USERS
// ════════════════════════════════════════════════════════════════════════════

export const usersRelations = relations(user, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [user.tenantId],
    references: [tenants.id],
  }),
  branch: one(branches, {
    fields: [user.branchId],
    references: [branches.id],
  }),
  sessions: many(session),
  shifts: many(shifts),
  sales: many(sales),
}));

export const sessionsRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
  tenant: one(tenants, {
    fields: [session.tenantId],
    references: [tenants.id],
  }),
}));

// ════════════════════════════════════════════════════════════════════════════
// INVENTORY
// ════════════════════════════════════════════════════════════════════════════

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [categories.tenantId],
    references: [tenants.id],
  }),
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: 'parent_category',
  }),
  children: many(categories, { relationName: 'parent_category' }),
  products: many(products),
}));

export const suppliersRelations = relations(suppliers, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [suppliers.tenantId],
    references: [tenants.id],
  }),
  phoneUnits: many(phoneUnits),
  purchaseOrders: many(purchaseOrders),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [products.tenantId],
    references: [tenants.id],
  }),
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  phoneUnits: many(phoneUnits),
  variants: many(productVariants),
}));

export const phoneUnitsRelations = relations(phoneUnits, ({ one }) => ({
  tenant: one(tenants, {
    fields: [phoneUnits.tenantId],
    references: [tenants.id],
  }),
  product: one(products, {
    fields: [phoneUnits.productId],
    references: [products.id],
  }),
  branch: one(branches, {
    fields: [phoneUnits.branchId],
    references: [branches.id],
  }),
  supplier: one(suppliers, {
    fields: [phoneUnits.supplierId],
    references: [suppliers.id],
  }),
  soldToCustomer: one(customers, {
    fields: [phoneUnits.soldToCustomerId],
    references: [customers.id],
  }),
  soldInSale: one(sales, {
    fields: [phoneUnits.soldInSaleId],
    references: [sales.id],
  }),
}));

export const productVariantsRelations = relations(
  productVariants,
  ({ one, many }) => ({
    tenant: one(tenants, {
      fields: [productVariants.tenantId],
      references: [tenants.id],
    }),
    product: one(products, {
      fields: [productVariants.productId],
      references: [products.id],
    }),
    stockLevels: many(stockLevels),
  })
);

export const stockLevelsRelations = relations(stockLevels, ({ one }) => ({
  tenant: one(tenants, {
    fields: [stockLevels.tenantId],
    references: [tenants.id],
  }),
  variant: one(productVariants, {
    fields: [stockLevels.variantId],
    references: [productVariants.id],
  }),
  branch: one(branches, {
    fields: [stockLevels.branchId],
    references: [branches.id],
  }),
}));

// ════════════════════════════════════════════════════════════════════════════
// CUSTOMERS
// ════════════════════════════════════════════════════════════════════════════

export const customersRelations = relations(customers, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [customers.tenantId],
    references: [tenants.id],
  }),
  sales: many(sales),
  debts: many(debts),
  warrantyClaims: many(warrantyClaims),
}));

// ════════════════════════════════════════════════════════════════════════════
// SALES
// ════════════════════════════════════════════════════════════════════════════

export const shiftsRelations = relations(shifts, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [shifts.tenantId],
    references: [tenants.id],
  }),
  cashier: one(user, {
    fields: [shifts.cashierId],
    references: [user.id],
  }),
  branch: one(branches, {
    fields: [shifts.branchId],
    references: [branches.id],
  }),
  sales: many(sales),
}));

export const salesRelations = relations(sales, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [sales.tenantId],
    references: [tenants.id],
  }),
  branch: one(branches, {
    fields: [sales.branchId],
    references: [branches.id],
  }),
  cashier: one(user, {
    fields: [sales.cashierId],
    references: [user.id],
  }),
  shift: one(shifts, {
    fields: [sales.shiftId],
    references: [shifts.id],
  }),
  customer: one(customers, {
    fields: [sales.customerId],
    references: [customers.id],
  }),
  refundedByUser: one(user, {
    fields: [sales.refundedBy],
    references: [user.id],
    relationName: 'refunded_by',
  }),
  items: many(saleItems),
  payments: many(payments),
  debt: one(debts, {
    fields: [sales.id],
    references: [debts.saleId],
  }),
}));

export const saleItemsRelations = relations(saleItems, ({ one }) => ({
  tenant: one(tenants, {
    fields: [saleItems.tenantId],
    references: [tenants.id],
  }),
  sale: one(sales, {
    fields: [saleItems.saleId],
    references: [sales.id],
  }),
  product: one(products, {
    fields: [saleItems.productId],
    references: [products.id],
  }),
  phoneUnit: one(phoneUnits, {
    fields: [saleItems.phoneUnitId],
    references: [phoneUnits.id],
  }),
  variant: one(productVariants, {
    fields: [saleItems.variantId],
    references: [productVariants.id],
  }),
}));

export const suspendedSalesRelations = relations(suspendedSales, ({ one }) => ({
  tenant: one(tenants, {
    fields: [suspendedSales.tenantId],
    references: [tenants.id],
  }),
  cashier: one(user, {
    fields: [suspendedSales.cashierId],
    references: [user.id],
  }),
  branch: one(branches, {
    fields: [suspendedSales.branchId],
    references: [branches.id],
  }),
  customer: one(customers, {
    fields: [suspendedSales.customerId],
    references: [customers.id],
  }),
}));

// ════════════════════════════════════════════════════════════════════════════
// FINANCE
// ════════════════════════════════════════════════════════════════════════════

export const paymentsRelations = relations(payments, ({ one }) => ({
  tenant: one(tenants, {
    fields: [payments.tenantId],
    references: [tenants.id],
  }),
  sale: one(sales, {
    fields: [payments.saleId],
    references: [sales.id],
  }),
  debt: one(debts, {
    fields: [payments.debtId],
    references: [debts.id],
  }),
  receivedByUser: one(user, {
    fields: [payments.receivedBy],
    references: [user.id],
  }),
  shift: one(shifts, {
    fields: [payments.shiftId],
    references: [shifts.id],
  }),
}));

export const debtsRelations = relations(debts, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [debts.tenantId],
    references: [tenants.id],
  }),
  customer: one(customers, {
    fields: [debts.customerId],
    references: [customers.id],
  }),
  sale: one(sales, {
    fields: [debts.saleId],
    references: [sales.id],
  }),
  schedules: many(debtSchedules),
  payments: many(payments),
}));

export const debtSchedulesRelations = relations(debtSchedules, ({ one }) => ({
  tenant: one(tenants, {
    fields: [debtSchedules.tenantId],
    references: [tenants.id],
  }),
  debt: one(debts, {
    fields: [debtSchedules.debtId],
    references: [debts.id],
  }),
}));

// ════════════════════════════════════════════════════════════════════════════
// OPERATIONS
// ════════════════════════════════════════════════════════════════════════════

export const stockMovementsRelations = relations(stockMovements, ({ one }) => ({
  tenant: one(tenants, {
    fields: [stockMovements.tenantId],
    references: [tenants.id],
  }),
  product: one(products, {
    fields: [stockMovements.productId],
    references: [products.id],
  }),
  variant: one(productVariants, {
    fields: [stockMovements.variantId],
    references: [productVariants.id],
  }),
  phoneUnit: one(phoneUnits, {
    fields: [stockMovements.phoneUnitId],
    references: [phoneUnits.id],
  }),
  fromBranch: one(branches, {
    fields: [stockMovements.fromBranchId],
    references: [branches.id],
    relationName: 'from_branch',
  }),
  toBranch: one(branches, {
    fields: [stockMovements.toBranchId],
    references: [branches.id],
    relationName: 'to_branch',
  }),
  performedByUser: one(user, {
    fields: [stockMovements.performedBy],
    references: [user.id],
  }),
}));

export const purchaseOrdersRelations = relations(purchaseOrders, ({ one }) => ({
  tenant: one(tenants, {
    fields: [purchaseOrders.tenantId],
    references: [tenants.id],
  }),
  supplier: one(suppliers, {
    fields: [purchaseOrders.supplierId],
    references: [suppliers.id],
  }),
  branch: one(branches, {
    fields: [purchaseOrders.branchId],
    references: [branches.id],
  }),
  createdByUser: one(user, {
    fields: [purchaseOrders.createdBy],
    references: [user.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  tenant: one(tenants, {
    fields: [notifications.tenantId],
    references: [tenants.id],
  }),
  recipientUser: one(user, {
    fields: [notifications.recipientUserId],
    references: [user.id],
  }),
  recipientCustomer: one(customers, {
    fields: [notifications.recipientCustomerId],
    references: [customers.id],
  }),
}));

export const warrantyClaimsRelations = relations(warrantyClaims, ({ one }) => ({
  tenant: one(tenants, {
    fields: [warrantyClaims.tenantId],
    references: [tenants.id],
  }),
  phoneUnit: one(phoneUnits, {
    fields: [warrantyClaims.phoneUnitId],
    references: [phoneUnits.id],
  }),
  sale: one(sales, {
    fields: [warrantyClaims.saleId],
    references: [sales.id],
  }),
  customer: one(customers, {
    fields: [warrantyClaims.customerId],
    references: [customers.id],
  }),
}));

