import { NextRequest, NextResponse } from 'next/server';
import { getExpenseCategories, createExpenseCategory } from '@/db/queries';
import { headers } from 'next/headers';

import { auth } from '@/lib/auth';

// We extract tenantId directly from the session in the routes
export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const tenantId = session.user.tenantId;
    if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 400 });
    const data = await getExpenseCategories(tenantId);
    return NextResponse.json(data || []);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const tenantId = session.user.tenantId;
    if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 400 });
    const body = await req.json();
    const data = await createExpenseCategory({ tenantId, ...body });
    return NextResponse.json(data, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
