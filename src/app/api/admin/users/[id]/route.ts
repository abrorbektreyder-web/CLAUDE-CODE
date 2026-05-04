import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getSupabase } from '@/db/lib/supabase';
import bcrypt from 'bcryptjs';
import { headers } from 'next/headers';

const supabase = getSupabase();

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify session
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: 'Ruxsat yo\'q' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, email, password, role, branchId } = body;

    if (!name || !email || !role) {
      return NextResponse.json({ error: "Barcha majburiy maydonlarni to'ldiring" }, { status: 400 });
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      full_name: name,
      email,
      role,
      branch_id: branchId && branchId !== 'all' ? branchId : null,
      updated_at: new Date().toISOString(),
    };

    // Only hash + update password if provided
    if (password && password.length >= 6) {
      const passwordHash = await bcrypt.hash(password, 12);
      updateData.password_hash = passwordHash;
    }

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .eq('tenant_id', session.user.tenantId) // Security: only update own tenant's users
      .select()
      .single();

    if (error) {
      console.error('Update user error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update account password if provided
    if (password && password.length >= 6) {
      const passwordHash = await bcrypt.hash(password, 12);
      const { error: accError } = await supabase
        .from('accounts')
        .update({
          password: passwordHash,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', id)
        .eq('provider_id', 'credential');
        
      if (accError) {
        console.error('Update account password error:', accError);
      }
    }

    return NextResponse.json({
      id: updatedUser.id,
      name: updatedUser.full_name,
      email: updatedUser.email,
      role: updatedUser.role,
      is_active: updatedUser.is_active,
    });
  } catch (error: any) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: 'Server xatoligi' }, { status: 500 });
  }
}
