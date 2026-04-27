import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { extractSubdomain } from '@/lib/tenant';
import { normalizePhone } from '@/db/lib/encryption';
import { auth } from '@/lib/auth';

// ════════════════════════════════════════════════════════════════════════════
// CASHIER PIN LOGIN — Telefon + PIN orqali kassir autentifikatsiyasi
// ════════════════════════════════════════════════════════════════════════════

export async function POST(req: NextRequest) {
  console.log('[CASHIER LOGIN] Request received');
  try {
    let body;
    try {
      body = await req.json();
    } catch (e) {
      console.error('[CASHIER LOGIN] Failed to parse JSON body');
      return NextResponse.json({ error: 'Noto\'g\'ri so\'rov formati' }, { status: 400 });
    }
    
    const { phone, pin } = body;
    console.log('[CASHIER LOGIN] Phone:', phone);

    // ── 1. Validate input ──────────────────────────────────────────────────
    if (!phone || !pin) {
      return NextResponse.json(
        { error: 'Telefon va PIN kiritilishi shart' },
        { status: 400 }
      );
    }

    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      return NextResponse.json(
        { error: 'Telefon raqami noto\'g\'ri (masalan: 901234567)' },
        { status: 400 }
      );
    }

    // ── 2. Supabase Admin client ───────────────────────────────────────────
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    // ── 3. Tenant Resolution ───────────────────────────────────────────────
    const host = req.headers.get('host') ?? '';
    const subdomain = extractSubdomain(host);
    const isDev = host.includes('localhost') || host.includes('127.0.0.1');

    console.log('[CASHIER LOGIN] Subdomain:', subdomain, 'isDev:', isDev);

    let tenantId: string | null = null;

    if (subdomain) {
      const { data: tenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('subdomain', subdomain)
        .in('status', ['active', 'trial'])
        .maybeSingle();
      tenantId = tenant?.id ?? null;
    } else if (isDev) {
      const { data: tenant } = await supabase
        .from('tenants')
        .select('id')
        .in('status', ['active', 'trial'])
        .is('deleted_at', null)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();
      tenantId = tenant?.id ?? null;
    }

    if (!tenantId) {
      console.error('[CASHIER LOGIN] Tenant not found');
      return NextResponse.json(
        { error: 'Do\'kon topilmadi. Admin bilan bog\'laning.' },
        { status: 404 }
      );
    }

    // ── 4. Find user by phone ──────────────────────────────────────────────
    console.log('[CASHIER LOGIN] Looking for user with phone:', normalizedPhone, 'in tenant:', tenantId);
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, pin_hash, role, full_name, is_active, is_locked')
      .eq('phone', normalizedPhone)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .maybeSingle();

    if (userError || !user) {
      console.error('[CASHIER LOGIN] User not found or DB error:', userError);
      return NextResponse.json(
        { error: 'Bu telefon raqam tizimda yo\'q' },
        { status: 404 }
      );
    }

    if (!user.is_active) {
      return NextResponse.json(
        { error: 'Hisobingiz faol emas. Adminga murojaat qiling.' },
        { status: 403 }
      );
    }

    if (user.is_locked) {
      return NextResponse.json(
        { error: 'Hisobingiz bloklangan. Adminga murojaat qiling.' },
        { status: 403 }
      );
    }

    if (!user.pin_hash) {
      return NextResponse.json(
        { error: 'PIN sozlanmagan. Admin bilan bog\'laning.' },
        { status: 403 }
      );
    }

    // ── 5. Verify PIN ──────────────────────────────────────────────────────
    console.log('[CASHIER LOGIN] Verifying PIN for user:', user.id);
    const isPinValid = await bcrypt.compare(pin, user.pin_hash);
    if (!isPinValid) {
      console.warn('[CASHIER LOGIN] Invalid PIN for user:', user.id);
      return NextResponse.json(
        { error: 'PIN kod noto\'g\'ri. Qaytadan urinib ko\'ring.' },
        { status: 401 }
      );
    }

    // ── 6. Create Better Auth session ──────────────────────────────────────
    console.log('[CASHIER LOGIN] Creating session for user:', user.id);
    let sessionResult;
    try {
      sessionResult = await auth.api.createSession({
        body: { userId: user.id },
      });
    } catch (authError) {
      console.error('[CASHIER LOGIN] Better Auth createSession crashed:', authError);
      throw authError;
    }

    if (!sessionResult?.session?.token) {
      console.error('[CASHIER LOGIN] createSession returned no token:', sessionResult);
      return NextResponse.json(
        { error: 'Sessiya yaratishda xatolik. Qaytadan urinib ko\'ring.' },
        { status: 500 }
      );
    }

    const token = sessionResult.session.token;
    console.log('[CASHIER LOGIN] Session created successfully');

    // ── 7. Update last login tracking ──────────────────────────────────────
    await supabase
      .from('users')
      .update({
        failed_login_attempts: 0,
        last_login_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    // ── 8. Set cookie and return success ───────────────────────────────────
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieName = isProduction
      ? '__Secure-better-auth.session_token'
      : 'better-auth.session_token';

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const response = NextResponse.json({
      success: true,
      redirectTo: '/pos',
      user: {
        id: user.id,
        name: user.full_name,
        role: user.role,
      },
    });

    response.cookies.set(cookieName, token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      expires: expiresAt,
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('[CASHIER LOGIN] Unexpected error:', error);
    return NextResponse.json(
      { 
        error: 'Server xatoligi yuz berdi',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
