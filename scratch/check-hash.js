
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const { data: accounts, error: accountError } = await supabase
    .from('accounts')
    .select('password')
    .eq('provider_id', 'credential');
    
  if (accountError) console.error(accountError);
  else {
    console.log('Password hash in DB:', accounts[0].password);
  }
}

main();
