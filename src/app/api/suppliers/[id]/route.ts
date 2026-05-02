
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getSupplierById, createSupplierTransaction } from '@/db/queries';
import { z } from 'zod';

const transactionSchema = z.object({
  type: z.enum(['purchase', 'payment', 'return', 'adjustment']),
  amount: z.number().positive('Summa musbat bo\'lishi kerak'),
  notes: z.string().optional(),
  referenceType: z.string().optional(),
  referenceId: z.string().uuid().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const supplier = await getSupplierById(id, session.user.tenantId);
    
    return NextResponse.json(supplier);
  } catch (error) {
    console.error('GET /api/suppliers/[id] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const validatedData = transactionSchema.parse(body);

    const transaction = await createSupplierTransaction({
      tenantId: session.user.tenantId,
      supplierId: id,
      performedBy: session.user.id,
      ...validatedData,
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validatsiya xatosi', details: error.errors }, { status: 400 });
    }
    console.error('POST /api/suppliers/[id] transaction error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
