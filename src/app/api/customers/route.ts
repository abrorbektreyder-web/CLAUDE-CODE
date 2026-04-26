import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { createCustomer } from '@/db/queries';

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { fullName, phone, address, passport, notes } = body;

    if (!fullName || !phone) {
      return NextResponse.json({ error: 'Ism va telefon raqami majburiy' }, { status: 400 });
    }

    const customer = await createCustomer({
      tenantId: session.user.tenantId,
      fullName,
      phone,
      address,
      passport,
      notes,
    });

    return NextResponse.json({ success: true, customer });
  } catch (error: any) {
    console.error('Create customer error:', error);
    return NextResponse.json({ error: error.message || 'Xatolik yuz berdi' }, { status: 500 });
  }
}
