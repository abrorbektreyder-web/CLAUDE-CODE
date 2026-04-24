import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

const createProductSchema = z.object({
  name: z.string().min(1, 'Tovar nomi kiritilishi shart'),
  brand: z.string().optional(),
  model: z.string().optional(),
  sku: z.string().min(1, 'SKU kiritilishi shart'),
  barcode: z.string().optional(),
  productType: z.string().min(1, 'Tovar turi kiritilishi shart'),
  costPrice: z.number().min(0, 'Narx 0 dan katta bo\'lishi kerak'),
  retailPrice: z.number().min(0, 'Narx 0 dan katta bo\'lishi kerak'),
  wholesalePrice: z.number().optional(),
  minStock: z.number().min(0).default(5),
  warrantyMonths: z.number().min(0).default(12),
  description: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: 'Tizimga kirish talab qilinadi' }, { status: 401 });
    }

    const body = await request.json();
    const data = createProductSchema.parse(body);

    const supabase = getSupabase();

    // Check SKU uniqueness
    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('tenant_id', session.user.tenantId)
      .eq('sku', data.sku)
      .is('deleted_at', null)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: `Bu SKU (${data.sku}) allaqachon mavjud` },
        { status: 409 }
      );
    }

    const { data: product, error } = await supabase
      .from('products')
      .insert({
        tenant_id: session.user.tenantId,
        name: data.name,
        brand: data.brand || null,
        model: data.model || null,
        sku: data.sku,
        barcode: data.barcode || null,
        product_type: data.productType,
        cost_price: data.costPrice,
        retail_price: data.retailPrice,
        wholesale_price: data.wholesalePrice || null,
        min_stock: data.minStock,
        warranty_months: data.warrantyMonths,
        description: data.description || null,
        is_active: true,
        is_featured: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Product create error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, product }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validatsiya xatosi', details: err.errors },
        { status: 400 }
      );
    }
    console.error('Unexpected error:', err);
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || 'all';

    const supabase = getSupabase();
    let query = supabase
      .from('products')
      .select('*')
      .eq('tenant_id', session.user.tenantId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%,barcode.ilike.%${search}%`);
    }
    if (type !== 'all') {
      query = query.eq('product_type', type);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ products: data || [] });
  } catch (err) {
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 });
  }
}
