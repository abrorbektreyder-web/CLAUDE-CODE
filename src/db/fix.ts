import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function fix() {
  console.log('Fixing account_id in accounts table...');
  const { error } = await supabase
    .from('accounts')
    .update({ account_id: 'admin@mobicenter.uz' })
    .eq('provider_id', 'credential');
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Successfully updated account_id to email!');
  }
}

fix();
