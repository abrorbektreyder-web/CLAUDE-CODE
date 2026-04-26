import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { recordDebtPayment } from '@/db/queries';

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { debtId, amount, paymentMethod, notes } = body;

    if (!debtId || !amount || !paymentMethod) {
      return NextResponse.json({ error: 'Ma\'lumotlar to\'liq emas' }, { status: 400 });
    }

    const payment = await recordDebtPayment({
      tenantId: session.user.tenantId,
      debtId,
      amount,
      paymentMethod,
      cashierId: session.user.id,
      notes,
    });

    return NextResponse.json({ success: true, payment });
  } catch (error: any) {
    console.error('Record payment error:', error);
    return NextResponse.json({ error: error.message || 'Xatolik yuz berdi' }, { status: 500 });
  }
}
