// Vercel force redeploy - 2026-05-08
import { betterAuth } from 'better-auth';
import { supabaseAdapter } from './auth-adapter';

// ════════════════════════════════════════════════════════════════════════════
// BETTER AUTH CONFIG
// ════════════════════════════════════════════════════════════════════════════
// Uses a custom Supabase HTTP adapter instead of direct PostgreSQL connection.
// This bypasses ISP firewall blocks on port 5432/6543 in development.
// In production (Vercel), both approaches work — HTTPS is always available.
// ════════════════════════════════════════════════════════════════════════════

// ─── Collect ALL Vercel deployment URLs ──────────────────────────────────
// Vercel generates a unique URL for each deployment. We must trust them all.
const vercelUrls: string[] = [];
if (process.env.VERCEL_URL) 
  vercelUrls.push(`https://${process.env.VERCEL_URL}`);
if (process.env.VERCEL_BRANCH_URL) 
  vercelUrls.push(`https://${process.env.VERCEL_BRANCH_URL}`);
if (process.env.VERCEL_PROJECT_PRODUCTION_URL) 
  vercelUrls.push(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`);

// ─── Determine the correct baseURL ──────────────────────────────────────
// Priority:
// 1. BETTER_AUTH_URL (manual override)
// 2. NEXT_PUBLIC_APP_URL (standard public URL)
// 3. VERCEL_PROJECT_PRODUCTION_URL (stable production URL)
// 4. VERCEL_URL (current deployment URL)
// 5. localhost (fallback)
const resolvedBaseURL = 
  process.env.BETTER_AUTH_URL || 
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
  process.env.NEXT_PUBLIC_APP_URL || 
  'http://localhost:3000';

console.log('[Auth] Detected Host:', process.env.VERCEL_URL);
console.log('[Auth] Resolved baseURL:', resolvedBaseURL);

export const auth = betterAuth({
  // Custom Supabase HTTP adapter (works over port 443, never blocked)
  database: () => ({
    id: 'supabase',
    ...supabaseAdapter,
  }),

  // Secret for signing tokens
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: resolvedBaseURL,

  // Custom User Fields
  user: {
    additionalFields: {
      tenantId: {
        type: 'string',
        returned: true,
      },
      role: {
        type: 'string',
        returned: true,
      },
      branchId: {
        type: 'string',
        returned: true,
      },
      phone: {
        type: 'string',
        returned: true,
        input: true,
        required: false,
      },
      storeName: {
        type: 'string',
        required: false,
        input: true,
      }
    }
  },

  // Email + password auth (for admins)
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    requireEmailVerification: false,

    // Custom password hashing (bcryptjs — pure JS, works on Vercel serverless)
    password: {
      hash: async (password: string) => {
        const bcrypt = await import('bcryptjs');
        return bcrypt.hash(password, 12);
      },
      verify: async ({ hash, password }: { hash: string; password: string }) => {
        const bcrypt = await import('bcryptjs');
        try {
          return await bcrypt.compare(password, hash);
        } catch {
          return false;
        }
      },
    },
  },

  // Session config
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24,      // refresh every 24h
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },

  // Rate limiting
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
  },

  // Trusted origins — includes ALL subdomains of localhost in dev and Vercel in prod
  trustedOrigins: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://mobicenter.localhost:3000',
    process.env.NEXT_PUBLIC_APP_URL || '',
    process.env.BETTER_AUTH_URL || '',
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '',
    process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '',
    process.env.VERCEL_BRANCH_URL ? `https://${process.env.VERCEL_BRANCH_URL}` : '',
    'https://claude-code-six-chi.vercel.app',
  ].filter(Boolean) as string[],

  // Advanced security
  advanced: {
    useSecureCookies: process.env.NODE_ENV === 'production',
    // Allow cookies to be shared across subdomains in production
    // For localhost, browsers generally don't allow sharing cookies across subdomains 
    // (e.g. from localhost to tenant.localhost) unless the domain is NOT set.
  },
});

// Type-safe session helper for Server Components
export type Session = typeof auth.$Infer.Session;

