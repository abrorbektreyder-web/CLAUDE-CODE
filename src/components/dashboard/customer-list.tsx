'use client';

import { useState } from 'react';
import { 
  Search, 
  Plus, 
  User, 
  Phone, 
  CreditCard, 
  ShoppingBag,
  MoreVertical,
  ArrowUpRight,
  UserPlus
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CustomerItem {
  id: string;
  fullName: string;
  phoneLastFour: string | null;
  totalSpent: string;
  totalDebts: string;
  lastPurchaseAt: Date | null;
  isActive: boolean;
  createdAt: Date;
}

interface CustomerListProps {
  initialData: CustomerItem[];
}

export function CustomerList({ initialData }: CustomerListProps) {
  const [search, setSearch] = useState('');

  const filteredData = initialData.filter(item => 
    item.fullName.toLowerCase().includes(search.toLowerCase()) ||
    (item.phoneLastFour?.includes(search) ?? false)
  );

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat('uz-UZ').format(Number(price));
  };

  const formatDate = (date: Date | null) => {
    if (!date) return `Hali savdo yo'q`;
    return new Intl.DateTimeFormat('uz-UZ', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    }).format(new Date(date));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl">Mijozlar</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">Sodiq mijozlar va qarzdorliklar bazasi</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[var(--color-accent)]/20 transition-all hover:bg-[var(--color-accent-hover)]">
            <UserPlus size={18} />
            Yangi mijoz
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="premium-card rounded-2xl p-5">
          <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">Jami mijozlar</div>
          <div className="text-2xl font-bold">{initialData.length} <span className="text-xs font-normal text-[var(--color-text-tertiary)]">nafar</span></div>
        </div>
        <div className="premium-card rounded-2xl p-5">
          <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">Umumiy savdo</div>
          <div className="text-2xl font-bold text-[var(--color-success)]">
            {formatPrice(initialData.reduce((acc, i) => acc + Number(i.totalSpent), 0).toString())}
            <span className="text-xs font-normal text-[var(--color-text-tertiary)] ml-1">so'm</span>
          </div>
        </div>
        <div className="premium-card rounded-2xl p-5">
          <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">Umumiy qarzlar</div>
          <div className="text-2xl font-bold text-[var(--color-danger)]">
            {formatPrice(initialData.reduce((acc, i) => acc + Number(i.totalDebts), 0).toString())}
            <span className="text-xs font-normal text-[var(--color-text-tertiary)] ml-1">so'm</span>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="premium-card overflow-hidden rounded-2xl">
        <div className="flex items-center gap-4 border-b border-[var(--color-border)] p-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]" size={18} />
            <input 
              type="text" 
              placeholder="Ism yoki telefon raqami bo'yicha qidirish..." 
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
                <th className="px-6 py-4">Xaridlar summasi</th>
                <th className="px-6 py-4">Qarzdorlik</th>
                <th className="px-6 py-4">Oxirgi xarid</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {filteredData.length > 0 ? filteredData.map((customer) => {
                const debt = Number(customer.totalDebts);
                const isDebtor = debt > 0;

                return (
                  <tr key={customer.id} className="group transition-colors hover:bg-[var(--color-bg-hover)]">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20 text-blue-600">
                          <User size={20} />
                        </div>
                        <div>
                          <div className="font-semibold">{customer.fullName}</div>
                          <div className="flex items-center gap-1 text-[10px] text-[var(--color-text-tertiary)] font-bold uppercase">
                            <Phone size={10} />
                            +998 ** *** *{customer.phoneLastFour}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold">{formatPrice(customer.totalSpent)}</div>
                      <div className="text-[10px] text-[var(--color-text-tertiary)] uppercase font-bold">SO'M</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={cn("font-bold", isDebtor ? "text-[var(--color-danger)]" : "text-[var(--color-text-tertiary)]")}>
                        {formatPrice(customer.totalDebts)}
                      </div>
                      <div className="text-[10px] text-[var(--color-text-tertiary)] uppercase font-bold">SO'M</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{formatDate(customer.lastPurchaseAt)}</div>
                      <div className="text-[10px] text-[var(--color-text-tertiary)] uppercase font-bold">SANA</div>
                    </td>
                    <td className="px-6 py-4">
                      {customer.isActive ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-success)]/10 px-2.5 py-0.5 text-[10px] font-bold text-[var(--color-success)] border border-[var(--color-success)]/20">
                          Aktiv
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-bg-elevated)] px-2.5 py-0.5 text-[10px] font-bold text-[var(--color-text-tertiary)] border border-[var(--color-border)]">
                          Bloklangan
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="rounded-lg p-2 text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-foreground)] transition-colors">
                        <MoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[var(--color-text-tertiary)]">
                    <div className="flex flex-col items-center gap-2">
                      <User size={40} className="opacity-20" />
                      <p>Mijoz topilmadi</p>
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
