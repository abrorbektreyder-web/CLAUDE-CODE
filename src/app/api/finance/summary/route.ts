import { NextRequest, NextResponse } from 'next/server';
import { getFinanceSummary } from '@/db/queries';
import { headers } from 'next/headers';

import { auth } from '@/lib/auth';

// We extract tenantId directly from the session in the routes
export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const tenantId = session.user.tenantId;
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
