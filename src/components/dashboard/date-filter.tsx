'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronDown, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  format, 
  subDays, 
  startOfWeek, 
  startOfMonth, 
  endOfMonth, 
  isWithinInterval, 
  endOfDay, 
  startOfDay,
  setMonth,
  setYear,
  getYear,
  getMonth
} from 'date-fns';
import { uz } from 'date-fns/locale';

export type DateRangeType = 'today' | 'week' | 'month' | 'custom';

interface DateFilterProps {
  onRangeChange: (range: { start: Date; end: Date }) => void;
  className?: string;
}

export function DateFilter({ onRangeChange, className }: DateFilterProps) {
  const [activeRange, setActiveRange] = useState<DateRangeType>('month');
  const [showPicker, setShowPicker] = useState(false);
  const [selectedYear, setSelectedYear] = useState(getYear(new Date()));
  const [selectedMonth, setSelectedMonth] = useState(getMonth(new Date()));
  
  const pickerRef = useRef<HTMLDivElement>(null);

  const months = [
    'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 
    'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'
  ];

  const years = [2024, 2025, 2026];

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
    
    const date = setYear(setMonth(new Date(), monthIdx), selectedYear);
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    
    onRangeChange({ start, end });
    setShowPicker(false);
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-2 relative", className)}>
      {/* Segmented Control */}
      <div className="flex p-1 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl shadow-sm relative overflow-hidden">
        <div 
          className="absolute h-[calc(100%-8px)] transition-all duration-300 ease-out bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg shadow-[0_2px_8px_rgba(249,115,22,0.3)] z-0"
          style={{
            width: 'calc(33.33% - 4px)',
            left: activeRange === 'today' ? '4px' : activeRange === 'week' ? '33.33%' : activeRange === 'month' ? '66.66%' : '-100%',
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
              "relative px-4 py-1.5 text-[11px] font-bold transition-colors duration-300 rounded-lg z-10 w-16 md:w-20",
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
            "flex items-center gap-2 px-4 py-2 bg-[var(--color-bg-card)] border rounded-xl text-[11px] font-bold transition-all group",
            activeRange === 'custom' 
              ? "border-orange-500 text-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.1)]" 
              : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]"
          )}
        >
          <CalendarIcon size={14} className={cn("transition-transform group-hover:scale-110", activeRange === 'custom' ? "text-orange-500" : "text-[var(--color-accent)]")} />
          <span>{activeRange === 'custom' ? `${months[selectedMonth]}, ${selectedYear}` : 'Kalendar'}</span>
          <ChevronDown size={14} className={cn("transition-transform duration-300", showPicker && "rotate-180")} />
        </button>

        {/* Dropdown Picker */}
        {showPicker && (
          <div className="absolute top-full right-0 mt-2 w-72 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-200">
            {/* Year Selector */}
            <div className="flex items-center justify-between mb-4 px-1">
              <button 
                onClick={() => setSelectedYear(y => y - 1)}
                className="p-1.5 rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="text-sm font-bold tracking-tight">{selectedYear} - yil</div>
              <button 
                onClick={() => setSelectedYear(y => y + 1)}
                className="p-1.5 rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Months Grid */}
            <div className="grid grid-cols-3 gap-2">
              {months.map((month, idx) => (
                <button
                  key={month}
                  onClick={() => handleCustomMonthSelect(idx)}
                  className={cn(
                    "py-2.5 text-[10px] font-bold rounded-xl transition-all border",
                    selectedMonth === idx && activeRange === 'custom'
                      ? "bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/20"
                      : "border-transparent hover:border-[var(--color-border)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)]"
                  )}
                >
                  {month}
                </button>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
              <button 
                onClick={() => handleRangeSelect('month')}
                className="w-full py-2 text-[10px] font-bold text-orange-500 hover:bg-orange-500/5 rounded-xl transition-all"
              >
                Joriy oyga qaytish
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Range Status Badge */}
      <div className="hidden lg:flex items-center gap-2 px-3 py-2 bg-orange-500/5 rounded-xl border border-orange-500/10">
        <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
        <span className="text-[9px] uppercase tracking-widest font-black text-orange-500/90">
          {activeRange === 'today' && "Bugun"}
          {activeRange === 'week' && "Haftalik"}
          {activeRange === 'month' && "Oylik"}
          {activeRange === 'custom' && `${months[selectedMonth]} hisoboti`}
        </span>
      </div>
    </div>
  );
}
