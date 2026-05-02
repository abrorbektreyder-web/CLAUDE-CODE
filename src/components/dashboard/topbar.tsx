'use client';

import { Bell, Download, Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useSidebar } from '@/components/dashboard/sidebar-provider';

const pageTitles: Record<string, { breadcrumb: string; title: string }> = {
  '/dashboard': { breadcrumb: 'Boshqaruv', title: 'Dashboard' },
  '/sales': { breadcrumb: 'Operatsiyalar', title: 'Sotuvlar' },
  '/inventory': { breadcrumb: 'Operatsiyalar', title: 'Ombor' },
  '/customers': { breadcrumb: 'CRM', title: 'Mijozlar' },
  '/credit': { breadcrumb: 'Moliya', title: 'Nasiya' },
  '/reports': { breadcrumb: 'Tahlil', title: 'Hisobotlar' },
  '/audit': { breadcrumb: 'Tahlil', title: 'Audit log' },
  '/users': { breadcrumb: 'Boshqaruv', title: 'Xodimlar' },
  '/branches': { breadcrumb: 'Boshqaruv', title: 'Filiallar' },
  '/settings': { breadcrumb: 'Boshqaruv', title: 'Sozlamalar' },
  // Staff routes
  '/pos': { breadcrumb: 'Kassa', title: 'Yangi Sotuv' },
  '/staff': { breadcrumb: 'Ish Stoli', title: 'Kassa' },
  '/staff/sales': { breadcrumb: 'Savdolar', title: 'Tarix' },
  '/staff/inventory': { breadcrumb: 'Ombor', title: 'Qoldiqlar' },
  '/staff/customers': { breadcrumb: 'Mijozlar', title: 'Baza' },
  '/staff/credit': { breadcrumb: 'Nasiyalar', title: 'Qarzlar' },
};

export function Topbar({ user }: { user?: any }) {
  const pathname = usePathname();
  const meta = pageTitles[pathname] ?? {
    breadcrumb: 'Sahifa',
    title: 'Dashboard',
  };
  const { setIsOpen } = useSidebar();

  return (
    <header className="flex h-16 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-background)]/80 px-4 md:px-6 backdrop-blur-md">
      {/* Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsOpen(true)}
          className="md:hidden rounded-md p-2 -ml-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]"
        >
          <Menu size={24} />
        </button>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
            {meta.breadcrumb}
          </div>
          <h1 className="font-display text-xl md:text-2xl leading-none">{meta.title}</h1>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {/* Live indicator */}
        <div className="flex items-center gap-2 rounded-full border border-[var(--color-success)]/30 bg-[var(--color-success)]/10 px-2.5 sm:px-3.5 py-1.5 text-xs font-semibold text-[var(--color-success)]">
          <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-[var(--color-success)] shadow-[0_0_12px_var(--color-success)]" />
          <span className="hidden sm:inline">Real-time</span>
        </div>

        {/* Notification button */}
        <button className="relative flex h-[38px] w-[38px] items-center justify-center rounded-[10px] border border-[var(--color-border)] bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] transition-all duration-180 ease-spring hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-foreground)]">
          <Bell size={18} />
          <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-[var(--color-background)] bg-[var(--color-danger)] px-1 text-[10px] font-bold text-white">
            3
          </span>
        </button>

        {/* Export button */}
        <button className="flex h-[38px] w-[38px] items-center justify-center rounded-[10px] border border-[var(--color-border)] bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] transition-all duration-180 ease-spring hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-foreground)]">
          <Download size={18} />
        </button>
      </div>
    </header>
  );
}
