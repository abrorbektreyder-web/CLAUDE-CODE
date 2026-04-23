import { headers } from 'next/headers';
import { db } from '@/db/lib/db';
import { tenants } from '@/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { cache } from 'react';

// ════════════════════════════════════════════════════════════════════════════
// TENANT RESOLUTION
// ════════════════════════════════════════════════════════════════════════════

/**
 * Extract subdomain from host
 *
 * Examples:
 *   'mobicenter.poshub.uz'          → 'mobicenter'
 *   'mobicenter.localhost:3000'     → 'mobicenter'
 *   'localhost:3000'                → null  (no subdomain)
 *   'poshub.uz'                     → null
 */
export function extractSubdomain(host: string | null): string | null {
  if (!host) return null;

  // Strip port
  const hostname = host.split(':')[0];

  // Localhost development: support {tenant}.localhost
  if (hostname.endsWith('.localhost')) {
    const sub = hostname.replace('.localhost', '');
    return sub || null;
  }

  // Production: {tenant}.{rootdomain}.{tld}
  const parts = hostname.split('.');

  // Need at least 3 parts (sub.domain.tld)
  if (parts.length < 3) return null;

  // First part is the subdomain
  const subdomain = parts[0];

  // Reserved subdomains
  const reserved = ['www', 'api', 'admin', 'app', 'dashboard', 'static'];
  if (reserved.includes(subdomain)) return null;

  return subdomain;
}

/**
 * Get tenant from current request (cached per request)
 *
 * In Server Components and API routes:
 * ```ts
 * const tenant = await getCurrentTenant();
 * if (!tenant) return notFound();
 * ```
 */
export const getCurrentTenant = cache(async () => {
  const headersList = await headers();
  const host = headersList.get('host');
  const subdomain = extractSubdomain(host);

  if (!subdomain) return null;

  const [tenant] = await db
    .select()
    .from(tenants)
    .where(
      and(
        eq(tenants.subdomain, subdomain),
        isNull(tenants.deletedAt),
        eq(tenants.status, 'active')
      )
    )
    .limit(1);

  return tenant ?? null;
});

/**
 * Build tenant URL
 *
 * @example
 * tenantUrl('mobicenter', '/dashboard')
 * // → 'https://mobicenter.poshub.uz/dashboard' (prod)
 * // → 'http://mobicenter.localhost:3000/dashboard' (dev)
 */
export function tenantUrl(subdomain: string, path: string = '/'): string {
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'localhost:3000';
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  return `${protocol}://${subdomain}.${rootDomain}${cleanPath}`;
}

/**
 * Validate subdomain format
 *
 * Rules:
 *   - 3-30 chars
 *   - lowercase letters, numbers, hyphens
 *   - cannot start/end with hyphen
 */
export function isValidSubdomain(subdomain: string): boolean {
  if (!subdomain || subdomain.length < 3 || subdomain.length > 30) {
    return false;
  }

  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(subdomain)) {
    return false;
  }

  const reserved = [
    'www', 'api', 'admin', 'app', 'dashboard', 'static',
    'mail', 'support', 'help', 'docs', 'blog', 'cdn',
  ];

  return !reserved.includes(subdomain);
}
