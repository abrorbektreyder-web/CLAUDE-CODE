import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getSupabase } from '@/db/lib/supabase';
import { nanoid } from 'nanoid';

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: 'Tizimga kirish talab qilinadi' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Fayl tanlanmagan' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Faqat rasm yuklash mumkin' }, { status: 400 });
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Rasm hajmi 5MB dan oshmasligi kerak' }, { status: 400 });
    }

    const supabase = getSupabase();
    const fileExt = file.name.split('.').pop();
    const fileName = `${session.user.tenantId}/${nanoid()}.${fileExt}`;
    
    const buffer = Buffer.from(await file.arrayBuffer());

    // 1. Check if bucket exists, if not try to create it
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.find(b => b.name === 'products');

    if (!bucketExists) {
      console.log('[Upload] Creating "products" bucket...');
      const { error: createError } = await supabase.storage.createBucket('products', {
        public: true,
        fileSizeLimit: 5242880, // 5MB
      });
      if (createError) {
        console.error('[Upload] Bucket creation failed:', createError);
        return NextResponse.json({ 
          error: "Supabase'da 'products' omborini yaratib bo'lmadi. Iltimos, Supabase panelida 'products' nomli PUBLIC bucket yarating." 
        }, { status: 500 });
      }
    }

    // 2. Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('products')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true
      });

    if (error) {
      console.error('[Upload] Supabase error:', error);
      return NextResponse.json({ error: `Supabase xatosi: ${error.message}` }, { status: 500 });
    }

    // 3. Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('products')
      .getPublicUrl(fileName);

    return NextResponse.json({ url: publicUrl });
  } catch (err) {
    console.error('[Upload] Unexpected error:', err);
    return NextResponse.json({ error: 'Rasm yuklashda kutilmagan xato yuz berdi' }, { status: 500 });
  }
}
