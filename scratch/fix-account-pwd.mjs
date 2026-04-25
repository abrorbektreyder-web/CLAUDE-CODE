import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function updateAccountPassword() {
  const hash = await bcrypt.hash('Admin1234!', 12);
  console.log('New bcrypt hash:', hash);

  const { data, error } = await supabase
    .from('accounts')
    .update({ password: hash })
    .eq('account_id', 'admin@mobicenter.uz')
    .eq('provider_id', 'credential');

  console.log('Update result:', data, 'Error:', error);

  // Verify
  const { data: account } = await supabase
    .from('accounts')
    .select('password')
    .eq('account_id', 'admin@mobicenter.uz')
    .single();
  
  const ok = await bcrypt.compare('Admin1234!', account.password);
  console.log('Verification ok?', ok);
}

updateAccountPassword();
