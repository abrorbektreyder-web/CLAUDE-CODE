'use client';

import { useState } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  MoreHorizontal, 
  Package, 
  Smartphone, 
  Headphones, 
  Watch, 
  ArrowUpRight, 
  ArrowDownLeft,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  brand: string | null;
  model: string | null;
  productType: string;
  retailPrice: string;
  minStock: number;
  imageUrl: string | null;
  totalQuantity: number;
  phoneCount: number;
}

interface InventoryListProps {
  initialData: InventoryItem[];
}

export function InventoryList({ initialData }: InventoryListProps) {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');

  const filteredData = initialData.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase()) ||
      (item.barcode?.toLowerCase().includes(search.toLowerCase()) ?? false);
    
    const matchesType = filterType === 'all' || item.productType === filterType;
    
    return matchesSearch && matchesType;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'phone': return <Smartphone size={18} />;
      case 'accessory': return <Headphones size={18} />;
      case 'tablet': return <Smartphone size={18} />;
      case 'wearable': return <Watch size={18} />;
      default: return <Package size={18} />;
    }
  };

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat('uz-UZ').format(Number(price));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">Ombor</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">Mavjud tovarlar va zaxira nazorati</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-2.5 text-sm font-semibold transition-all hover:bg-[var(--color-bg-hover)]">
            <Filter size={18} />
            Filtr
          </button>
          <button className="flex items-center gap-2 rounded-xl bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[var(--color-accent)]/20 transition-all hover:bg-[var(--color-accent-hover)]">
            <Plus size={18} />
            Tovar qo'shish
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="premium-card rounded-2xl p-5">
          <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">Jami tovarlar</div>
          <div className="text-2xl font-bold">{initialData.length} <span className="text-xs font-normal text-[var(--color-text-tertiary)]">tur</span></div>
        </div>
        <div className="premium-card rounded-2xl p-5 border-l-4 border-l-[var(--color-accent)]">
          <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">Zaxira (Umumiy)</div>
          <div className="text-2xl font-bold">{initialData.reduce((acc, i) => acc + i.totalQuantity + i.phoneCount, 0)} <span className="text-xs font-normal text-[var(--color-text-tertiary)]">dona</span></div>
        </div>
        <div className="premium-card rounded-2xl p-5">
          <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">Kam qolganlar</div>
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold text-[var(--color-danger)]">
              {initialData.filter(i => (i.totalQuantity + i.phoneCount) <= i.minStock).length}
            </div>
            <AlertTriangle size={16} className="text-[var(--color-danger)]" />
          </div>
        </div>
        <div className="premium-card rounded-2xl p-5">
          <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">Ombor qiymati</div>
          <div className="text-xl font-bold">~ 1.2 mlrd <span className="text-xs font-normal text-[var(--color-text-tertiary)]">so'm</span></div>
        </div>
      </div>

      {/* Table Section */}
      <div className="premium-card overflow-hidden rounded-2xl">
        <div className="flex items-center gap-4 border-b border-[var(--color-border)] p-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]" size={18} />
            <input 
              type="text" 
              placeholder="Tovar nomi, SKU yoki barcode bo'yicha qidirish..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)]/50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[var(--color-accent)] focus:ring-4 focus:ring-[var(--color-accent)]/10 transition-all"
            />
          </div>
          <select 
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-2.5 text-sm font-semibold outline-none focus:border-[var(--color-accent)] transition-all cursor-pointer"
          >
            <option value="all">Barcha turlar</option>
            <option value="phone">Telefonlar</option>
            <option value="accessory">Aksessuarlar</option>
            <option value="tablet">Planshetlar</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-elevated)]/30 text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                <th className="px-6 py-4">Tovar</th>
                <th className="px-6 py-4">Turi</th>
                <th className="px-6 py-4">SKU / Barcode</th>
                <th className="px-6 py-4">Narxi</th>
                <th className="px-6 py-4">Qoldiq</th>
                <th className="px-6 py-4">Holat</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {filteredData.length > 0 ? filteredData.map((item) => {
                const stock = item.productType === 'phone' ? item.phoneCount : item.totalQuantity;
                const isLow = stock <= item.minStock;

                return (
                  <tr key={item.id} className="group transition-colors hover:bg-[var(--color-bg-hover)]">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-[var(--color-text-tertiary)]">
                          {getIcon(item.productType)}
                        </div>
                        <div>
                          <div className="font-semibold">{item.name}</div>
                          <div className="text-[10px] text-[var(--color-text-tertiary)] uppercase font-bold tracking-tight">
                            {item.brand} {item.model}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="capitalize">{item.productType}</span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">
                      <div className="text-[var(--color-foreground)]">{item.sku}</div>
                      <div className="text-[var(--color-text-tertiary)]">{item.barcode}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold">{formatPrice(item.retailPrice)}</div>
                      <div className="text-[10px] text-[var(--color-text-tertiary)] uppercase font-bold">SO'M</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={cn("font-bold text-lg", isLow ? "text-[var(--color-danger)]" : "text-[var(--color-foreground)]")}>
                        {stock}
                      </div>
                      <div className="text-[10px] text-[var(--color-text-tertiary)] uppercase font-bold">DONA</div>
                    </td>
                    <td className="px-6 py-4">
                      {isLow ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-danger)]/10 px-2.5 py-0.5 text-[10px] font-bold text-[var(--color-danger)] border border-[var(--color-danger)]/20">
                          Kam qolgan
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-success)]/10 px-2.5 py-0.5 text-[10px] font-bold text-[var(--color-success)] border border-[var(--color-success)]/20">
                          Mavjud
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="rounded-lg p-2 text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-foreground)] transition-colors">
                        <MoreHorizontal size={18} />
                      </button>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-[var(--color-text-tertiary)]">
                    <div className="flex flex-col items-center gap-2">
                      <Package size={40} className="opacity-20" />
                      <p>Tovar topilmadi</p>
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
