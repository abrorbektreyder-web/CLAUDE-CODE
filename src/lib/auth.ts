import { betterAuth } from 'better-auth';
import { supabaseAdapter } from './auth-adapter';

// ════════════════════════════════════════════════════════════════════════════
// BETTER AUTH CONFIG
// ════════════════════════════════════════════════════════════════════════════
// Uses a custom Supabase HTTP adapter instead of direct PostgreSQL connection.
// This bypasses ISP firewall blocks on port 5432/6543 in development.
// In production (Vercel), both approaches work — HTTPS is always available.
// ════════════════════════════════════════════════════════════════════════════

export const auth = betterAuth({
  // Custom Supabase HTTP adapter (works over port 443, never blocked)
  database: () => ({
    id: 'supabase',
    ...supabaseAdapter,
  }),

  // Secret for signing tokens
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001',

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
        input: true,        // ← REQUIRED: lets Better Auth pass this field to adapter
        required: false,
      },
      storeName: {
        type: 'string',
        required: false,
        input: true,        // ← REQUIRED: lets Better Auth pass this field to adapter
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

  // Trusted origins
  trustedOrigins: [
    'http://localhost:3000',
    'http://localhost:3001',
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'https://claude-code-six-chi.vercel.app',
  ],

  // Advanced security
  advanced: {
    useSecureCookies: process.env.NODE_ENV === 'production',
  },
});

// Type-safe session helper for Server Components
export type Session = typeof auth.$Infer.Session;
