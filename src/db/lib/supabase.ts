import { createClient } from '@supabase/supabase-js';

let supabaseInstance: any = null;

export function getSupabase() {
  if (supabaseInstance) return supabaseInstance;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Supabase environment variables are missing (URL or Service Role Key)');
  }

  supabaseInstance = createClient(url, key, {
    auth: { 
      persistSession: false,
      autoRefreshToken: false,
    },
    db: { schema: 'public' },
  });

  return supabaseInstance;
}
