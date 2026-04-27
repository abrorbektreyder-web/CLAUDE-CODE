const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env' });

async function setCashierPin() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const pin = '112233';
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(pin, salt);

  const { data: user, error: findError } = await supabase
    .from('users')
    .select('id, phone')
    .eq('email', 'admin@mobicenter.uz')
    .single();

  if (findError || !user) {
    console.error('User not found:', findError);
    return;
  }

  const { error } = await supabase
    .from('users')
    .update({ pin_hash: hash })
    .eq('id', user.id);

  if (error) {
    console.error('Update failed:', error);
  } else {
    console.log(`Successfully set PIN 112233 for user with phone: ${user.phone}`);
    console.log('You can now login at /cashier-login using this phone and PIN 112233');
  }
}

setCashierPin();
