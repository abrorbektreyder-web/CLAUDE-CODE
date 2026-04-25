import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const TABLE_MAP: Record<string, string> = { user: 'users' };
const SNAKE_TO_CAMEL: Record<string, Record<string, string>> = {
  users: {
    full_name: 'name',
    password_hash: 'password',
  }
};
function toCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}
function objToCamel(obj: Record<string, unknown>, table: string): Record<string, unknown> {
  const specialMap = SNAKE_TO_CAMEL[table] ?? {};
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    const camelKey = specialMap[k] ?? toCamel(k);
    result[camelKey] = v;
  }
  return result;
}

async function testFindOne() {
  const { data, error } = await supabase.from('users').select('*').eq('email', 'admin@mobicenter.uz').maybeSingle();
  console.log('Raw data:', data);
  if (data) {
    console.log('Camel mapped:', objToCamel(data, 'users'));
  }
}

testFindOne();
