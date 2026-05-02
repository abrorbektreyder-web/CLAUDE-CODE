import { NextRequest, NextResponse } from 'next/server';
import { getExpenses, createExpense } from '@/db/queries';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';

async function getTenantId(): Promise<string | null> {
  const h = await headers();
  return h.get('x-tenant-id') || h.get('x-subdomain') || null;
}

export async function GET(req: NextRequest) {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 400 });

    const { searchParams } = req.nextUrl;
    const data = await getExpenses({
      tenantId,
      startDate: searchParams.get('start') || undefined,
      endDate:   searchParams.get('end')   || undefined,
      categoryId: searchParams.get('categoryId') || undefined,
    });
    return NextResponse.json(data || []);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 400 });

    // Get current user session
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const data = await createExpense({
      tenantId,
      createdBy: session.user.id,
      categoryId: body.categoryId,
      amount: Number(body.amount),
      currency: body.currency || 'USD',
      expenseDate: body.expenseDate,
      description: body.description,
    });
    return NextResponse.json(data, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
