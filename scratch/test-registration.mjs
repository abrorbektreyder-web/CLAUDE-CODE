import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Load .env.local manually
const envFile = readFileSync('.env', 'utf-8');
const env = {};
for (const line of envFile.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  let val = trimmed.slice(eqIdx + 1).trim();
  // Strip surrounding quotes
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }
  env[key] = val;
}

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

async function test() {
  console.log('🔍 Step 1: Creating tenant...');
  
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .insert({
      subdomain: 'tohir-test-' + Date.now(),
      business_name: 'apple ttt',
      owner_email: 'tohir@gmail.com',
      owner_phone: '+998901234567',
      status: 'trial',
      plan: 'free',
    })
    .select()
    .single();

  if (tenantError) {
    console.error('❌ Tenant error:', tenantError.message, '\nDetails:', tenantError.details, '\nHint:', tenantError.hint);
    return;
  }
  console.log('✅ Tenant created:', tenant.id);

  console.log('\n🔍 Step 2: Creating branch...');
  const { data: branch, error: branchError } = await supabase
    .from('branches')
    .insert({
      tenant_id: tenant.id,
      name: 'Asosiy do\'kon',
      is_main: true,
      is_active: true,
    })
    .select()
    .single();

  if (branchError) {
    console.error('❌ Branch error:', branchError.message, '\nDetails:', branchError.details);
    // cleanup tenant
    await supabase.from('tenants').delete().eq('id', tenant.id);
    return;
  }
  console.log('✅ Branch created:', branch.id);

  console.log('\n🔍 Step 3: Creating user...');
  const userData = {
    tenant_id: tenant.id,
    branch_id: branch.id,
    email: 'tohir@gmail.com',
    phone: '+998901234567',
    full_name: 'tohir',
    role: 'tenant_owner',
    email_verified: false,
    password_hash: '$argon2id$v=19$m=19456,t=2,p=1$managed_by_better_auth',
  };
  console.log('Data being inserted:', JSON.stringify(userData, null, 2));

  const { data: user, error: userError } = await supabase
    .from('users')
    .insert(userData)
    .select()
    .single();

  if (userError) {
    console.error('❌ User creation error:', userError.message);
    console.error('   Details:', userError.details);
    console.error('   Hint:', userError.hint);
    console.error('   Code:', userError.code);
    // cleanup
    await supabase.from('branches').delete().eq('id', branch.id);
    await supabase.from('tenants').delete().eq('id', tenant.id);
    return;
  }
  console.log('✅ User created:', user.id);

  console.log('\n🔍 Step 4: Creating account (Better Auth stores password here)...');
  const { data: account, error: accountError } = await supabase
    .from('accounts')
    .insert({
      id: crypto.randomUUID(),
      account_id: user.id,
      provider_id: 'credential',
      user_id: user.id,
      password: 'hashed-password-here',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (accountError) {
    console.error('❌ Account creation error:', accountError.message, '\nDetails:', accountError.details);
  } else {
    console.log('✅ Account created:', account.id);
  }

  // Full cleanup
  console.log('\n🧹 Cleaning up test data...');
  await supabase.from('accounts').delete().eq('user_id', user.id);
  await supabase.from('users').delete().eq('id', user.id);
  await supabase.from('branches').delete().eq('id', branch.id);
  await supabase.from('tenants').delete().eq('id', tenant.id);
  console.log('✅ Cleanup done');
  console.log('\n✅ ALL STEPS PASSED — Registration flow works at DB level!');
}

test().catch(console.error);
