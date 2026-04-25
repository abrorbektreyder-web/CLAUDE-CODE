import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  // Check user
  const { data: user } = await supabase.from('users').select('id, email, password_hash').eq('email', 'admin@mobicenter.uz').single();
  console.log('USER:', user);

  // Check accounts table
  const { data: accounts, error: accErr } = await supabase.from('accounts').select('*').eq('user_id', user?.id);
  console.log('ACCOUNTS:', accounts, 'ERR:', accErr);
}

main();
