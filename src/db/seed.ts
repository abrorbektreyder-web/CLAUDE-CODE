import { createClient } from '@supabase/supabase-js';
import * as argon2 from 'argon2';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL or Key is missing');
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log('Seeding database using Supabase HTTP API (bypassing port 5432 block)...');
  
  try {
    // 1. Create a Tenant
    const tenantId = crypto.randomUUID();
    const { error: tenantError } = await supabase.from('tenants').insert({
      id: tenantId,
      subdomain: 'demo',
      business_name: 'Mobicenter Demo',
      owner_email: 'admin@mobicenter.uz',
      plan: 'pro',
      settings: {},
    });

    if (tenantError && tenantError.code !== '23505') { // 23505 is unique violation
      throw new Error(`Tenant Error: ${tenantError.message}`);
    }
    console.log('Created Tenant: Mobicenter Demo');

    // 1.5 Create a Main Branch
    const branchId = crypto.randomUUID();
    const { error: branchError } = await supabase.from('branches').insert({
      id: branchId,
      tenant_id: tenantId,
      name: 'Asosiy filial (Chilonzor)',
      is_main: true,
      is_active: true,
    });
    
    if (branchError && branchError.code !== '23505') {
      console.warn(`Branch Warning: ${branchError.message}`);
    } else {
      console.log('Created Branch: Asosiy filial');
    }

    // 2. Create an Admin User
    const adminPasswordHash = await argon2.hash('12345678');
    const adminId = crypto.randomUUID();
    const { error: userError } = await supabase.from('users').insert({
      id: adminId,
      tenant_id: tenantId,
      email: 'admin@mobicenter.uz',
      phone: '+998901234567',
      full_name: 'Super Admin',
      password_hash: adminPasswordHash,
      role: 'tenant_owner',
      is_active: true,
      email_verified: true,
    });

    if (userError && userError.code !== '23505') {
      throw new Error(`User Error: ${userError.message}`);
    }
    console.log('Created Admin User: admin@mobicenter.uz / 12345678');

    // 3. Create Better Auth account
    const { error: accountError } = await supabase.from('accounts').insert({
      id: crypto.randomUUID(),
      account_id: adminId,
      provider_id: 'credential',
      user_id: adminId,
      password: adminPasswordHash,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (accountError && accountError.code !== '23505') {
      throw new Error(`Account Error: ${accountError.message}`);
    }
    console.log('Created Better Auth account for admin');

    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    process.exit(0);
  }
}

seed();
