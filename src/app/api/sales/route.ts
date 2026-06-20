import { z } from 'zod';
import { createApiRoute } from '@/lib/api-helpers';
import { createSale, getDashboardKpis } from '@/db/queries';
import { getSupabase } from '@/db/lib/supabase';

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
    const supabase = getSupabase();
    
    // 1. Fetch real product names and cost prices from DB
    const productIds = body.items.map(i => i.productId).filter(Boolean) as string[];
    const productsMap: Record<string, { name: string; cost_price: number }> = {};
    
    if (productIds.length > 0) {
      const { data: products } = await supabase
        .from('products')
        .select('id, name, cost_price')
        .in('id', productIds)
        .eq('tenant_id', ctx.tenantId);
        
      if (products) {
        products.forEach(p => {
          productsMap[p.id] = { name: p.name, cost_price: Number(p.cost_price || 0) };
        });
      }
    }

    // 2. Map API body to createSale expected structure
    const sale = await createSale({
      tenantId: ctx.tenantId,
      branchId: body.branchId,
      cashierId: body.cashierId,
      customerId: body.customerId,
      subtotal: body.items.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0) - (body.discountAmount || 0),
      total: body.items.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0) - (body.discountAmount || 0),
      paymentMethod: body.payment.method,
      paidAmount: body.payment.method === 'cash' ? (body.payment.cashAmount || 0) : 
                  body.payment.method === 'card' ? (body.payment.cardAmount || 0) :
                  body.payment.method === 'transfer' ? (body.payment.transferAmount || 0) : 0,
      debtAmount: body.payment.method === 'credit' ? (body.payment.creditAmount || 0) : 0,
      debtMonths: body.payment.creditMonths,
      items: body.items.map(item => {
        const prod = item.productId ? productsMap[item.productId] : null;
        return {
          productId: item.productId,
          productName: prod ? prod.name : 'Noma\'lum mahsulot',
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          costPrice: prod ? prod.cost_price : (item.unitPrice * 0.7), // Fallback if no real cost
          total: item.unitPrice * item.quantity
        };
      })
    });
    return { sale };
  },
});
