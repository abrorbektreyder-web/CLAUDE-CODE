import { NextRequest, NextResponse } from 'next/server';
import { getFinanceSummary } from '@/db/queries';
import { headers } from 'next/headers';

async function getTenantId(): Promise<string | null> {
  const h = await headers();
  return h.get('x-tenant-id') || h.get('x-subdomain') || null;
}

export async function GET(req: NextRequest) {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 400 });

    const { searchParams } = req.nextUrl;
    const today = new Date().toISOString().split('T')[0];
    const startDate = searchParams.get('start') || today;
    const endDate   = searchParams.get('end')   || today;

    const data = await getFinanceSummary({ tenantId, startDate, endDate });
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
