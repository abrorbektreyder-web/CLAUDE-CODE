import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function checkUser() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from('users')
    .select('id, email, full_name, role')
    .eq('email', 'admin@mobicenter.uz');

  console.log('User data:', data);
  if (error) console.error('Error:', error);
}

checkUser();
