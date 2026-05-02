
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getSuppliers, createSupplier } from '@/db/queries';
import { z } from 'zod';

const createSupplierSchema = z.object({
  name: z.string().min(1, 'Ism majburiy'),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Email xato').optional().or(z.literal('')),
  address: z.string().optional(),
  inn: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const suppliers = await getSuppliers(session.user.tenantId);
    return NextResponse.json(suppliers);
  } catch (error) {
    console.error('GET /api/suppliers error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = createSupplierSchema.parse(body);

    const supplier = await createSupplier({
      tenantId: session.user.tenantId,
      ...validatedData,
    });

    return NextResponse.json(supplier, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validatsiya xatosi', details: error.errors }, { status: 400 });
    }
    console.error('POST /api/suppliers error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
