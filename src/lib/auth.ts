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
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',

  // Email + password auth (for admins)
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    requireEmailVerification: false,

    // Custom password hashing (Argon2id — matches our DB schema)
    password: {
      hash: async (password: string) => {
        const argon2 = await import('argon2');
        return argon2.hash(password, {
          type: argon2.argon2id,
          memoryCost: 65536,
          timeCost: 3,
          parallelism: 4,
        });
      },
      verify: async ({ hash, password }) => {
        const argon2 = await import('argon2');
        try {
          return await argon2.verify(hash, password);
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
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    ...(process.env.NODE_ENV === 'production'
      ? [`https://*.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`]
      : ['http://localhost:3000']),
  ],

  // Advanced security
  advanced: {
    useSecureCookies: process.env.NODE_ENV === 'production',
    cookiePrefix: 'pos',
    crossSubDomainCookies: {
      enabled: process.env.NODE_ENV === 'production',
      domain:
        process.env.NODE_ENV === 'production'
          ? `.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`
          : undefined,
    },
  },
});

// Type-safe session helper for Server Components
export type Session = typeof auth.$Infer.Session;
