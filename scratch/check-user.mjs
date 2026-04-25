
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkUser() {
  const email = 'admin@mobicenter.uz';
  
  console.log(`Checking user with email: ${email}`);
  
  const { data: users, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('email', email);
    
  if (userError) {
    console.error('Error fetching users:', userError);
    return;
  }
  
  if (users.length === 0) {
    console.log('User not found in "users" table.');
  } else {
    console.log('User found:', JSON.stringify(users[0], null, 2));
    
    const { data: accounts, error: accountError } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', users[0].id);
      
    if (accountError) {
      console.error('Error fetching accounts:', accountError);
    } else if (accounts.length === 0) {
      console.log('No account found for this user in "accounts" table.');
    } else {
      console.log('Account found:', JSON.stringify(accounts[0], null, 2));
    }
  }
}

checkUser();
