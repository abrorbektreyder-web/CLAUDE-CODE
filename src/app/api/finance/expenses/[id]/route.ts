import { NextRequest, NextResponse } from 'next/server';
import { deleteExpense } from '@/db/queries';
import { headers } from 'next/headers';

import { auth } from '@/lib/auth';

// We extract tenantId directly from the session in the routes
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const tenantId = session.user.tenantId;
    if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 400 });
    const { id } = await params;
    await deleteExpense(id, tenantId);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
