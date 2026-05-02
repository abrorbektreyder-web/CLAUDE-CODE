'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  startOfWeek, 
  startOfMonth, 
  endOfMonth, 
  endOfDay, 
  startOfDay,
  setMonth,
  setYear,
  getYear,
  getMonth
} from 'date-fns';

export type DateRangeType = 'today' | 'week' | 'month' | 'custom';

interface DateFilterProps {
  onRangeChange: (range: { start: Date; end: Date }) => void;
  onRangeTypeChange?: (type: DateRangeType) => void;
  className?: string;
}

export function DateFilter({ onRangeChange, onRangeTypeChange, className }: DateFilterProps) {
  const [activeRange, setActiveRange] = useState<DateRangeType>('month');
  const [showPicker, setShowPicker] = useState(false);
  const [selectedYear, setSelectedYear] = useState(getYear(new Date()));
  const [selectedMonth, setSelectedMonth] = useState(getMonth(new Date()));
  
  const pickerRef = useRef<HTMLDivElement>(null);

  const months = [
    'Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 
    'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'
  ];

  const monthsFull = [
    'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 
    'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'
  ];

  // Close picker on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRangeSelect = (rangeId: DateRangeType) => {
    setActiveRange(rangeId);
    onRangeTypeChange?.(rangeId);
    setShowPicker(false);
    let start = new Date();
    let end = endOfDay(new Date());

    if (rangeId === 'today') {
      start = startOfDay(new Date());
    } else if (rangeId === 'week') {
      start = startOfWeek(new Date(), { weekStartsOn: 1 });
    } else if (rangeId === 'month') {
      start = startOfMonth(new Date());
    }

    onRangeChange({ start, end });
  };

  const handleCustomMonthSelect = (monthIdx: number) => {
    setSelectedMonth(monthIdx);
    setActiveRange('custom');
    onRangeTypeChange?.('custom');
    
    const date = setYear(setMonth(new Date(), monthIdx), selectedYear);
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    
    onRangeChange({ start, end });
    setShowPicker(false);
  };

  const activeLabel = activeRange === 'custom' 
    ? `${monthsFull[selectedMonth]}, ${selectedYear}`
    : activeRange === 'today' ? 'Bugun' 
    : activeRange === 'week' ? 'Haftalik' 
    : 'Oylik';

  return (
    <div className={cn("flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto", className)}>
      {/* Row: Segmented + Calendar */}
      <div className="flex items-center gap-2 w-full sm:w-auto">
        {/* Segmented Control */}
        <div className="flex flex-1 sm:flex-none p-1 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl shadow-sm relative overflow-hidden">
          {/* Sliding indicator */}
          <div 
            className="absolute top-1 bottom-1 transition-all duration-300 ease-out bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg shadow-[0_2px_8px_rgba(249,115,22,0.3)] z-0"
            style={{
              width: 'calc(33.33% - 3px)',
              left: activeRange === 'today' ? '4px' 
                : activeRange === 'week' ? 'calc(33.33% + 1px)' 
                : activeRange === 'month' ? 'calc(66.66% - 1px)' 
                : '-100%',
              opacity: activeRange === 'custom' ? 0 : 1
            }}
          />
          {[
            { id: 'today', label: 'Kun' },
            { id: 'week', label: 'Hafta' },
            { id: 'month', label: 'Oy' },
          ].map((range) => (
            <button
              key={range.id}
              onClick={() => handleRangeSelect(range.id as DateRangeType)}
              className={cn(
                "relative flex-1 sm:flex-none sm:w-[60px] md:w-[68px] py-2 text-[11px] font-bold transition-colors duration-300 rounded-lg z-10 text-center touch-manipulation",
                activeRange === range.id ? "text-white" : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
              )}
            >
              {range.label}
            </button>
          ))}
        </div>

        {/* Calendar Button */}
        <div className="relative" ref={pickerRef}>
          <button 
            onClick={() => setShowPicker(!showPicker)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 bg-[var(--color-bg-card)] border rounded-xl text-[11px] font-bold transition-all group whitespace-nowrap touch-manipulation",
              activeRange === 'custom' 
                ? "border-orange-500 text-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.12)]" 
                : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]"
            )}
          >
            <CalendarIcon size={14} className={cn(
              "shrink-0 transition-transform group-hover:scale-110", 
              activeRange === 'custom' ? "text-orange-500" : "text-[var(--color-accent)]"
            )} />
            <span className="hidden sm:inline">
              {activeRange === 'custom' ? `${months[selectedMonth]}, ${selectedYear}` : 'Kalendar'}
            </span>
            <ChevronDown size={12} className={cn(
              "shrink-0 transition-transform duration-300", 
              showPicker && "rotate-180"
            )} />
          </button>

          {/* Dropdown Picker — Full-screen on mobile, positioned on desktop */}
          {showPicker && (
            <>
              {/* Mobile: Fullscreen overlay backdrop */}
              <div 
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 sm:hidden" 
                onClick={() => setShowPicker(false)} 
              />
              
              <div className={cn(
                "bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl shadow-2xl p-5 z-50 animate-in fade-in zoom-in-95 duration-200",
                // Mobile: Fixed at bottom like a sheet
                "fixed bottom-0 left-0 right-0 rounded-b-none sm:rounded-2xl",
                // Desktop: Absolute dropdown
                "sm:absolute sm:top-full sm:right-0 sm:bottom-auto sm:left-auto sm:mt-2 sm:w-80"
              )}>
                {/* Drag indicator for mobile */}
                <div className="flex justify-center mb-4 sm:hidden">
                  <div className="w-10 h-1 rounded-full bg-[var(--color-border)]" />
                </div>

                {/* Year Selector */}
                <div className="flex items-center justify-between mb-5 px-1">
                  <button 
                    onClick={() => setSelectedYear(y => y - 1)}
                    className="p-2 rounded-xl hover:bg-[var(--color-bg-hover)] transition-colors touch-manipulation"
                    aria-label="Oldingi yil"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <div className="text-base font-bold tracking-tight">{selectedYear} - yil</div>
                  <button 
                    onClick={() => setSelectedYear(y => y + 1)}
                    className="p-2 rounded-xl hover:bg-[var(--color-bg-hover)] transition-colors touch-manipulation"
                    aria-label="Keyingi yil"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>

                {/* Months Grid */}
                <div className="grid grid-cols-3 gap-2">
                  {monthsFull.map((month, idx) => (
                    <button
                      key={month}
                      onClick={() => handleCustomMonthSelect(idx)}
                      className={cn(
                        "py-3 text-xs font-bold rounded-xl transition-all border touch-manipulation",
                        selectedMonth === idx && activeRange === 'custom'
                          ? "bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/20 scale-[1.02]"
                          : getMonth(new Date()) === idx && getYear(new Date()) === selectedYear
                            ? "border-orange-500/30 bg-orange-500/5 text-orange-500"
                            : "border-transparent hover:border-[var(--color-border)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)]"
                      )}
                    >
                      {month}
                    </button>
                  ))}
                </div>

                {/* Quick Actions */}
                <div className="mt-4 pt-4 border-t border-[var(--color-border)] flex gap-2">
                  <button 
                    onClick={() => handleRangeSelect('month')}
                    className="flex-1 py-2.5 text-xs font-bold text-orange-500 hover:bg-orange-500/5 rounded-xl transition-all border border-orange-500/20 touch-manipulation"
                  >
                    Joriy oyga qaytish
                  </button>
                  <button 
                    onClick={() => setShowPicker(false)}
                    className="flex-1 py-2.5 text-xs font-bold text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-hover)] rounded-xl transition-all border border-[var(--color-border)] touch-manipulation sm:hidden"
                  >
                    Yopish
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Active filter badge — shown on mobile too for context */}
      {activeRange === 'custom' && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-500/5 rounded-xl border border-orange-500/10 w-fit">
          <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
          <span className="text-[10px] uppercase tracking-wider font-bold text-orange-500/90">
            {monthsFull[selectedMonth]} hisoboti
          </span>
        </div>
      )}
    </div>
  );
}
