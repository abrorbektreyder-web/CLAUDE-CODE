import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const SNAKE_TO_CAMEL = {
  users: {
    full_name: 'name',
    password_hash: 'password',
  }
};
function toCamel(str) {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}
function objToCamel(obj, table) {
  const specialMap = SNAKE_TO_CAMEL[table] ?? {};
  const result = {};
  for (const [k, v] of Object.entries(obj)) {
    const camelKey = specialMap[k] ?? toCamel(k);
    result[camelKey] = v;
  }
  return result;
}

async function testFindOne() {
  const { data, error } = await supabase.from('users').select('*').eq('email', 'admin@mobicenter.uz').maybeSingle();
  console.log('Raw data password hash:', data?.password_hash);
  if (data) {
    console.log('Camel mapped password:', objToCamel(data, 'users').password);
  }
}

testFindOne();
