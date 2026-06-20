import { createApiRoute } from '@/lib/api-helpers';
import { getSupabase } from '@/db/lib/supabase';
import { format } from 'date-fns';

export const GET = createApiRoute({
  roles: ['tenant_owner', 'admin'],
  handler: async ({ ctx }) => {
    const supabase = getSupabase();
    
    // Fetch latest sales as "logs" for now (since we don't have a dedicated audit_logs table yet)
    const { data: sales } = await supabase
      .from('sales')
      .select('id, created_at, total, receipt_number, cashier_id')
      .eq('tenant_id', ctx.tenantId)
      .order('created_at', { ascending: false })
      .limit(20);
      
    const logs = (sales || []).map(sale => ({
      id: sale.id,
      action: `Sotuv qo'shildi: ${sale.receipt_number || 'N/A'} - ${sale.total} UZS`,
      user: sale.cashier_id ? `Kassir` : 'Noma\'lum',
      ip: 'Tizim',
      time: format(new Date(sale.created_at), 'HH:mm - dd.MM.yyyy'),
      type: 'create'
    }));

    return { logs };
  },
});
