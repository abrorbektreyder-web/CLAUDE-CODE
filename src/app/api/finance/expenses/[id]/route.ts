import { NextRequest, NextResponse } from 'next/server';
import { deleteExpense } from '@/db/queries';
import { headers } from 'next/headers';

async function getTenantId(): Promise<string | null> {
  const h = await headers();
  return h.get('x-tenant-id') || h.get('x-subdomain') || null;
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 400 });
    const { id } = await params;
    await deleteExpense(id, tenantId);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
