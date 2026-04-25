import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function updateAdminPassword() {
  const hash = await bcrypt.hash('Admin1234!', 12);
  const { data, error } = await supabase.from('users').update({ password_hash: hash }).eq('email', 'admin@mobicenter.uz');
  console.log('Update result:', data, error);
  
  // Verify it
  const { data: user } = await supabase.from('users').select('password_hash').eq('email', 'admin@mobicenter.uz').single();
  const ok = await bcrypt.compare('Admin1234!', user.password_hash);
  console.log('Verification ok?', ok);
}

updateAdminPassword();
