'use client';

import { useState } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  MoreHorizontal, 
  Download, 
  ArrowUpRight, 
  ArrowDownLeft,
  ShoppingCart,
  FileText,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface SaleItem {
  id: string;
  receiptNumber: string | number;
  customerName: string;
  customerPhone: string;
  total: string;
  paymentMethod: string;
  status: string;
  createdAt: string;
}

interface SalesListProps {
  initialData: SaleItem[];
}

export function SalesList({ initialData }: SalesListProps) {
  const [search, setSearch] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const filteredData = initialData.filter(sale => 
    sale.customerName.toLowerCase().includes(search.toLowerCase()) ||
    sale.receiptNumber.toString().includes(search)
  );

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat('uz-UZ').format(Number(price));
  };

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat('uz-UZ', { 
      hour: '2-digit', 
      minute: '2-digit',
      day: 'numeric',
      month: 'short'
    }).format(new Date(dateStr));
  };

  const handleExport = () => {
    // Simple CSV export
    const headers = ['ID', 'Chek №', 'Mijoz', 'Summa', 'To\'lov turi', 'Sana'];
    const rows = filteredData.map(s => [
      s.id,
      s.receiptNumber,
      s.customerName,
      s.total,
      s.paymentMethod,
      s.createdAt
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sotuvlar_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">Sotuvlar</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">Barcha amalga oshirilgan savdolar tarixi va boshqaruvi</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-2.5 text-sm font-semibold transition-all hover:bg-[var(--color-bg-hover)] active:scale-95"
          >
            <Download size={18} />
            Eksport
          </button>
          <Link 
            href="/pos"
            className="flex items-center gap-2 rounded-xl bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[var(--color-accent)]/20 transition-all hover:bg-[var(--color-accent-hover)] active:scale-95"
          >
            <Plus size={18} />
            Yangi savdo
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="premium-card rounded-2xl p-5">
          <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">Bugungi jami savdo</div>
          <div className="flex items-end gap-2">
            <div className="text-2xl font-bold">{formatPrice(initialData.reduce((acc, i) => acc + Number(i.total), 0).toString())}</div>
            <div className="mb-1 text-xs text-[var(--color-text-tertiary)] uppercase font-bold">so'm</div>
            <div className="ml-auto flex items-center gap-1 rounded-md bg-[var(--color-success)]/10 px-1.5 py-0.5 text-[10px] font-bold text-[var(--color-success)]">
              <ArrowUpRight size={12} />
              12%
            </div>
          </div>
        </div>
        <div className="premium-card rounded-2xl p-5">
          <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">Sotilgan tovarlar</div>
          <div className="flex items-end gap-2">
            <div className="text-2xl font-bold">{initialData.length}</div>
            <div className="mb-1 text-xs text-[var(--color-text-tertiary)] uppercase font-bold">dona</div>
            <div className="ml-auto flex items-center gap-1 rounded-md bg-[var(--color-success)]/10 px-1.5 py-0.5 text-[10px] font-bold text-[var(--color-success)]">
              <ArrowUpRight size={12} />
              8 ta
            </div>
          </div>
        </div>
        <div className="premium-card rounded-2xl p-5">
          <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">O'rtacha chek</div>
          <div className="flex items-end gap-2">
            <div className="text-2xl font-bold">
              {initialData.length > 0 
                ? formatPrice((initialData.reduce((acc, i) => acc + Number(i.total), 0) / initialData.length).toFixed(0))
                : 0
              }
            </div>
            <div className="mb-1 text-xs text-[var(--color-text-tertiary)] uppercase font-bold">so'm</div>
            <div className="ml-auto flex items-center gap-1 rounded-md bg-[var(--color-danger)]/10 px-1.5 py-0.5 text-[10px] font-bold text-[var(--color-danger)]">
              <ArrowDownLeft size={12} />
              3%
            </div>
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
              placeholder="Chek raqami, mijoz yoki telefon bo'yicha qidirish..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)]/50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[var(--color-accent)] focus:ring-4 focus:ring-[var(--color-accent)]/10 transition-all"
            />
          </div>
          <button 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={cn(
              "flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all active:scale-95",
              isFilterOpen 
                ? "bg-[var(--color-accent)] text-white border-[var(--color-accent)]" 
                : "bg-[var(--color-bg-card)] border-[var(--color-border)] hover:bg-[var(--color-bg-hover)]"
            )}
          >
            <Filter size={18} />
            Filtr
          </button>
        </div>

        {isFilterOpen && (
          <div className="bg-[var(--color-bg-elevated)]/30 border-b border-[var(--color-border)] p-4 flex gap-4 animate-in slide-in-from-top duration-200">
             <div className="flex flex-col gap-1.5">
               <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">To'lov turi</span>
               <select className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] px-3 py-1.5 text-xs outline-none focus:border-[var(--color-accent)]">
                 <option>Barchasi</option>
                 <option>Naqd</option>
                 <option>Plastik</option>
                 <option>Nasiya</option>
               </select>
             </div>
             <div className="flex flex-col gap-1.5">
               <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">Sana</span>
               <div className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] px-3 py-1.5 text-xs">
                 <Calendar size={14} className="text-[var(--color-text-tertiary)]" />
                 <span>Bugun</span>
               </div>
             </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-elevated)]/30 text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                <th className="px-6 py-4">Chek №</th>
                <th className="px-6 py-4">Mijoz</th>
                <th className="px-6 py-4">Summa</th>
                <th className="px-6 py-4">To'lov turi</th>
                <th className="px-6 py-4">Vaqt</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {filteredData.length > 0 ? filteredData.map((sale) => (
                <tr key={sale.id} className="group transition-colors hover:bg-[var(--color-bg-hover)]">
                  <td className="px-6 py-4 font-mono font-bold text-[var(--color-accent)]">#{sale.receiptNumber}</td>
                  <td className="px-6 py-4">
                    <div className="font-semibold">{sale.customerName}</div>
                    <div className="text-xs text-[var(--color-text-tertiary)]">{sale.customerPhone}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold">{formatPrice(sale.total)}</div>
                    <div className={cn(
                      "text-[10px] font-bold uppercase",
                      sale.status === 'completed' ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"
                    )}>
                      {sale.status === 'completed' ? 'To\'landi' : 'Bekor qilingan'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center rounded-md bg-[var(--color-bg-elevated)] px-2 py-0.5 text-[11px] font-bold border border-[var(--color-border)] uppercase">
                      {sale.paymentMethod}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[var(--color-text-secondary)] whitespace-nowrap">
                    {formatDate(sale.createdAt)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="rounded-lg p-2 text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-foreground)] transition-colors">
                      <MoreHorizontal size={18} />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[var(--color-text-tertiary)]">
                    <div className="flex flex-col items-center gap-2">
                      <ShoppingCart size={40} className="opacity-20" />
                      <p>Sotuvlar topilmadi</p>
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
