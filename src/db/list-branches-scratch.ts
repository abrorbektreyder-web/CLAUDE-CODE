import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('URL:', url);
console.log('Key:', key ? 'Present' : 'Missing');

if (!url || !key) {
  process.exit(1);
}

const supabase = createClient(url, key);

async function listAll() {
  console.log('--- Branches ---');
  const { data: b, error: be } = await supabase.from('branches').select('id, name');
  console.log(JSON.stringify(b || be, null, 2));

  console.log('--- Users ---');
  const { data: u, error: ue } = await supabase.from('users').select('id, email, branch_id, tenant_id');
  console.log(JSON.stringify(u || ue, null, 2));
}

listAll();
