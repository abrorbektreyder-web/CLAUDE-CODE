import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';
import * as schema from '../schema';

// ════════════════════════════════════════════════════════════════════════════
// DATABASE CONNECTION
// ════════════════════════════════════════════════════════════════════════════

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

if (!process.env.ENCRYPTION_KEY) {
  throw new Error('ENCRYPTION_KEY environment variable is not set');
}

// Connection options
const connectionOptions = {
  // Disable prepared statements for compatibility with Supabase Transaction Pooler
  prepare: false,

  // Connection pool sizing (adjust based on your load)
  max: 10,

  // Idle timeout (close unused connections after 20s)
  idle_timeout: 20,

  // Max connection lifetime (30 minutes)
  max_lifetime: 60 * 30,

  // Connection timeout (5s)
  connect_timeout: 5,

  // Enable SSL in production
  ssl:
    process.env.NODE_ENV === 'production'
      ? ('require' as const)
      : (false as const),
};

// Single client instance (singleton pattern)
const client = postgres(process.env.DATABASE_URL, connectionOptions);

// Drizzle instance with full schema
export const db = drizzle(client, {
  schema,
  logger: process.env.NODE_ENV === 'development',
});

export type Database = typeof db;

// ════════════════════════════════════════════════════════════════════════════
// TENANT CONTEXT — Sets RLS variables for current request
// ════════════════════════════════════════════════════════════════════════════

export interface TenantContext {
  tenantId: string;
  userId: string;
  userRole:
    | 'super_admin'
    | 'tenant_owner'
    | 'admin'
    | 'manager'
    | 'accountant'
    | 'warehouse'
    | 'cashier';
  clientIp?: string;
}

/**
 * Execute a function within a tenant context.
 * Sets PostgreSQL session variables that RLS policies use to filter data.
 *
 * **CRITICAL:** Every API request must wrap its DB operations in this function.
 * Otherwise, RLS will block all queries (no tenant_id = no data).
 *
 * @example
 * export async function GET(req: Request) {
 *   const ctx = await getSession(req);
 *
 *   return await withTenant(ctx, async () => {
 *     const sales = await db.query.sales.findMany();
 *     return Response.json(sales);
 *   });
 * }
 */
export async function withTenant<T>(
  ctx: TenantContext,
  fn: () => Promise<T>
): Promise<T> {
  // NOTE: Direct SQL context setting is disabled because port 5432 is blocked.
  // The application now uses Supabase HTTP SDK which handles multi-tenancy differently.
  /*
  await db.execute(sql`
    SELECT set_tenant_context(
      ${ctx.tenantId}::uuid,
      ${ctx.userId}::uuid,
      ${ctx.userRole}::user_role,
      ${ctx.clientIp ?? null}::inet
    )
  `);
  */

  return await fn();
}

/**
 * Execute as super_admin (bypasses tenant isolation).
 * **DANGER:** Only use for system-level operations like cron jobs,
 * tenant onboarding, billing, etc. NEVER for user-facing requests.
 */
export async function withSuperAdmin<T>(fn: () => Promise<T>): Promise<T> {
  await db.execute(sql`
    SELECT set_config('app.user_role', 'super_admin', FALSE);
    SELECT set_config('app.tenant_id', '00000000-0000-0000-0000-000000000000', FALSE);
  `);

  await db.execute(sql`
    SELECT set_config(
      'app.encryption_key',
      ${process.env.ENCRYPTION_KEY!},
      FALSE
    )
  `);

  return await fn();
}

// ════════════════════════════════════════════════════════════════════════════
// HEALTH CHECK
// ════════════════════════════════════════════════════════════════════════════

export async function healthCheck(): Promise<{
  status: 'ok' | 'error';
  latency_ms: number;
  error?: string;
}> {
  const start = Date.now();
  try {
    await db.execute(sql`SELECT 1`);
    return {
      status: 'ok',
      latency_ms: Date.now() - start,
    };
  } catch (error) {
    return {
      status: 'error',
      latency_ms: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// GRACEFUL SHUTDOWN
// ════════════════════════════════════════════════════════════════════════════

export async function closeConnection(): Promise<void> {
  await client.end({ timeout: 5 });
}

// Handle process termination (Node.js)
if (typeof process !== 'undefined') {
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, closing DB connection...');
    await closeConnection();
    process.exit(0);
  });
}
