import { createApiRoute } from '@/lib/api-helpers';
import { getSupabase } from '@/db/lib/supabase';
import { z } from 'zod';

export const GET = createApiRoute({
  roles: ['tenant_owner', 'admin'],
  handler: async ({ ctx }) => {
    const supabase = getSupabase();
    
    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('business_name, currency')
      .eq('id', ctx.tenantId)
      .single();
      
    if (error) {
      throw error;
    }

    return { settings: tenant };
  },
});

const updateSettingsSchema = z.object({
  businessName: z.string().min(1, 'Do\'kon nomi talab qilinadi'),
  currency: z.string().length(3)
});

export const PUT = createApiRoute({
  schema: updateSettingsSchema,
  roles: ['tenant_owner', 'admin'],
  handler: async ({ body, ctx }) => {
    const supabase = getSupabase();
    
    const { data: tenant, error } = await supabase
      .from('tenants')
      .update({
        business_name: body.businessName,
        currency: body.currency,
        updated_at: new Date().toISOString()
      })
      .eq('id', ctx.tenantId)
      .select('business_name, currency')
      .single();
      
    if (error) {
      throw error;
    }

    return { success: true, settings: tenant };
  },
});
