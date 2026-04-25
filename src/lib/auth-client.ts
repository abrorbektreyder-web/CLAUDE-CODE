import { createAuthClient } from 'better-auth/react';

// ════════════════════════════════════════════════════════════════════════════
// CLIENT-SIDE AUTH SDK
// ════════════════════════════════════════════════════════════════════════════
// Use this in Client Components for sign-in/sign-up/sign-out
//
// @example
// import { authClient } from '@/lib/auth-client';
// const { data, error } = await authClient.signIn.email({
//   email, password
// });
// ════════════════════════════════════════════════════════════════════════════

export const authClient = createAuthClient({
  baseURL: typeof window !== 'undefined' 
    ? window.location.origin 
    : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  user: {
    additionalFields: {
      tenantId: {
        type: 'string',
      },
      role: {
        type: 'string',
      },
      branchId: {
        type: 'string',
      },
      phone: {
        type: 'string',
        input: true,
        required: false,
      },
      storeName: {
        type: 'string',
        input: true,
        required: false,
      }
    }
  }
});

// Re-export hooks for convenience
export const {
  useSession,
  signIn,
  signUp,
  signOut,
  getSession,
} = authClient;
