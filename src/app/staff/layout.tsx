import { StaffSidebar } from '@/components/dashboard/staff-sidebar';
import { Topbar } from '@/components/dashboard/topbar';
import { SidebarProvider } from '@/components/dashboard/sidebar-provider';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/cashier-login');
  }

  const user = session.user as any;
  if (user.role !== 'cashier' && user.role !== 'tenant_owner' && user.role !== 'admin') {
    redirect('/cashier-login');
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-[var(--color-bg-base)] text-[var(--color-foreground)]">
        <StaffSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Topbar />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
