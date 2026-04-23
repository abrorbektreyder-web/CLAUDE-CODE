// ════════════════════════════════════════════════════════════════════════════
// EXAMPLE QUERIES — Real-world POS scenarios
// ════════════════════════════════════════════════════════════════════════════
// This file shows how to use the Drizzle schema in production code.
// Copy these patterns into your service layer.
// ════════════════════════════════════════════════════════════════════════════

import { eq, and, desc, sql, gte, lte, isNull, isNotNull, or } from 'drizzle-orm';
import { db, withTenant, type TenantContext } from './lib/db';
import {
  hashSensitive,
  prepareEncryptedField,
  normalizePhone,
  isValidImei,
  isValidUzPhone,
  decryptSql,
} from './lib/encryption';
import {
  // Tables
  customers,
  phoneUnits,
  products,
  productVariants,
  stockLevels,
  sales,
  saleItems,
  shifts,
  debts,
  debtSchedules,
  payments,
  // Helpers
  calculateDebt,
  // Types
  type NewSale,
  type NewSaleItem,
  type NewDebt,
} from './schema';
import { randomUUID } from 'node:crypto';

// ════════════════════════════════════════════════════════════════════════════
// 1. FIND PHONE BY IMEI (kassir scans barcode)
// ════════════════════════════════════════════════════════════════════════════

export async function findPhoneByImei(imei: string) {
  if (!isValidImei(imei)) {
    throw new Error('Invalid IMEI: failed Luhn checksum');
  }

  const imeiHash = hashSensitive(imei)!;

  const [phone] = await db
    .select({
      id: phoneUnits.id,
      productId: phoneUnits.productId,
      branchId: phoneUnits.branchId,
      imeiLastFour: phoneUnits.imeiLastFour,
      color: phoneUnits.color,
      storageGb: phoneUnits.storageGb,
      condition: phoneUnits.condition,
      warrantyMonths: phoneUnits.warrantyMonths,
      retailPrice: phoneUnits.retailPrice,
      status: phoneUnits.status,
      // Joined from products
      productName: products.name,
      productBrand: products.brand,
      productModel: products.model,
      productRetailPrice: products.retailPrice,
    })
    .from(phoneUnits)
    .innerJoin(products, eq(phoneUnits.productId, products.id))
    .where(
      and(
        eq(phoneUnits.imeiHash, imeiHash),
        isNull(phoneUnits.deletedAt)
      )
    )
    .limit(1);

  if (!phone) {
    throw new Error('Phone with this IMEI not found');
  }

  if (phone.status !== 'in_stock') {
    throw new Error(`Phone is not available (status: ${phone.status})`);
  }

  return {
    ...phone,
    // Use phone-specific price if set, otherwise product price
    price: phone.retailPrice ?? phone.productRetailPrice,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// 2. SEARCH PRODUCTS (full-text + fuzzy)
// ════════════════════════════════════════════════════════════════════════════

export async function searchProducts(query: string, limit = 20) {
  // Use both full-text search AND ILIKE for fuzzy matching
  return await db
    .select({
      id: products.id,
      name: products.name,
      brand: products.brand,
      sku: products.sku,
      barcode: products.barcode,
      retailPrice: products.retailPrice,
      productType: products.productType,
      imageUrl: products.imageUrl,
    })
    .from(products)
    .where(
      and(
        isNull(products.deletedAt),
        eq(products.isActive, true),
        or(
          // Full-text search (fast, indexed)
          sql`${products.searchVector} @@ plainto_tsquery('simple', ${query})`,
          // Fuzzy fallback (also indexed via trgm)
          sql`${products.name} ILIKE ${`%${query}%`}`,
          // Exact SKU/barcode match
          eq(products.sku, query),
          eq(products.barcode, query)
        )
      )
    )
    .orderBy(
      // Featured products first
      desc(products.isFeatured),
      // Then by relevance
      sql`ts_rank(${products.searchVector}, plainto_tsquery('simple', ${query})) DESC`
    )
    .limit(limit);
}

// ════════════════════════════════════════════════════════════════════════════
// 3. FIND OR CREATE CUSTOMER (during checkout)
// ════════════════════════════════════════════════════════════════════════════

export async function findOrCreateCustomer(input: {
  fullName: string;
  phone: string;
  passport?: string;
  birthDate?: string;
  address?: string;
}) {
  const normalized = normalizePhone(input.phone);
  if (!normalized || !isValidUzPhone(normalized)) {
    throw new Error('Invalid Uzbek phone number');
  }

  const phoneHash = hashSensitive(normalized)!;

  // Check if exists
  const [existing] = await db
    .select()
    .from(customers)
    .where(
      and(
        eq(customers.phoneHash, phoneHash),
        isNull(customers.deletedAt)
      )
    )
    .limit(1);

  if (existing) {
    return { customer: existing, isNew: false };
  }

  // Create new
  const phoneFields = prepareEncryptedField(normalized, 4);
  const passportFields = prepareEncryptedField(input.passport, 4);

  // Note: tenant_id is set by RLS context, but Drizzle types require it.
  // We pass an empty UUID — PostgreSQL trigger will replace it with current_tenant_id().
  // Alternatively, fetch tenantId from session and pass it explicitly.
  const [created] = await db
    .insert(customers)
    .values({
      tenantId: sql`current_tenant_id()` as any,
      fullName: input.fullName.trim(),
      phoneEncrypted: phoneFields.encrypted as any,
      phoneHash: phoneFields.hash!,
      phoneLastFour: phoneFields.lastFour,
      passportEncrypted: passportFields.encrypted as any,
      passportHash: passportFields.hash,
      passportLastFour: passportFields.lastFour,
      birthDate: input.birthDate,
      address: input.address,
    })
    .returning();

  return { customer: created, isNew: true };
}

// ════════════════════════════════════════════════════════════════════════════
// 4. CREATE A SALE (the core POS operation)
// ════════════════════════════════════════════════════════════════════════════

export interface CreateSaleInput {
  branchId: string;
  cashierId: string;
  shiftId: string;
  customerId?: string;

  items: Array<{
    productId?: string;
    phoneUnitId?: string;
    variantId?: string;
    quantity: number;
    unitPrice: number;
    discountAmount?: number;
  }>;

  discountAmount?: number;
  discountReason?: string;

  payment: {
    method: 'cash' | 'card' | 'transfer' | 'credit' | 'mixed';
    cashAmount?: number;
    cardAmount?: number;
    transferAmount?: number;
    creditAmount?: number;
    creditMonths?: number;
    creditInterestRate?: number;
  };

  // Idempotency — prevents double-submit
  idempotencyKey?: string;
}

export async function createSale(input: CreateSaleInput) {
  return await db.transaction(async (tx) => {
    // ─── 1. Validate items and calculate totals ─────────────────────────
    let subtotal = 0;
    const itemSnapshots: NewSaleItem[] = [];

    for (const item of input.items) {
      // Get current price + cost (snapshot)
      let snapshot;
      if (item.phoneUnitId) {
        // Phone — get from phone_units
        const [phone] = await tx
          .select({
            name: products.name,
            sku: products.sku,
            costPrice: phoneUnits.costPrice,
            warrantyMonths: phoneUnits.warrantyMonths,
            imeiLastFour: phoneUnits.imeiLastFour,
          })
          .from(phoneUnits)
          .innerJoin(products, eq(phoneUnits.productId, products.id))
          .where(eq(phoneUnits.id, item.phoneUnitId));

        if (!phone) throw new Error(`Phone unit ${item.phoneUnitId} not found`);
        snapshot = phone;
      } else if (item.productId) {
        // Accessory or generic product
        const [product] = await tx
          .select()
          .from(products)
          .where(eq(products.id, item.productId));

        if (!product) throw new Error(`Product ${item.productId} not found`);
        snapshot = {
          name: product.name,
          sku: product.sku,
          costPrice: product.costPrice,
          warrantyMonths: product.warrantyMonths,
          imeiLastFour: null,
        };
      } else {
        throw new Error('Item must have productId or phoneUnitId');
      }

      const itemTotal =
        item.quantity * item.unitPrice - (item.discountAmount ?? 0);
      subtotal += itemTotal;

      itemSnapshots.push({
        tenantId: '', // set by RLS context, but we need to put smth
        saleId: '', // set after sale insert
        productId: item.productId,
        phoneUnitId: item.phoneUnitId,
        variantId: item.variantId,
        productName: snapshot.name,
        productSku: snapshot.sku,
        imeiLastFour: snapshot.imeiLastFour,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toString(),
        costPrice: snapshot.costPrice,
        discountAmount: (item.discountAmount ?? 0).toString(),
        total: itemTotal.toString(),
        warrantyMonths: snapshot.warrantyMonths,
        warrantyUntil: snapshot.warrantyMonths
          ? new Date(
              Date.now() + snapshot.warrantyMonths * 30 * 24 * 60 * 60 * 1000
            )
              .toISOString()
              .split('T')[0]
          : null,
      });
    }

    // ─── 2. Calculate totals ───────────────────────────────────────────
    const discountAmount = input.discountAmount ?? 0;
    const total = subtotal - discountAmount;

    const cashAmount = input.payment.cashAmount ?? 0;
    const cardAmount = input.payment.cardAmount ?? 0;
    const transferAmount = input.payment.transferAmount ?? 0;
    const creditAmount = input.payment.creditAmount ?? 0;

    const paidAmount = cashAmount + cardAmount + transferAmount;
    const debtAmount = creditAmount;

    if (paidAmount + debtAmount < total) {
      throw new Error(
        `Payment insufficient: ${paidAmount + debtAmount} < ${total}`
      );
    }

    const changeDue = paidAmount + debtAmount - total;

    // Validate credit terms
    if (creditAmount > 0) {
      if (!input.customerId) {
        throw new Error('Customer required for credit sale');
      }
      if (!input.payment.creditMonths || input.payment.creditMonths < 1) {
        throw new Error('Credit months required');
      }
    }

    // ─── 3. Insert sale ────────────────────────────────────────────────
    const [sale] = await tx
      .insert(sales)
      .values({
        tenantId: '', // RLS sets this
        branchId: input.branchId,
        cashierId: input.cashierId,
        shiftId: input.shiftId,
        customerId: input.customerId,
        idempotencyKey: input.idempotencyKey ?? randomUUID(),
        subtotal: subtotal.toString(),
        discountAmount: discountAmount.toString(),
        discountReason: input.discountReason,
        total: total.toString(),
        paymentMethod: input.payment.method,
        paidAmount: paidAmount.toString(),
        debtAmount: debtAmount.toString(),
        changeDue: changeDue.toString(),
        status: 'completed',
      })
      .returning();

    // ─── 4. Insert sale items (triggers update phone_units & stock) ────
    await tx.insert(saleItems).values(
      itemSnapshots.map((item) => ({
        ...item,
        saleId: sale.id,
        tenantId: sale.tenantId,
      }))
    );

    // ─── 5. Insert payment record(s) ───────────────────────────────────
    const paymentRecords = [];
    if (cashAmount > 0) {
      paymentRecords.push({
        tenantId: sale.tenantId,
        paymentType: 'sale' as const,
        saleId: sale.id,
        method: 'cash' as const,
        amount: cashAmount.toString(),
        receivedBy: input.cashierId,
        shiftId: input.shiftId,
        branchId: input.branchId,
      });
    }
    if (cardAmount > 0) {
      paymentRecords.push({
        tenantId: sale.tenantId,
        paymentType: 'sale' as const,
        saleId: sale.id,
        method: 'card' as const,
        amount: cardAmount.toString(),
        receivedBy: input.cashierId,
        shiftId: input.shiftId,
        branchId: input.branchId,
      });
    }
    if (transferAmount > 0) {
      paymentRecords.push({
        tenantId: sale.tenantId,
        paymentType: 'sale' as const,
        saleId: sale.id,
        method: 'transfer' as const,
        amount: transferAmount.toString(),
        receivedBy: input.cashierId,
        shiftId: input.shiftId,
        branchId: input.branchId,
      });
    }

    if (paymentRecords.length > 0) {
      await tx.insert(payments).values(paymentRecords);
    }

    // ─── 6. Create debt + schedule (if credit) ─────────────────────────
    if (creditAmount > 0 && input.payment.creditMonths) {
      const calc = calculateDebt(
        creditAmount,
        input.payment.creditInterestRate ?? 0,
        input.payment.creditMonths,
        new Date()
      );

      const [debt] = await tx
        .insert(debts)
        .values({
          tenantId: sale.tenantId,
          customerId: input.customerId!,
          saleId: sale.id,
          principalAmount: calc.principalAmount.toString(),
          interestRate: calc.interestRate.toString(),
          totalAmount: calc.totalAmount.toString(),
          totalInterest: calc.totalInterest.toString(),
          totalMonths: calc.totalMonths,
          monthlyPayment: calc.monthlyPayment.toString(),
          startDate: new Date().toISOString().split('T')[0],
          endDate: calc.schedule[calc.schedule.length - 1].dueDate
            .toISOString()
            .split('T')[0],
          remainingAmount: calc.totalAmount.toString(),
          nextPaymentDate: calc.schedule[0].dueDate.toISOString().split('T')[0],
          nextPaymentAmount: calc.monthlyPayment.toString(),
        })
        .returning();

      // Insert payment schedule
      await tx.insert(debtSchedules).values(
        calc.schedule.map((item) => ({
          tenantId: sale.tenantId,
          debtId: debt.id,
          installmentNumber: item.installmentNumber,
          dueDate: item.dueDate.toISOString().split('T')[0],
          expectedAmount: item.amount.toString(),
        }))
      );
    }

    return sale;
  });
}

// ════════════════════════════════════════════════════════════════════════════
// 5. OPEN SHIFT (kassir starts working)
// ════════════════════════════════════════════════════════════════════════════

export async function openShift(input: {
  cashierId: string;
  branchId: string;
  openingCash: number;
  ipAddress?: string;
}) {
  // Get next shift number for this tenant
  const [maxShift] = await db
    .select({ max: sql<number>`COALESCE(MAX(${shifts.shiftNumber}), 0)` })
    .from(shifts);

  const [shift] = await db
    .insert(shifts)
    .values({
      tenantId: '', // RLS
      cashierId: input.cashierId,
      branchId: input.branchId,
      shiftNumber: (maxShift?.max ?? 0) + 1,
      openingCash: input.openingCash.toString(),
      openedIp: input.ipAddress as any,
      status: 'open',
    })
    .returning();

  return shift;
}

// ════════════════════════════════════════════════════════════════════════════
// 6. CLOSE SHIFT (with cash count + difference detection)
// ════════════════════════════════════════════════════════════════════════════

export async function closeShift(input: {
  shiftId: string;
  closingCash: number;
  closingNotes?: string;
  ipAddress?: string;
}) {
  return await db.transaction(async (tx) => {
    // Get current shift
    const [shift] = await tx
      .select()
      .from(shifts)
      .where(eq(shifts.id, input.shiftId));

    if (!shift) throw new Error('Shift not found');
    if (shift.status !== 'open') throw new Error('Shift already closed');

    // Calculate expected cash: opening + cash sales - cash refunds
    const [cashStats] = await tx
      .select({
        cashSales: sql<string>`COALESCE(SUM(${payments.amount}), 0)`,
      })
      .from(payments)
      .where(
        and(
          eq(payments.shiftId, input.shiftId),
          eq(payments.method, 'cash'),
          eq(payments.paymentType, 'sale')
        )
      );

    const expectedCash =
      Number(shift.openingCash) + Number(cashStats?.cashSales ?? 0);
    const cashDifference = input.closingCash - expectedCash;

    // Update shift
    const [updated] = await tx
      .update(shifts)
      .set({
        closedAt: new Date(),
        expectedCash: expectedCash.toString(),
        closingCash: input.closingCash.toString(),
        cashDifference: cashDifference.toString(),
        closingNotes: input.closingNotes,
        closedIp: input.ipAddress as any,
        status: 'closed',
      })
      .where(eq(shifts.id, input.shiftId))
      .returning();

    // If significant difference, this should trigger Telegram alert
    // (handled by notification service watching audit_logs)

    return updated;
  });
}

// ════════════════════════════════════════════════════════════════════════════
// 7. RECORD DEBT PAYMENT
// ════════════════════════════════════════════════════════════════════════════

export async function recordDebtPayment(input: {
  debtId: string;
  amount: number;
  method: 'cash' | 'card' | 'transfer';
  receivedBy: string;
  shiftId?: string;
  branchId?: string;
  notes?: string;
}) {
  return await db.transaction(async (tx) => {
    const [debt] = await tx
      .select()
      .from(debts)
      .where(eq(debts.id, input.debtId));

    if (!debt) throw new Error('Debt not found');
    if (debt.status === 'paid') throw new Error('Debt already paid');

    if (input.amount > Number(debt.remainingAmount)) {
      throw new Error(
        `Amount ${input.amount} exceeds remaining ${debt.remainingAmount}`
      );
    }

    // Insert payment (trigger updates debt + customer)
    const [payment] = await tx
      .insert(payments)
      .values({
        tenantId: debt.tenantId,
        paymentType: 'debt_payment',
        debtId: input.debtId,
        method: input.method,
        amount: input.amount.toString(),
        receivedBy: input.receivedBy,
        shiftId: input.shiftId,
        branchId: input.branchId,
        notes: input.notes,
      })
      .returning();

    return payment;
  });
}

// ════════════════════════════════════════════════════════════════════════════
// 8. DASHBOARD: today's KPIs
// ════════════════════════════════════════════════════════════════════════════

export async function getDashboardKpis() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Today's stats
  const [todayStats] = await db
    .select({
      revenue: sql<string>`COALESCE(SUM(${sales.total}), 0)`,
      count: sql<number>`COUNT(*)`,
      profit: sql<string>`COALESCE(SUM(
        (SELECT SUM((si.unit_price::numeric - si.cost_price::numeric) * si.quantity)
         FROM ${saleItems} si WHERE si.sale_id = ${sales.id})
      ), 0)`,
    })
    .from(sales)
    .where(
      and(
        gte(sales.createdAt, today),
        eq(sales.status, 'completed')
      )
    );

  // Yesterday's revenue (for comparison)
  const [yesterdayStats] = await db
    .select({
      revenue: sql<string>`COALESCE(SUM(${sales.total}), 0)`,
    })
    .from(sales)
    .where(
      and(
        gte(sales.createdAt, yesterday),
        lte(sales.createdAt, today),
        eq(sales.status, 'completed')
      )
    );

  // Active debts
  const [debtStats] = await db
    .select({
      total: sql<string>`COALESCE(SUM(${debts.remainingAmount}), 0)`,
      overdueCount: sql<number>`COUNT(*) FILTER (WHERE ${debts.isOverdue})`,
    })
    .from(debts)
    .where(eq(debts.status, 'active'));

  return {
    today: {
      revenue: Number(todayStats?.revenue ?? 0),
      count: Number(todayStats?.count ?? 0),
      profit: Number(todayStats?.profit ?? 0),
      avgTicket:
        Number(todayStats?.count ?? 0) > 0
          ? Number(todayStats?.revenue ?? 0) / Number(todayStats!.count)
          : 0,
    },
    yesterday: {
      revenue: Number(yesterdayStats?.revenue ?? 0),
    },
    debts: {
      totalAmount: Number(debtStats?.total ?? 0),
      overdueCount: Number(debtStats?.overdueCount ?? 0),
    },
  };
}

// ════════════════════════════════════════════════════════════════════════════
// 9. EXAMPLE: Use in Next.js API route
// ════════════════════════════════════════════════════════════════════════════

/*
// app/api/sales/route.ts
import { withTenant } from '@/db/lib/db';
import { createSale } from '@/db/queries';

export async function POST(req: Request) {
  const session = await getServerSession(req); // Better Auth
  const body = await req.json();

  const ctx = {
    tenantId: session.tenantId,
    userId: session.userId,
    userRole: session.role,
    clientIp: req.headers.get('x-forwarded-for') ?? undefined,
  };

  return await withTenant(ctx, async () => {
    try {
      const sale = await createSale(body);
      return Response.json(sale);
    } catch (error) {
      return Response.json(
        { error: error instanceof Error ? error.message : 'Unknown error' },
        { status: 400 }
      );
    }
  });
}
*/
