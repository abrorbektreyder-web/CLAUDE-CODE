import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@/db/lib/db';
import * as schema from '@/db/schema';

// ════════════════════════════════════════════════════════════════════════════
// BETTER AUTH CONFIG
// ════════════════════════════════════════════════════════════════════════════
//
// Note: This skeleton uses Better Auth's STANDARD tables alongside your
// custom users table. To use the custom users table directly, you'll need
// to run `npx @better-auth/cli generate` and merge the schemas.
//
// For now: Better Auth manages auth-specific concerns (sessions, accounts,
// verifications). Application-specific user data lives in the custom
// `users` table from your Drizzle schema.
// ════════════════════════════════════════════════════════════════════════════

export const auth = betterAuth({
  // Use Drizzle ORM adapter
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema, // Pass your Drizzle schema
  }),

  // Secret for signing tokens
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',

  // Email + password auth (for admins)
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    requireEmailVerification: false, // Disable for MVP; enable in production

    // Custom password validation
    password: {
      // Argon2id is the default in Better Auth — production-grade
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
        return argon2.verify(hash, password);
      },
    },
  },

  // Session config
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update session every 24h if active
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // Cache for 5 minutes
    },
  },

  // Rate limiting
  rateLimit: {
    enabled: true,
    window: 60, // 60 seconds
    max: 100, // 100 requests per window
  },

  // Trusted origins for CORS
  trustedOrigins: [
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    // Allow all subdomains in production
    ...(process.env.NODE_ENV === 'production'
      ? [`https://*.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`]
      : ['http://*.localhost:3000']),
  ],

  // Advanced security
  advanced: {
    // Use database for session storage (more secure than JWT)
    useSecureCookies: process.env.NODE_ENV === 'production',
    cookiePrefix: 'pos',

    // CSRF protection
    crossSubDomainCookies: {
      enabled: true,
      domain:
        process.env.NODE_ENV === 'production'
          ? `.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`
          : undefined,
    },
  },
});

// Type-safe session helper for Server Components
export type Session = typeof auth.$Infer.Session;
