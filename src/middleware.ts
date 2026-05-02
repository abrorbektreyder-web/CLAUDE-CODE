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
  '/cashier-login',
  '/api/cashier',
  '/api/auth',
  '/api/health',
  '/api/cron',
  '/_next',
  '/favicon.ico',
];

// Public paths that don't require authentication

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

  // ─── 5. Redirect /pos to /staff/pos ────────────────────────────────────
  if (pathname === '/pos') {
    return NextResponse.redirect(new URL('/staff/pos', req.url));
  }

  // ─── 6. Auth check (read session cookie) ───────────────────────────────
  const sessionCookie =
    req.cookies.get('better-auth.session_token') ||
    req.cookies.get('__Secure-better-auth.session_token');

  // Next.js prefetch requests shouldn't trigger a full redirect to login
  const isPrefetch = req.headers.get('purpose') === 'prefetch' || req.headers.get('x-middleware-prefetch') === '1';

  if (!sessionCookie && !isPrefetch) {
    // /staff/* — kassir login sahifasiga yo'naltirish
    if (pathname.startsWith('/staff')) {
      return NextResponse.redirect(new URL('/cashier-login', req.url));
    }
    // Admin va boshqa himoyalangan yo'llar → asosiy login sahifasiga
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callback', pathname);
    return NextResponse.redirect(loginUrl);
  }

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

