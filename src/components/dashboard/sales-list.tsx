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
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar
} from 'lucide-react';
import { cn, formatSum } from '@/lib/utils';
import Link from 'next/link';
import { Edit2, Trash2, X, FileText, Table } from 'lucide-react';
import { exportToPDF, exportToCSV } from '@/lib/export-utils';

interface SaleItem {
  id: string;
  receiptNumber: string | number;
  customerName: string;
  customerPhone: string;
  total: string;
  paymentMethod: string;
  status: string;
  createdAt: string;
  // Debt enrichment (null for non-credit sales)
  debtStatus?: string | null;        // 'active' | 'paid' | 'overdue'
  debtRemaining?: string | null;
  debtTotal?: string | null;
  debtPaid?: string | null;
  saleItems: string;
  notes?: string;
}

interface SalesListProps {
  initialData: SaleItem[];
}

export function SalesList({ initialData }: SalesListProps) {
  const [search, setSearch] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [selectedSale, setSelectedSale] = useState<SaleItem | null>(null);
  const [modalType, setModalType] = useState<'edit' | 'delete' | null>(null);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  const filteredData = initialData.filter(sale =>
    sale.customerName.toLowerCase().includes(search.toLowerCase()) ||
    sale.receiptNumber.toString().includes(search)
  );

  const formatPrice = (price: string | number) => {
    return formatSum(price, false);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const months = ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek'];
    const day = d.getDate();
    const month = months[d.getMonth()];
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}-${month}, ${hours}:${minutes}`;
  };

  const handleExportPDF = () => {
    exportToPDF(filteredData, "Sotuvlar Hisoboti (Toliq)");
    setIsExportMenuOpen(false);
  };

  const handleExportCSV = () => {
    exportToCSV(filteredData);
    setIsExportMenuOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl">Sotuvlar</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">Barcha amalga oshirilgan savdolar tarixi va boshqaruvi</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="relative flex-1 sm:flex-none">
            <button
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              className={cn(
                "flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all active:scale-95",
                isExportMenuOpen ? "bg-[var(--color-bg-hover)] border-[var(--color-accent)]" : "border-[var(--color-border)] bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-hover)]"
              )}
            >
              <Download size={18} />
              Eksport
            </button>
            {isExportMenuOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setIsExportMenuOpen(false)} />
                <div className="absolute right-0 top-full z-30 mt-2 w-48 origin-top-right rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-1.5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                  <button onClick={handleExportPDF} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-[var(--color-bg-hover)] transition-colors">
                    <FileText size={16} className="text-red-500" />
                    PDF Hisobot
                  </button>
                  <button onClick={handleExportCSV} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-[var(--color-bg-hover)] transition-colors">
                    <Table size={16} className="text-green-500" />
                    Excel (CSV) fayl
                  </button>
                </div>
              </>
            )}
          </div>
          <Link
            href="/dashboard/sales/new"
            className="flex flex-1 sm:flex-none items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[var(--color-accent)]/20 transition-all hover:bg-[var(--color-accent-hover)] active:scale-95"
          >
            <Plus size={18} />
            Yangi savdo
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        <div className="premium-card rounded-2xl p-4 md:p-5">
          <div className="mb-2 text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">Bugungi jami savdo</div>
          <div className="flex items-end gap-2">
            <div className="text-xl md:text-2xl font-bold">{formatPrice(initialData.reduce((acc, i) => acc + Number(i.total), 0).toString())}</div>
            <div className="mb-1 text-[10px] text-[var(--color-text-tertiary)] uppercase font-bold">so'm</div>
            <div className="ml-auto flex items-center gap-1 rounded-md bg-[var(--color-success)]/10 px-1.5 py-0.5 text-[9px] md:text-[10px] font-bold text-[var(--color-success)]">
              <ArrowUpRight size={10} />
              12%
            </div>
          </div>
        </div>
        <div className="premium-card rounded-2xl p-4 md:p-5">
          <div className="mb-2 text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">Sotilgan tovarlar</div>
          <div className="flex items-end gap-2">
            <div className="text-xl md:text-2xl font-bold">{initialData.length}</div>
            <div className="mb-1 text-[10px] text-[var(--color-text-tertiary)] uppercase font-bold">dona</div>
            <div className="ml-auto flex items-center gap-1 rounded-md bg-[var(--color-success)]/10 px-1.5 py-0.5 text-[9px] md:text-[10px] font-bold text-[var(--color-success)]">
              <ArrowUpRight size={10} />
              8 ta
            </div>
          </div>
        </div>
        <div className="premium-card rounded-2xl p-4 md:p-5 sm:col-span-2 md:col-span-1">
          <div className="mb-2 text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">O'rtacha chek</div>
          <div className="flex items-end gap-2">
            <div className="text-xl md:text-2xl font-bold">
              {initialData.length > 0
                ? formatPrice((initialData.reduce((acc, i) => acc + Number(i.total), 0) / initialData.length).toFixed(0))
                : 0
              }
            </div>
            <div className="mb-1 text-[10px] text-[var(--color-text-tertiary)] uppercase font-bold">so'm</div>
            <div className="ml-auto flex items-center gap-1 rounded-md bg-[var(--color-danger)]/10 px-1.5 py-0.5 text-[9px] md:text-[10px] font-bold text-[var(--color-danger)]">
              <ArrowDownLeft size={10} />
              3%
            </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="premium-card overflow-hidden rounded-2xl">
        <div className="flex flex-col md:flex-row md:items-center gap-4 border-b border-[var(--color-border)] p-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]" size={18} />
            <input
              type="text"
              placeholder="Qidirish..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)]/50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[var(--color-accent)] focus:ring-4 focus:ring-[var(--color-accent)]/10 transition-all"
            />
          </div>
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all active:scale-95",
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
          <div className="bg-[var(--color-bg-elevated)]/30 border-b border-[var(--color-border)] p-4 grid grid-cols-2 gap-4 animate-in slide-in-from-top duration-200">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">To'lov turi</span>
              <select className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] px-3 py-1.5 text-xs outline-none focus:border-[var(--color-accent)]">
                <option>Barchasi</option>
                <option>Naqd</option>
                <option>Karta</option>
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
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
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
                    {sale.status === 'completed' ? (
                      sale.paymentMethod === 'credit' ? (
                        <div className="flex items-center gap-1 mt-0.5">
                          {sale.debtStatus === 'paid' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[var(--color-success)] uppercase">
                              <CheckCircle2 size={10} />
                              To'landi
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[var(--color-purple)] uppercase">
                              <Clock size={10} />
                              Nasiya
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="text-[10px] font-bold uppercase text-[var(--color-success)]">Sotildi</div>
                      )
                    ) : (
                      <div className="text-[10px] font-bold uppercase text-[var(--color-danger)]">Bekor qilindi</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className={cn(
                      "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold border uppercase",
                      sale.paymentMethod === 'credit' ? "bg-[var(--color-purple)]/10 border-[var(--color-purple)]/20 text-[var(--color-purple)]" : "bg-[var(--color-bg-elevated)] border-[var(--color-border)] text-[var(--color-text-secondary)]"
                    )}>
                      {sale.paymentMethod}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[var(--color-text-secondary)] whitespace-nowrap">
                    {formatDate(sale.createdAt)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="relative inline-block text-left">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === sale.id ? null : sale.id);
                        }}
                        className="rounded-lg p-2 text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-foreground)] transition-colors"
                      >
                        <MoreHorizontal size={18} />
                      </button>
                      {openMenuId === sale.id && (
                        <>
                          {/* Overlay to close menu on click outside */}
                          <div 
                            className="fixed inset-0 z-10" 
                            onClick={() => setOpenMenuId(null)}
                          />
                          <div className="absolute right-0 top-full z-20 mt-1 w-44 origin-top-right rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-1.5 shadow-2xl animate-in fade-in zoom-in-95 duration-200 ring-1 ring-black/5">
                            <button 
                              onClick={() => { setSelectedSale(sale); setModalType('edit'); setOpenMenuId(null); }} 
                              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-[var(--color-bg-hover)] transition-all active:scale-95"
                            >
                              <Edit2 size={16} className="text-[var(--color-accent)]" /> 
                              Tahrirlash
                            </button>
                            <div className="my-1 h-px bg-[var(--color-border)]/50" />
                            <button 
                              onClick={() => { setSelectedSale(sale); setModalType('delete'); setOpenMenuId(null); }} 
                              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-red-500/10 transition-all active:scale-95"
                            >
                              <Trash2 size={16} /> 
                              O'chirish
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-[var(--color-text-tertiary)]">Topilmadi</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-[var(--color-border)]">
          {filteredData.length > 0 ? filteredData.map((sale) => (
            <div key={sale.id} className="p-4 space-y-4 active:bg-[var(--color-bg-hover)] transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-mono font-bold text-[var(--color-accent)] mb-1">#{sale.receiptNumber}</div>
                  <div className="font-bold text-base">{sale.customerName}</div>
                  <div className="text-xs text-[var(--color-text-tertiary)]">{sale.customerPhone}</div>
                </div>
                <button
                  onClick={() => setOpenMenuId(openMenuId === sale.id ? null : sale.id)}
                  className="rounded-lg p-2 text-[var(--color-text-tertiary)] bg-[var(--color-bg-elevated)]"
                >
                  <MoreHorizontal size={18} />
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase text-[var(--color-text-tertiary)] mb-0.5">Summa</div>
                  <div className="font-bold text-lg">{formatPrice(sale.total)} <span className="text-[10px] text-[var(--color-text-tertiary)] uppercase">so'm</span></div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold uppercase text-[var(--color-text-tertiary)] mb-1">Status</div>
                  <div className={cn(
                    "inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold border uppercase",
                    sale.paymentMethod === 'credit' ? "bg-[var(--color-purple)]/10 border-[var(--color-purple)]/20 text-[var(--color-purple)]" : "bg-[var(--color-success)]/10 border-[var(--color-success)]/20 text-[var(--color-success)]"
                  )}>
                    {sale.paymentMethod}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border)]/50">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--color-text-tertiary)] uppercase">
                  <Calendar size={12} />
                  {formatDate(sale.createdAt)}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setSelectedSale(sale); setModalType('edit'); }} className="p-2 rounded-lg bg-[var(--color-bg-elevated)] text-[var(--color-text-tertiary)]"><Edit2 size={14} /></button>
                  <button onClick={() => { setSelectedSale(sale); setModalType('delete'); }} className="p-2 rounded-lg bg-red-500/10 text-red-500"><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          )) : (
            <div className="p-8 text-center text-[var(--color-text-tertiary)]">Topilmadi</div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {modalType === 'edit' && selectedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[var(--color-bg-elevated)] rounded-3xl border border-[var(--color-border)] shadow-2xl p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-display font-bold">Savdoni tahrirlash</h3>
              <button
                onClick={() => setModalType(null)}
                className="p-2 rounded-full hover:bg-[var(--color-bg-hover)] transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[var(--color-bg-base)] border border-[var(--color-border)]">
                <div className="text-xs text-[var(--color-text-tertiary)] mb-1">Chek №</div>
                <div className="font-mono font-bold text-[var(--color-accent)]">#{selectedSale.receiptNumber}</div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-[var(--color-text-tertiary)]">Mijoz ismi</label>
                <input
                  type="text"
                  defaultValue={selectedSale.customerName}
                  className="w-full h-12 rounded-xl bg-[var(--color-bg-base)] border border-[var(--color-border)] px-4 text-sm outline-none focus:border-[var(--color-accent)]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-[var(--color-text-tertiary)]">Telefon raqami</label>
                <input
                  type="text"
                  defaultValue={selectedSale.customerPhone}
                  className="w-full h-12 rounded-xl bg-[var(--color-bg-base)] border border-[var(--color-border)] px-4 text-sm outline-none focus:border-[var(--color-accent)]"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setModalType(null)}
                className="flex-1 h-12 rounded-xl border border-[var(--color-border)] font-bold hover:bg-[var(--color-bg-hover)] transition-colors"
              >
                Bekor qilish
              </button>
              <button
                onClick={() => setModalType(null)}
                className="flex-1 h-12 rounded-xl bg-[var(--color-accent)] text-white font-bold hover:bg-[var(--color-accent-hover)] transition-colors"
              >
                Saqlash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {modalType === 'delete' && selectedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-[var(--color-bg-elevated)] rounded-3xl border border-[var(--color-border)] shadow-2xl p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={32} />
            </div>
            <h3 className="text-xl font-display font-bold mb-2">Savdoni o'chirish</h3>
            <p className="text-sm text-[var(--color-text-secondary)] mb-6">
              Siz rostdan ham <b>#{selectedSale.receiptNumber}</b> raqamli savdoni o'chirmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setModalType(null)}
                className="flex-1 h-12 rounded-xl border border-[var(--color-border)] font-bold hover:bg-[var(--color-bg-hover)] transition-colors"
              >
                Yo'q, qaytish
              </button>
              <button
                onClick={() => setModalType(null)}
                className="flex-1 h-12 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors"
              >
                Ha, o'chirish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
