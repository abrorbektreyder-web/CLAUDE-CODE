import { createClient } from '@supabase/supabase-js';

// ════════════════════════════════════════════════════════════════════════════
// SUPABASE CLIENT — No singleton, create fresh per call.
// Singletons can cause issues in Vercel serverless (module state not shared
// across invocations). Creating a new client is lightweight and safe.
// ════════════════════════════════════════════════════════════════════════════

export function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    // Log the exact issue for Vercel Function Logs
    console.error('[getSupabase] Missing env vars:', {
      hasUrl: !!url,
      hasKey: !!key,
      NODE_ENV: process.env.NODE_ENV,
    });
    throw new Error(
      `Supabase env vars missing. URL: ${!!url}, KEY: ${!!key}`
    );
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    db: { schema: 'public' },
  });
}
