import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL or Service Role Key missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixPassword() {
  const email = 'admin@mobicenter.uz';
  const password = 'Admin1234!';
  
  console.log(`Updating password for ${email} to: ${password}`);
  
  const hash = await bcrypt.hash(password, 12);

  // 1. Update users table
  const { error: userError } = await supabase
    .from('users')
    .update({ password_hash: hash })
    .eq('email', email);

  if (userError) {
    console.error('Error updating users table:', userError);
  } else {
    console.log('✓ Updated users table');
  }

  // 2. Update accounts table (Better Auth uses this for login)
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single();

  if (user) {
    const { error: accountError } = await supabase
      .from('accounts')
      .update({ password: hash })
      .eq('user_id', user.id);

    if (accountError) {
      console.error('Error updating accounts table:', accountError);
    } else {
      console.log('✓ Updated accounts table');
    }
  }

  console.log('\nDone! Login credentials:');
  console.log('Email:', email);
  console.log('Password:', password);
}

fixPassword();
