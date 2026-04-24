import { headers } from 'next/headers';
import { cache } from 'react';
import { createClient } from '@supabase/supabase-js';

// ════════════════════════════════════════════════════════════════════════════
// SUPABASE HTTP CLIENT (Bypasses port 5432 block)
// ════════════════════════════════════════════════════════════════════════════

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { persistSession: false },
    db: { schema: 'public' },
  }
);

// ════════════════════════════════════════════════════════════════════════════
// TENANT RESOLUTION
// ════════════════════════════════════════════════════════════════════════════

/**
 * Extract subdomain from host
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
 */
export const getCurrentTenant = cache(async () => {
  const headersList = await headers();
  const host = headersList.get('host');
  const subdomain = extractSubdomain(host);

  if (!subdomain) return null;

  const { data: tenant, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('subdomain', subdomain)
    .is('deleted_at', null)
    .eq('status', 'active')
    .maybeSingle();

  if (error || !tenant) return null;

  return tenant;
});

/**
 * Build tenant URL
 */
export function tenantUrl(subdomain: string, path: string = '/'): string {
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'localhost:3000';
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  return `${protocol}://${subdomain}.${rootDomain}${cleanPath}`;
}

/**
 * Validate subdomain format
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
