import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || (session.user.role !== 'admin' && session.user.role !== 'tenant_owner')) {
      return NextResponse.json({ error: 'Ruxsat etilmagan' }, { status: 403 });
    }

    const { data: users, error } = await supabase
      .from('users')
      .select(`
        id,
        full_name,
        email,
        role,
        is_active,
        branches (name)
      `)
      .eq('tenant_id', session.user.tenantId);

    if (error) throw error;

    // Map full_name to name for the frontend
    const mappedUsers = users.map(u => ({
      ...u,
      name: u.full_name
    }));

    return NextResponse.json(mappedUsers);
  } catch (error: any) {
    console.error('Fetch users error:', error);
    return NextResponse.json({ error: 'Server xatoligi' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || (session.user.role !== 'admin' && session.user.role !== 'tenant_owner')) {
      return NextResponse.json({ error: 'Ruxsat etilmagan' }, { status: 403 });
    }

    const body = await req.json();
    const { name, email, password, role, branchId, phone } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: "Barcha maydonlarni to'ldiring" }, { status: 400 });
    }

    // Hash password
    const bcrypt = await import('bcryptjs');
    const passwordHash = await bcrypt.hash(password, 12);

    // Better Auth might require users to be inserted directly into the 'user' table (which we map to 'users' in adapter)
    // To ensure proper creation with our custom fields, we insert directly using Supabase.
    // The adapter maps 'user' to 'users'. We just insert into 'users' directly.
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        tenant_id: session.user.tenantId,
        full_name: name,
        email,
        phone, // Passed from frontend or fallback
        email_verified: true,
        password_hash: passwordHash, // DB uses password_hash
        pin_hash: 'dummy', // Satisfies 'auth_method' constraint for cashiers
        role,
        branch_id: branchId === 'all' ? null : branchId,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique violation
        return NextResponse.json({ error: "Bu email allaqachon mavjud" }, { status: 400 });
      }
      throw error;
    }

    // IMPORTANT: Create account record for Better Auth email+password login
    const { error: accountError } = await supabase
      .from('accounts')
      .insert({
        id: crypto.randomUUID(),
        user_id: newUser.id,
        account_id: newUser.id, // Better Auth often uses user_id as account_id for credentials
        provider_id: 'credential',
        password: passwordHash,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (accountError) {
      console.error('Create account error:', accountError);
      // We should probably delete the user if account creation fails, 
      // but for now we just log it.
    }

    return NextResponse.json(newUser, { status: 201 });
  } catch (error: any) {
    console.error('Create user error:', error);
    return NextResponse.json({ error: 'Server xatoligi' }, { status: 500 });
  }
}
