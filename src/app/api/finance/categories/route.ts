import { NextRequest, NextResponse } from 'next/server';
import { getExpenseCategories, createExpenseCategory } from '@/db/queries';
import { headers } from 'next/headers';

async function getTenantId(): Promise<string | null> {
  const h = await headers();
  return h.get('x-tenant-id') || h.get('x-subdomain') || null;
}

export async function GET() {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 400 });
    const data = await getExpenseCategories(tenantId);
    return NextResponse.json(data || []);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 400 });
    const body = await req.json();
    const data = await createExpenseCategory({ tenantId, ...body });
    return NextResponse.json(data, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
