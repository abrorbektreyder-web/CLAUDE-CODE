'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';

export function DashboardFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPeriod = searchParams.get('period') || 'today';

  const periods = [
    { id: 'today', label: 'Bugun' },
    { id: 'week', label: 'Hafta' },
    { id: 'month', label: 'Oy' },
  ];

  const handlePeriodChange = (period: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('period', period);
    router.push(`/dashboard?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex items-center gap-1 p-1 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl relative overflow-hidden">
      {periods.map((period) => (
        <button
          key={period.id}
          onClick={() => handlePeriodChange(period.id)}
          className={`relative px-5 py-2.5 text-xs font-bold transition-all duration-300 z-10 ${
            currentPeriod === period.id
              ? 'text-white'
              : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-foreground)]'
          }`}
        >
          {period.label}
          {currentPeriod === period.id && (
            <motion.div
              layoutId="active-period"
              className="absolute inset-0 bg-[var(--color-accent)] rounded-lg shadow-lg shadow-[var(--color-accent)]/25 -z-10"
              transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
            />
          )}
        </button>
      ))}
    </div>
  );
}
