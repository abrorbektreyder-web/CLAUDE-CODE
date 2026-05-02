import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Topbar } from '@/components/dashboard/topbar';
import { SidebarProvider } from '@/components/dashboard/sidebar-provider';
import { getTenant } from '@/db/queries';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect('/login?callback=/dashboard');
  }

  if (session.user.role === 'cashier') {
    redirect('/pos');
  }

  const tenant = session.user.tenantId 
    ? await getTenant(session.user.tenantId)
    : null;

  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden bg-[var(--color-background)]">
        {/* Ambient glow */}
        <div
          className="pointer-events-none fixed -right-48 -top-48 h-[600px] w-[600px] rounded-full opacity-20 blur-3xl"
          style={{
            background:
              'radial-gradient(circle, rgba(255, 107, 53, 0.4) 0%, transparent 60%)',
          }}
        />

        {/* Sidebar */}
        <Sidebar user={session.user} tenant={tenant} />

        {/* Main content */}
        <main className="flex flex-1 flex-col overflow-hidden">
          <Topbar user={session.user} />
          <div className="flex-1 overflow-y-auto p-4 md:p-6">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
}
