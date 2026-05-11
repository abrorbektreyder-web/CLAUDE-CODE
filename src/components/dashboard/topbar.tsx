'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, Download, Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useSidebar } from '@/components/dashboard/sidebar-provider';
import { Clock } from '@/components/dashboard/clock';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

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
  const { setIsOpen: setIsSidebarOpen } = useSidebar();
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Close notifications when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const notifications = [
    { id: 1, type: 'inventory', title: 'Kam qolgan tovar', message: 'iPhone 15 Pro Max omborda 2 ta qoldi.', time: '10 daqiqa oldin' },
    { id: 2, type: 'credit', title: 'Yangi nasiya', message: 'Alijon Karimov 1,200,000 so\'m nasiya oldi.', time: '1 soat oldin' },
    { id: 3, type: 'system', title: 'Yangi filial', message: 'Beruniy filiali tizimga muvaffaqiyatli qo\'shildi.', time: '3 soat oldin' },
  ];

  const handleToggleNotifications = () => {
    if (!showNotifications) {
      setUnreadCount(0); // Mark all as read when opening
    }
    setShowNotifications(!showNotifications);
  };

  const handleExport = () => {
    const data = [
      ['Ko\'rsatkich', 'Qiymat'],
      ['Bugungi Savdo', '0 so\'m'],
      ['Sotuvlar Soni', '0'],
      ['Sof Foyda', '0 so\'m'],
      ['Aktiv Qarzlar', '1,200 so\'m'],
      ['Sana', new Date().toLocaleDateString('uz-UZ')],
    ];
    
    const csvContent = data.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `dashboard_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-background)]/80 px-4 md:px-6 backdrop-blur-md relative z-40">
      {/* Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="md:hidden rounded-md p-2 -ml-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]"
        >
          <Menu size={24} />
        </button>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
            {meta.breadcrumb}
          </div>
          <h1 className="font-display text-lg sm:text-xl md:text-2xl leading-none">{meta.title}</h1>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Clock />

        {/* Live indicator */}
        <div className="hidden sm:flex items-center gap-2 rounded-full border border-[var(--color-success)]/30 bg-[var(--color-success)]/10 px-2.5 sm:px-3.5 py-1.5 text-xs font-semibold text-[var(--color-success)]">
          <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-[var(--color-success)] shadow-[0_0_12px_var(--color-success)]" />
          <span className="hidden sm:inline">Real-time</span>
        </div>

        {/* Notification button */}
        <div className="relative" ref={notificationRef}>
          <button 
            onClick={handleToggleNotifications}
            className={cn(
              "relative flex h-[38px] w-[38px] items-center justify-center rounded-[10px] border border-[var(--color-border)] bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] transition-all duration-180 ease-spring hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-foreground)]",
              showNotifications && "bg-[var(--color-bg-hover)] text-[var(--color-foreground)] border-[var(--color-accent)]/50"
            )}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-[var(--color-background)] bg-[var(--color-danger)] px-1 text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-2 w-[280px] sm:w-[320px] rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-2 shadow-2xl backdrop-blur-xl"
              >
                <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--color-border)]/50 mb-1">
                  <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-tertiary)]">Bildirishnomalar</span>
                  <span className="text-[10px] text-[var(--color-accent)] hover:underline cursor-pointer">Barchasi</span>
                </div>
                <div className="flex flex-col gap-1 max-h-[400px] overflow-y-auto pr-1">
                  {notifications.map((n) => (
                    <div key={n.id} className="group p-3 rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors cursor-pointer border border-transparent hover:border-[var(--color-border)]/50">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-white group-hover:text-[var(--color-accent)] transition-colors">{n.title}</span>
                        <span className="text-[9px] text-[var(--color-text-tertiary)]">{n.time}</span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-[var(--color-text-secondary)]">{n.message}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Export button */}
        <button 
          onClick={handleExport}
          className="flex h-[38px] w-[38px] items-center justify-center rounded-[10px] border border-[var(--color-border)] bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] transition-all duration-180 ease-spring hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-foreground)]"
          title="Hisobotni yuklab olish"
        >
          <Download size={18} />
        </button>
      </div>
    </header>
  );
}
