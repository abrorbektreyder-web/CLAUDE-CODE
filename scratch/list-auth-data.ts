
import { createClient } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  console.log('--- USERS ---');
  const { data: users, error: userError } = await supabase.from('users').select('*');
  if (userError) console.error('User Error:', userError);
  else console.table(users.map(u => ({ id: u.id, email: u.email, full_name: u.full_name, role: u.role })));

  console.log('--- ACCOUNTS ---');
  const { data: accounts, error: accountError } = await supabase.from('accounts').select('*');
  if (accountError) console.error('Account Error:', accountError);
  else console.table(accounts.map(a => ({ id: a.id, userId: a.user_id, providerId: a.provider_id, password: a.password ? '[SET]' : '[NULL]' })));
}

main();
