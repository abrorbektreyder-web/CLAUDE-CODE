'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  ShoppingCart, 
  Package, 
  Receipt, 
  Users,
  LogOut,
  ChevronLeft,
  ChevronRight,
  CreditCard
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { authClient } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';

const menuItems = [
  { icon: ShoppingCart, label: 'Kassa (POS)', href: '/pos' },
  { icon: Package, label: 'Ombor', href: '/staff/inventory' },
  { icon: Receipt, label: 'Savdolar', href: '/staff/sales' },
  { icon: CreditCard, label: 'Nasiyalar', href: '/staff/credit' },
  { icon: Users, label: 'Mijozlar', href: '/staff/customers' },
];

// NOTE: These routes live under /staff/* (not (staff) group) to avoid
// Next.js parallel page conflicts with the (dashboard) route group.

export function StaffSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    await authClient.signOut();
    router.push('/cashier-login');
  };

  if (!mounted) return null;

  return (
    <div 
      className={cn(
        "relative flex flex-col border-r border-[var(--color-border)] bg-[var(--color-bg-card)] transition-all duration-300",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Header */}
      <div className="flex h-20 items-center justify-between px-6">
        {!isCollapsed && (
          <Link href="/pos" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[var(--color-info)] flex items-center justify-center text-white font-bold">
              K
            </div>
            <span className="font-display text-xl font-bold tracking-tight">Kassir</span>
          </Link>
        )}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="rounded-lg p-1.5 hover:bg-[var(--color-bg-elevated)] text-[var(--color-text-tertiary)]"
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                isActive 
                  ? "bg-[var(--color-info)]/10 text-[var(--color-info)] shadow-sm" 
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-foreground)]",
                isCollapsed && "justify-center px-0"
              )}
            >
              <item.icon size={22} className={cn(isActive ? "text-[var(--color-info)]" : "text-[var(--color-text-tertiary)]")} />
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer / User info */}
      <div className="border-t border-[var(--color-border)] p-4">
        <button 
          onClick={handleLogout}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-[var(--color-danger)] hover:bg-[var(--color-danger)]/5 transition-all",
            isCollapsed && "justify-center px-0"
          )}
        >
          <LogOut size={22} />
          {!isCollapsed && <span>Chiqish</span>}
        </button>
      </div>
    </div>
  );
}
