'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function Clock() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!time) return null;

  // Uzbekistan Time (UTC+5)
  // Since the browser might be in a different timezone, we force UTC+5
  const uzTime = new Date(time.getTime() + (time.getTimezoneOffset() + 300) * 60000);
  
  const hours = uzTime.getHours().toString().padStart(2, '0');
  const minutes = uzTime.getMinutes().toString().padStart(2, '0');
  const seconds = uzTime.getSeconds().toString().padStart(2, '0');

  return (
    <div className="hidden lg:flex items-center gap-1.5 font-mono text-[13px] font-bold tracking-widest text-[var(--color-text-secondary)] bg-[var(--color-bg-elevated)]/50 px-3 py-1.5 rounded-lg border border-[var(--color-border)] shadow-inner">
      <div className="flex items-center gap-0.5">
        <TimeUnit value={hours} />
        <span className="text-[var(--color-accent)] animate-pulse">:</span>
        <TimeUnit value={minutes} />
        <span className="text-[var(--color-accent)] animate-pulse">:</span>
        <TimeUnit value={seconds} />
      </div>
      <div className="ml-1 text-[9px] uppercase text-[var(--color-text-tertiary)] bg-[var(--color-bg-card)] px-1.5 py-0.5 rounded border border-[var(--color-border)]">
        UZB
      </div>
    </div>
  );
}

function TimeUnit({ value }: { value: string }) {
  return (
    <div className="relative flex overflow-hidden h-5 w-5 justify-center items-center">
      <AnimatePresence mode="popLayout">
        <motion.span
          key={value}
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -15, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30, mass: 1 }}
          className="absolute text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
