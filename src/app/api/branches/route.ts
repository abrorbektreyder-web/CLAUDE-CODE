import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { createBranch } from '@/db/queries';

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, address, phone, type } = body;

    if (!name || !address) {
      return NextResponse.json({ error: 'Nomi va manzili majburiy' }, { status: 400 });
    }

    const branch = await createBranch({
      tenantId: session.user.tenantId,
      name,
      address,
      phone,
      type,
    });

    return NextResponse.json({ success: true, branch });
  } catch (error: any) {
    console.error('Create branch error:', error);
    return NextResponse.json({ error: error.message || 'Xatolik yuz berdi' }, { status: 500 });
  }
}
