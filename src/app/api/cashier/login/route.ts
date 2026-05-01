import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

// ──────────────────────────────────────────────────────────────────────────
// Kassir Login — email + parol orqali
// Better Auth's signInEmail action yordamida sessiya yaratadi
// ──────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email va parol kiritilishi shart' },
        { status: 400 }
      );
    }

    // Use Better Auth's built-in email+password sign-in
    const result = await auth.api.signInEmail({
      body: { email, password },
      headers: req.headers,
    });

    if (!result || !result.token) {
      return NextResponse.json(
        { error: 'Email yoki parol noto\'g\'ri' },
        { status: 401 }
      );
    }

    // Check role — only cashier, admin, tenant_owner can access cassir panel
    const user = result.user as any;
    const allowedRoles = ['cashier', 'admin', 'tenant_owner'];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { error: 'Sizda kassa paneliga kirish huquqi yo\'q' },
        { status: 403 }
      );
    }

    const isProduction = process.env.NODE_ENV === 'production';
    const cookieName = isProduction
      ? '__Secure-better-auth.session_token'
      : 'better-auth.session_token';

    const response = NextResponse.json({
      success: true,
      redirectTo: '/pos',
      user: { id: user.id, name: user.name, role: user.role },
    });

    response.cookies.set(cookieName, result.token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('[cashier/login] error:', error);
    return NextResponse.json(
      { error: 'Email yoki parol noto\'g\'ri' },
      { status: 401 }
    );
  }
}
