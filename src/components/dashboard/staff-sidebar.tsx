'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutGrid,
  ShoppingCart,
  Package,
  Users,
  CreditCard,
  X,
  LogOut,
  HelpCircle,
  Receipt
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/components/dashboard/sidebar-provider';
import { authClient } from '@/lib/auth-client';

interface StaffSidebarProps {
  user?: {
    name: string;
    email: string;
    role?: string;
  };
  tenantName?: string;
}

const navigation = [
  {
    section: 'Ish Muhiti',
    items: [
      { href: '/staff/pos', icon: LayoutGrid, label: 'Kassa (POS)' },
      { href: '/staff/sales', icon: Receipt, label: 'Savdolar' },
      { href: '/staff/inventory', icon: Package, label: 'Ombor' },
    ],
  },
  {
    section: 'Moliya & Mijoz',
    items: [
      { href: '/staff/customers', icon: Users, label: 'Mijozlar' },
      { href: '/staff/credit', icon: CreditCard, label: 'Nasiya' },
    ],
  },
];

export function StaffSidebar({ user, tenantName }: StaffSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isOpen, setIsOpen } = useSidebar();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'K';

  const handleLogout = async () => {
    await authClient.signOut();
    router.push('/cashier-login');
  };

  if (!mounted) return null;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-[var(--color-border)] bg-[var(--color-bg-elevated)] transition-transform duration-300 ease-in-out md:static md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="border-b border-[var(--color-border)] p-5 relative">
          <Link href="/staff/pos" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-gradient-to-br from-emerald-500 to-teal-600 font-bold text-white shadow-[0_4px_12px_rgba(16,185,129,0.3)]">
              K
            </div>
            <div className="leading-tight">
              <div className="font-display text-lg truncate max-w-[140px] tracking-tight font-bold">
                {tenantName || 'APPLE TTT'}
              </div>
              <div className="text-[9px] font-black uppercase tracking-[0.15em] text-emerald-500">
                Kassir Paneli
              </div>
            </div>
          </Link>
          <button
            onClick={() => setIsOpen(false)}
            className="absolute right-4 top-4 rounded-md p-1 text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-hover)] md:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {navigation.map((group) => (
            <div key={group.section} className="mb-6">
              <div className="px-3 pb-3 text-[10px] font-black uppercase tracking-[0.15em] text-[var(--color-text-tertiary)] opacity-50">
                {group.section}
              </div>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href || (item.href !== '/pos' && pathname.startsWith(item.href));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 group',
                        isActive
                          ? 'bg-[var(--color-bg-card)] text-[var(--color-foreground)] shadow-sm'
                          : 'text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-card)]/50 hover:text-[var(--color-foreground)]'
                      )}
                    >
                      {isActive && (
                        <span className="absolute -left-[16px] top-1/2 h-[20px] w-[3px] -translate-y-1/2 rounded-r-[3px] bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]" />
                      )}
                      <item.icon
                        size={18}
                        className={cn(
                          'transition-colors duration-200',
                          isActive
                            ? 'text-emerald-500'
                            : 'text-[var(--color-text-tertiary)] group-hover:text-[var(--color-foreground)]'
                        )}
                      />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 space-y-2 border-t border-[var(--color-border)] bg-[var(--color-bg-card)]/30">
          <Link 
            href="/help"
            className="flex items-center gap-3 px-3 py-2 text-sm font-semibold text-[var(--color-text-tertiary)] hover:text-emerald-500 transition-colors"
          >
            <HelpCircle size={18} />
            Yordam
          </Link>
          
          <button 
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-3 transition-all duration-300 hover:bg-red-500/5 hover:border-red-500/20 group"
          >
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 text-xs font-bold text-[var(--color-text-secondary)] transition-all duration-300 group-hover:from-red-500 group-hover:to-red-600 group-hover:text-white group-hover:rotate-[360deg]">
              {initials}
            </div>
            <div className="flex-1 overflow-hidden text-left">
              <div className="truncate text-sm font-bold leading-none mb-1 group-hover:text-red-500 transition-colors">{user?.name || 'Kassir'}</div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <div className="truncate text-[10px] font-black uppercase text-emerald-500/90 tracking-wider">
                  Smenada
                </div>
              </div>
            </div>
            <LogOut
              size={16}
              className="flex-shrink-0 text-[var(--color-text-tertiary)] group-hover:text-red-500 transition-all group-hover:translate-x-1"
            />
          </button>
        </div>
      </aside>
    </>
  );
}
