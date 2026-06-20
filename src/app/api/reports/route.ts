import { createApiRoute } from '@/lib/api-helpers';
import { getSupabase } from '@/db/lib/supabase';

export const GET = createApiRoute({
  roles: ['tenant_owner', 'admin', 'manager'],
  handler: async ({ ctx }) => {
    const supabase = getSupabase();
    
    // Fetch sales
    const { data: sales } = await supabase
      .from('sales')
      .select('total')
      .eq('tenant_id', ctx.tenantId)
      .eq('status', 'completed');
      
    // Fetch sale items to calculate profit (total - cost)
    const { data: items } = await supabase
      .from('sale_items')
      .select('total, cost_price, quantity')
      .eq('tenant_id', ctx.tenantId);
      
    // Fetch customers
    const { count: customersCount } = await supabase
      .from('customers')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', ctx.tenantId);

    const revenue = (sales || []).reduce((acc, s) => acc + Number(s.total || 0), 0);
    const profit = (items || []).reduce((acc, item) => acc + (Number(item.total || 0) - (Number(item.cost_price || 0) * Number(item.quantity || 0))), 0);
    const itemsSold = (items || []).reduce((acc, item) => acc + Number(item.quantity || 0), 0);

    return { 
      stats: {
        totalRevenue: revenue,
        totalProfit: Math.max(0, profit),
        totalItemsSold: itemsSold,
        newCustomers: customersCount || 0
      }
    };
  },
});
