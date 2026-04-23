'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutGrid,
  ShoppingCart,
  Package,
  Users,
  CreditCard,
  BarChart3,
  Activity,
  UserCog,
  MapPin,
  Settings,
  ChevronDown,
  MoreVertical,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  user: {
    name: string;
    email: string;
  };
}

const navigation = [
  {
    section: 'Asosiy',
    items: [
      { href: '/dashboard', icon: LayoutGrid, label: 'Dashboard' },
      { href: '/sales', icon: ShoppingCart, label: 'Sotuvlar' },
      { href: '/inventory', icon: Package, label: 'Ombor' },
      { href: '/customers', icon: Users, label: 'Mijozlar' },
      { href: '/credit', icon: CreditCard, label: 'Nasiya' },
    ],
  },
  {
    section: 'Tahlil',
    items: [
      { href: '/reports', icon: BarChart3, label: 'Hisobotlar' },
      { href: '/audit', icon: Activity, label: 'Audit log' },
    ],
  },
  {
    section: 'Boshqaruv',
    items: [
      { href: '/users', icon: UserCog, label: 'Xodimlar' },
      { href: '/branches', icon: MapPin, label: 'Filiallar' },
      { href: '/settings', icon: Settings, label: 'Sozlamalar' },
    ],
  },
];

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <aside className="flex w-[248px] flex-col border-r border-[var(--color-border)] bg-[var(--color-bg-elevated)]">
      {/* Header */}
      <div className="border-b border-[var(--color-border)] p-5">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-gradient-to-br from-[var(--color-accent)] to-orange-400 font-bold text-white shadow-[0_0_24px_rgba(255,107,53,0.25)]">
            M
          </div>
          <div className="leading-tight">
            <div className="font-display text-lg">Mobile</div>
            <div className="text-[9px] font-bold uppercase tracking-[0.15em] text-[var(--color-text-tertiary)]">
              Premium POS
            </div>
          </div>
        </Link>

        {/* Tenant switcher */}
        <button className="mt-4 flex w-full items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-3 transition-colors duration-180 ease-spring hover:bg-[var(--color-bg-hover)]">
          <div className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-gradient-to-br from-[var(--color-info)] to-[var(--color-purple)] text-xs font-bold text-white">
            MC
          </div>
          <div className="flex-1 overflow-hidden text-left">
            <div className="truncate text-sm font-semibold">Mobi Center</div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
              Pro · 2 filial
            </div>
          </div>
          <ChevronDown
            size={14}
            className="flex-shrink-0 text-[var(--color-text-tertiary)]"
          />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3">
        {navigation.map((group) => (
          <div key={group.section} className="mb-5">
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">
              {group.section}
            </div>
            {group.items.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'relative mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-180 ease-spring',
                    isActive
                      ? 'bg-[var(--color-bg-card)] font-semibold text-[var(--color-foreground)]'
                      : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-card)] hover:text-[var(--color-foreground)]'
                  )}
                >
                  {isActive && (
                    <span className="absolute -left-[14px] top-1/2 h-[18px] w-[3px] -translate-y-1/2 rounded-r-[3px] bg-[var(--color-accent)] shadow-[0_0_12px_rgba(255,107,53,0.5)]" />
                  )}
                  <item.icon
                    size={16}
                    className={cn(
                      'flex-shrink-0',
                      isActive
                        ? 'text-[var(--color-accent)]'
                        : 'text-[var(--color-text-tertiary)]'
                    )}
                  />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User block */}
      <div className="border-t border-[var(--color-border)] p-4">
        <button className="flex w-full items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-3 transition-colors duration-180 ease-spring hover:bg-[var(--color-bg-hover)]">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-accent)] to-orange-400 text-xs font-bold text-white">
            {initials}
          </div>
          <div className="flex-1 overflow-hidden text-left">
            <div className="truncate text-sm font-semibold">{user.name}</div>
            <div className="truncate text-[11px] text-[var(--color-text-tertiary)]">
              {user.email}
            </div>
          </div>
          <MoreVertical
            size={14}
            className="flex-shrink-0 text-[var(--color-text-tertiary)]"
          />
        </button>
      </div>
    </aside>
  );
}
