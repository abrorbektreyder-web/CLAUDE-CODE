import { NextRequest, NextResponse } from 'next/server';

// ════════════════════════════════════════════════════════════════════════════
// MIDDLEWARE — runs on EVERY request before reaching the route
// ════════════════════════════════════════════════════════════════════════════
// Responsibilities:
//   1. Resolve subdomain → tenant
//   2. Set tenant context in headers (for Server Components)
//   3. Redirect unauthenticated users from protected routes
// ════════════════════════════════════════════════════════════════════════════

const PUBLIC_PATHS = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/api/auth',
  '/api/health',
  '/_next',
  '/favicon.ico',
];

const CASHIER_PATHS = ['/pos', '/api/sales', '/api/cashier'];
const ADMIN_PATHS = ['/dashboard', '/api/admin'];

export async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const pathname = url.pathname;
  const host = req.headers.get('host') ?? '';

  // ─── 1. Skip middleware for static assets ──────────────────────────────
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/_next/') ||
    /\.(png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|eot)$/i.test(pathname)
  ) {
    return NextResponse.next();
  }

  // ─── 2. Extract subdomain ──────────────────────────────────────────────
  const hostname = host.split(':')[0];
  let subdomain: string | null = null;

  if (hostname.endsWith('.localhost')) {
    // Dev: {tenant}.localhost
    subdomain = hostname.replace('.localhost', '') || null;
  } else if (hostname.split('.').length >= 3) {
    // Prod: {tenant}.poshub.uz
    const sub = hostname.split('.')[0];
    if (!['www', 'api', 'admin', 'app'].includes(sub)) {
      subdomain = sub;
    }
  }

  // ─── 3. Build response with custom headers ─────────────────────────────
  const response = NextResponse.next({
    request: {
      headers: new Headers({
        ...Object.fromEntries(req.headers.entries()),
        'x-subdomain': subdomain ?? '',
        'x-pathname': pathname,
      }),
    },
  });

  // ─── 4. Public path? Allow ─────────────────────────────────────────────
  const isPublicPath = PUBLIC_PATHS.some((p) =>
    p === '/' ? pathname === '/' : pathname.startsWith(p)
  );

  if (isPublicPath) {
    return response;
  }

  // ─── 5. Auth check (read session cookie) ───────────────────────────────
  const sessionCookie = req.cookies.get('pos.session_token') || req.cookies.get('__Secure-pos.session_token');

  if (!sessionCookie) {
    // No session → redirect to login
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callback', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ─── 6. (Optional) Role-based path restrictions ────────────────────────
  // Note: Full role check happens in API route via createApiRoute.
  // This is just a quick redirect — full validation in handler.

  // ─── 7. Route to correct app section based on path ─────────────────────
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - api/auth (Better Auth handles its own paths)
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};
