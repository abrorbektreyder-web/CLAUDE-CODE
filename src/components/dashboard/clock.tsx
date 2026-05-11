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
    <div className="flex items-center gap-1 sm:gap-2 font-mono text-[10px] sm:text-[13px] font-bold tracking-tight sm:tracking-widest text-white/90 bg-white/5 backdrop-blur-md px-1.5 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)] hover:border-[var(--color-accent)]/30 transition-colors">
      <div className="flex items-center gap-0.5">
        <TimeUnit value={hours} />
        <span className="text-[var(--color-accent)] animate-pulse opacity-80">:</span>
        <TimeUnit value={minutes} />
        <span className="hidden min-[380px]:inline text-[var(--color-accent)] animate-pulse opacity-80">:</span>
        <div className="hidden min-[380px]:flex">
          <TimeUnit value={seconds} />
        </div>
      </div>
      <div className="hidden sm:flex items-center gap-1 ml-1.5 pl-1.5 border-l border-white/10">
        <div className="h-1 w-1 rounded-full bg-[var(--color-accent)] animate-pulse" />
        <span className="text-[9px] uppercase tracking-tighter text-white/40">UZB</span>
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
