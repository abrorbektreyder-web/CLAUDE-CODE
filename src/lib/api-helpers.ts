import { NextRequest, NextResponse } from 'next/server';
import { auth } from './auth';
import { withTenant, type TenantContext } from '@/db/lib/db';
import { getCurrentTenant } from './tenant';
import { ZodError, type ZodSchema } from 'zod';

// ════════════════════════════════════════════════════════════════════════════
// API ROUTE HELPERS
// ════════════════════════════════════════════════════════════════════════════
// Wrap API route handlers with auth + tenant context + error handling
//
// @example
// export const POST = createApiRoute({
//   schema: createSaleSchema,
//   handler: async ({ body, ctx }) => {
//     const sale = await createSale(body);
//     return { sale };
//   }
// });
// ════════════════════════════════════════════════════════════════════════════

export interface ApiRouteContext<TBody = unknown> {
  req: NextRequest;
  body: TBody;
  ctx: TenantContext;
  user: { id: string; email: string; name: string };
}

export interface CreateApiRouteOptions<TBody, TResponse> {
  /** Optional Zod schema for body validation */
  schema?: ZodSchema<TBody>;

  /** Required user roles (defaults to any authenticated) */
  roles?: TenantContext['userRole'][];

  /** Whether tenant context is required (defaults to true) */
  requireTenant?: boolean;

  /** Handler function */
  handler: (
    context: ApiRouteContext<TBody>
  ) => Promise<TResponse> | TResponse;
}

export function createApiRoute<TBody = unknown, TResponse = unknown>(
  options: CreateApiRouteOptions<TBody, TResponse>
) {
  return async function handler(req: NextRequest) {
    try {
      // ─── 1. Check authentication ──────────────────────────────────────
      const session = await auth.api.getSession({
        headers: req.headers,
      });

      if (!session?.user) {
        return NextResponse.json(
          { error: 'Unauthorized', message: 'Tizimga kiring' },
          { status: 401 }
        );
      }

      // ─── 2. Resolve tenant ────────────────────────────────────────────
      const tenant = await getCurrentTenant();

      if (!tenant && options.requireTenant !== false) {
        return NextResponse.json(
          { error: 'TenantNotFound', message: 'Biznes topilmadi' },
          { status: 404 }
        );
      }

      // TODO: Get user's role from your custom users table
      // For now, hardcoded — replace with actual lookup
      const userRole: TenantContext['userRole'] = 'tenant_owner';

      // ─── 3. Check role permissions ────────────────────────────────────
      if (options.roles && !options.roles.includes(userRole)) {
        return NextResponse.json(
          { error: 'Forbidden', message: 'Ruxsat etilmagan' },
          { status: 403 }
        );
      }

      // ─── 4. Parse + validate body ─────────────────────────────────────
      let body: TBody = {} as TBody;

      if (req.method !== 'GET' && req.method !== 'HEAD') {
        try {
          const rawBody = await req.json().catch(() => ({}));
          body = options.schema ? options.schema.parse(rawBody) : (rawBody as TBody);
        } catch (error) {
          if (error instanceof ZodError) {
            return NextResponse.json(
              {
                error: 'ValidationError',
                message: 'Ma\'lumotlar noto\'g\'ri',
                issues: error.issues,
              },
              { status: 400 }
            );
          }
          throw error;
        }
      }

      // ─── 5. Build tenant context ──────────────────────────────────────
      const tenantCtx: TenantContext = {
        tenantId: tenant?.id ?? '00000000-0000-0000-0000-000000000000',
        userId: session.user.id,
        userRole,
        clientIp:
          req.headers.get('x-forwarded-for')?.split(',')[0] ??
          req.headers.get('x-real-ip') ??
          undefined,
      };

      // ─── 6. Run handler within tenant context ─────────────────────────
      const result = await withTenant(tenantCtx, () =>
        Promise.resolve(
          options.handler({
            req,
            body,
            ctx: tenantCtx,
            user: {
              id: session.user.id,
              email: session.user.email,
              name: session.user.name,
            },
          })
        )
      );

      return NextResponse.json(result);
    } catch (error) {
      console.error('API route error:', error);

      // Application-specific errors
      if (error instanceof Error) {
        // Known business logic errors → 400
        const businessErrors = [
          'Phone with this IMEI not found',
          'Phone is not available',
          'Insufficient stock',
          'Invalid IMEI',
          'Invalid Uzbek phone number',
          'Customer required for credit sale',
        ];

        if (businessErrors.some((msg) => error.message.includes(msg))) {
          return NextResponse.json(
            { error: 'BusinessError', message: error.message },
            { status: 400 }
          );
        }
      }

      // Unknown error → 500
      return NextResponse.json(
        {
          error: 'InternalError',
          message:
            process.env.NODE_ENV === 'development' && error instanceof Error
              ? error.message
              : 'Server xatosi',
        },
        { status: 500 }
      );
    }
  };
}
