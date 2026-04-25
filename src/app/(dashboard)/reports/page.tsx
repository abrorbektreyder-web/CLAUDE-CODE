'use client';
import { BarChart3, Download, Calendar } from 'lucide-react';

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">Hisobotlar</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">Kengaytirilgan moliyaviy va savdo tahlillari</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-2.5 text-sm font-semibold transition-all hover:bg-[var(--color-bg-hover)] active:scale-95">
            <Calendar size={18} /> Oxirgi 30 kun
          </button>
          <button className="flex items-center gap-2 rounded-xl bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[var(--color-accent)]/20 transition-all hover:bg-[var(--color-accent-hover)] active:scale-95">
            <Download size={18} /> Eksport
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Umumiy tushum', value: '145,500,000 UZS', trend: '+15%' },
          { label: 'Sof foyda', value: '32,400,000 UZS', trend: '+8%' },
          { label: 'Sotilgan tovarlar', value: '450 ta', trend: '+24%' },
          { label: 'Yangi mijozlar', value: '124 kishi', trend: '+12%' }
        ].map((stat, i) => (
          <div key={i} className="premium-card rounded-2xl p-5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)] mb-2">{stat.label}</div>
            <div className="flex items-end gap-2">
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-xs font-bold text-[var(--color-success)] ml-auto bg-[var(--color-success)]/10 px-1.5 py-0.5 rounded-md">{stat.trend}</div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="premium-card rounded-2xl p-8 min-h-[400px] flex flex-col items-center justify-center text-[var(--color-text-tertiary)]">
        <BarChart3 size={64} className="opacity-20 mb-4" />
        <h3 className="text-lg font-bold">Grafik va Diagrammalar</h3>
        <p className="text-sm">Tez orada batafsil tahliliy grafiklar qo'shiladi</p>
      </div>
    </div>
  );
}
