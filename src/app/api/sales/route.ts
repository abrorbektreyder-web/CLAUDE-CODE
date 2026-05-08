import { z } from 'zod';
import { createApiRoute } from '@/lib/api-helpers';
import { createSale, getDashboardKpis } from '@/db/queries';

// ════════════════════════════════════════════════════════════════════════════
// GET /api/sales — Returns dashboard KPIs (today's stats)
// ════════════════════════════════════════════════════════════════════════════

export const GET = createApiRoute({
  roles: ['tenant_owner', 'admin', 'manager'],
  handler: async ({ ctx }) => {
    const kpis = await getDashboardKpis(ctx.tenantId);
    return { kpis };
  },
});

// ════════════════════════════════════════════════════════════════════════════
// POST /api/sales — Create a new sale
// ════════════════════════════════════════════════════════════════════════════

const createSaleSchema = z.object({
  branchId: z.string().uuid(),
  cashierId: z.string().uuid(),
  shiftId: z.string().uuid(),
  customerId: z.string().uuid().optional(),

  items: z
    .array(
      z.object({
        productId: z.string().uuid().optional(),
        phoneUnitId: z.string().uuid().optional(),
        variantId: z.string().uuid().optional(),
        quantity: z.number().int().positive(),
        unitPrice: z.number().positive(),
        discountAmount: z.number().nonnegative().optional(),
      })
    )
    .min(1, 'Kamida bitta mahsulot kerak'),

  discountAmount: z.number().nonnegative().optional(),
  discountReason: z.string().optional(),

  payment: z.object({
    method: z.enum(['cash', 'card', 'transfer', 'credit', 'mixed']),
    cashAmount: z.number().nonnegative().optional(),
    cardAmount: z.number().nonnegative().optional(),
    transferAmount: z.number().nonnegative().optional(),
    creditAmount: z.number().nonnegative().optional(),
    creditMonths: z.number().int().min(1).max(24).optional(),
    creditInterestRate: z.number().min(0).max(50).optional(),
  }),

  idempotencyKey: z.string().uuid().optional(),
});

export const POST = createApiRoute({
  schema: createSaleSchema,
  roles: ['cashier', 'tenant_owner', 'admin'],
  handler: async ({ body, ctx }) => {
    // Calculate totals
    const subtotal = body.items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
    const total = subtotal - (body.discountAmount || 0);
    const paidAmount = (body.payment.cashAmount || 0) + (body.payment.cardAmount || 0) + (body.payment.transferAmount || 0);
    const debtAmount = body.payment.creditAmount || (body.payment.method === 'credit' ? total - paidAmount : 0);

    const sale = await createSale({
      tenantId: ctx.tenantId,
      branchId: body.branchId,
      cashierId: body.cashierId,
      customerId: body.customerId,
      subtotal,
      total,
      paymentMethod: body.payment.method,
      paidAmount,
      debtAmount,
      debtMonths: body.payment.creditMonths,
      items: body.items.map(item => ({
        productId: item.productId,
        productName: 'Mahsulot', // Default or fetch from DB if needed
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        costPrice: item.unitPrice * 0.8, // Estimate cost price if not provided
        total: item.unitPrice * item.quantity
      }))
    });
    return { sale };
  },
});
