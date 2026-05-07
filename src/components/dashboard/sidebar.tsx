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
  X,
  Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/components/dashboard/sidebar-provider';
import { motion } from 'framer-motion';

interface SidebarProps {
  user: {
    name: string;
    email: string;
    role?: string;
  };
  tenant?: {
    businessName: string;
    plan: string;
  } | null;
}

const navigation = [
  {
    section: 'Asosiy',
    items: [
      { href: '/dashboard', icon: LayoutGrid, label: 'Dashboard' },
      { href: '/sales', icon: ShoppingCart, label: 'Sotuvlar' },
      { href: '/inventory', icon: Package, label: 'Ombor' },
      { href: '/customers', icon: Users, label: 'Mijozlar' },
      { href: '/suppliers', icon: Users, label: 'Ta\'minotchilar' },
      { href: '/credit', icon: CreditCard, label: 'Nasiya' },
    ],
  },
  {
    section: 'Tahlil',
    items: [
      { href: '/reports', icon: BarChart3, label: 'Hisobotlar' },
      { href: '/finance', icon: Wallet, label: 'Finance Pro' },
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

export function Sidebar({ user, tenant }: SidebarProps) {
  const pathname = usePathname();
  const { isOpen, setIsOpen } = useSidebar();

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

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
          'fixed inset-y-0 left-0 z-50 flex w-[248px] flex-col border-r border-[var(--color-border)] bg-[var(--color-bg-elevated)] transition-transform duration-300 ease-in-out md:static md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header - Ultra Minimalist Design */}
        <div className="px-6 py-10 relative border-b border-[var(--color-border)]/40">
          <Link href="/dashboard" className="group block relative">
            <div className="font-display text-3xl font-black tracking-tight uppercase leading-none pb-1">
              <span className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-orange-300 transition-all duration-500">
                APPLE TTT
              </span>
            </div>
            
            {/* Creative Automated Underline Animation */}
            <div className="absolute -bottom-2 left-0 w-full h-[2px] overflow-hidden rounded-full">
              <motion.div 
                className="h-full bg-gradient-to-r from-transparent via-orange-500 to-transparent w-1/3"
                animate={{ 
                  left: ['-100%', '100%'] 
                }}
                transition={{ 
                  duration: 2.5, 
                  repeat: Infinity, 
                  repeatDelay: 1,
                  ease: "easeInOut" 
                }}
                style={{ position: 'absolute' }}
              />
            </div>
          </Link>
          <button
            onClick={() => setIsOpen(false)}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-md p-1 text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-hover)] md:hidden"
          >
            <X size={20} />
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
    </>
  );
}
