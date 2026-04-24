import { createClient } from '@supabase/supabase-js';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

async function resetPassword() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const password = '12345678';
  const hash = await bcrypt.hash(password, 10);

  const { error } = await supabase
    .from('users')
    .update({ password_hash: hash })
    .eq('email', 'admin@mobicenter.uz');

  if (error) {
    console.error('Update failed:', error);
  } else {
    console.log('Password reset successfully to 12345678 (using bcrypt)');
  }
}

resetPassword();
