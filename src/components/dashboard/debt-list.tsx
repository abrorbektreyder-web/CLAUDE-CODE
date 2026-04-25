'use client';

import { useState } from 'react';
import { 
  Search, 
  CreditCard, 
  Calendar, 
  AlertCircle, 
  Clock, 
  CheckCircle2,
  MoreHorizontal,
  ChevronRight,
  HandCoins
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DebtItem {
  id: string;
  customerName: string;
  totalAmount: string;
  remainingAmount: string;
  monthlyPayment: string;
  nextPaymentDate: string | null;
  isOverdue: boolean;
  status: string;
  createdAt: Date;
}

interface DebtListProps {
  initialData: DebtItem[];
}

export function DebtList({ initialData }: DebtListProps) {
  const [search, setSearch] = useState('');

  const filteredData = initialData.filter(item => 
    item.customerName.toLowerCase().includes(search.toLowerCase())
  );

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat('uz-UZ').format(Number(price));
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Intl.DateTimeFormat('uz-UZ', { 
      day: 'numeric', 
      month: 'short',
    }).format(new Date(dateStr));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl">Nasiya</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">Kredit savdolari va to'lovlar grafigi</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[var(--color-accent)]/20 transition-all hover:bg-[var(--color-accent-hover)]">
            <HandCoins size={18} />
            To'lov qabul qilish
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="premium-card rounded-2xl p-5">
          <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">Jami nasiya</div>
          <div className="text-2xl font-bold">
            {formatPrice(initialData.reduce((acc, i) => acc + Number(i.remainingAmount), 0).toString())}
            <span className="text-xs font-normal text-[var(--color-text-tertiary)] ml-1">so'm</span>
          </div>
        </div>
        <div className="premium-card rounded-2xl p-5 border-l-4 border-l-[var(--color-danger)]">
          <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">Muddati o'tgan</div>
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold text-[var(--color-danger)]">
              {initialData.filter(i => i.isOverdue).length}
            </div>
            <AlertCircle size={16} className="text-[var(--color-danger)]" />
          </div>
        </div>
        <div className="premium-card rounded-2xl p-5">
          <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">Bugun kutilayotgan</div>
          <div className="text-2xl font-bold text-[var(--color-info)]">~ 4.5 mln</div>
        </div>
        <div className="premium-card rounded-2xl p-5">
          <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">Yopilgan nasiyalar</div>
          <div className="text-2xl font-bold">{initialData.filter(i => i.status === 'paid').length}</div>
        </div>
      </div>

      {/* Table Section */}
      <div className="premium-card overflow-hidden rounded-2xl">
        <div className="p-4 border-b border-[var(--color-border)]">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]" size={18} />
            <input 
              type="text" 
              placeholder="Mijoz ismi bo'yicha qidirish..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)]/50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[var(--color-accent)] focus:ring-4 focus:ring-[var(--color-accent)]/10 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-elevated)]/30 text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                <th className="px-6 py-4">Mijoz</th>
                <th className="px-6 py-4">Umumiy summa</th>
                <th className="px-6 py-4">Qoldiq</th>
                <th className="px-6 py-4">Oylik to'lov</th>
                <th className="px-6 py-4">Keyingi sana</th>
                <th className="px-6 py-4">Holat</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {filteredData.length > 0 ? filteredData.map((debt) => {
                const isOverdue = debt.isOverdue;

                return (
                  <tr key={debt.id} className="group transition-colors hover:bg-[var(--color-bg-hover)]">
                    <td className="px-6 py-4 font-semibold">{debt.customerName}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold">{formatPrice(debt.totalAmount)}</div>
                      <div className="text-[10px] text-[var(--color-text-tertiary)] uppercase font-bold">SO'M</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={cn("font-bold", isOverdue ? "text-[var(--color-danger)]" : "text-[var(--color-foreground)]")}>
                        {formatPrice(debt.remainingAmount)}
                      </div>
                      <div className="text-[10px] text-[var(--color-text-tertiary)] uppercase font-bold">SO'M</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold">{formatPrice(debt.monthlyPayment)}</div>
                      <div className="text-[10px] text-[var(--color-text-tertiary)] uppercase font-bold">SO'M / OY</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Calendar size={14} className="text-[var(--color-text-tertiary)]" />
                        {formatDate(debt.nextPaymentDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {isOverdue ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-danger)]/10 px-2.5 py-0.5 text-[10px] font-bold text-[var(--color-danger)] border border-[var(--color-danger)]/20">
                          <Clock size={12} />
                          Muddati o'tgan
                        </span>
                      ) : debt.status === 'paid' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-success)]/10 px-2.5 py-0.5 text-[10px] font-bold text-[var(--color-success)] border border-[var(--color-success)]/20">
                          <CheckCircle2 size={12} />
                          Yopilgan
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-info)]/10 px-2.5 py-0.5 text-[10px] font-bold text-[var(--color-info)] border border-[var(--color-info)]/20">
                          Aktiv
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="flex items-center gap-1 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-bold transition-all hover:bg-[var(--color-bg-elevated)]">
                        Batafsil
                        <ChevronRight size={14} />
                      </button>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-[var(--color-text-tertiary)]">
                    <div className="flex flex-col items-center gap-2">
                      <CreditCard size={40} className="opacity-20" />
                      <p>Nasiya savdolari topilmadi</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
