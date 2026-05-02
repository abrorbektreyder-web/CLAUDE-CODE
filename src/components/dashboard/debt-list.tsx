'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  CreditCard, 
  Calendar, 
  AlertCircle, 
  Clock, 
  CheckCircle2,
  MoreHorizontal,
  ChevronRight,
  HandCoins,
  X,
  Loader2,
  User,
  Phone,
  ArrowRight,
  History,
  ListOrdered,
  Tag
} from 'lucide-react';
import { cn, formatSum } from '@/lib/utils';
import { DateFilter } from './date-filter';
import { startOfMonth, endOfDay, isWithinInterval } from 'date-fns';

interface DebtItem {
  id: string;
  customerName: string;
  phoneLastFour?: string;
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

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedDebt, setSelectedDebt] = useState<string>('');
  const [paymentForm, setPaymentForm] = useState({ amount: '', method: 'cash', notes: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [showResults, setShowResults] = useState(false);

  // Details Modal
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedDebtDetails, setSelectedDebtDetails] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'schedules' | 'payments'>('schedules');
  const [payingInstallmentId, setPayingInstallmentId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: startOfMonth(new Date()),
    end: endOfDay(new Date())
  });

  const debtsWithDebt = initialData.filter(d => Number(d.remainingAmount) > 0);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredData = initialData.filter(item => {
    const itemDate = new Date(item.createdAt);
    const isInRange = isWithinInterval(itemDate, {
      start: dateRange.start,
      end: dateRange.end
    });

    const searchLower = search.toLowerCase();
    const matchesSearch = item.customerName.toLowerCase().includes(searchLower) ||
      item.id.toLowerCase().includes(searchLower) ||
      (item.phoneLastFour && item.phoneLastFour.includes(searchLower));

    return isInRange && matchesSearch;
  });

  const visibleDataForStats = initialData.filter(item => {
    const itemDate = new Date(item.createdAt);
    return isWithinInterval(itemDate, {
      start: dateRange.start,
      end: dateRange.end
    });
  });

  const formatPrice = (price: string | number) => {
    return formatSum(price, false);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    const months = ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek'];
    return `${d.getDate()}-${months[d.getMonth()]}`;
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    const months = ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek'];
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${d.getDate()}-${months[d.getMonth()]}, ${hours}:${minutes}`;
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebt) {
      setError('Qarzni tanlang');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/credit/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          debtId: selectedDebt,
          amount: Number(paymentForm.amount),
          paymentMethod: paymentForm.method,
          notes: paymentForm.notes
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Xatolik yuz berdi');
      
      setIsPaymentModalOpen(false);
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleShowDetails = async (debtId: string) => {
    setIsDetailModalOpen(true);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/credit/${debtId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSelectedDebtDetails(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handlePayInstallment = async (installment: any) => {
    if (!selectedDebtDetails) return;
    
    // Quick confirmation
    if (!window.confirm(`${formatPrice(installment.expected_amount)} so'm to'lovni tasdiqlaysizmi?`)) {
      return;
    }

    setPayingInstallmentId(installment.id);
    try {
      const amountToPay = Number(installment.expected_amount) - Number(installment.paid_amount || 0);
      
      const res = await fetch('/api/credit/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          debtId: selectedDebtDetails.id,
          amount: amountToPay,
          paymentMethod: 'cash', // Default to cash for quick action
          notes: `${formatDate(installment.due_date)} muddati uchun to'lov.`
        }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Xatolik yuz berdi');
      
      // Refresh modal data
      const refreshRes = await fetch(`/api/credit/${selectedDebtDetails.id}`);
      const refreshData = await refreshRes.json();
      if (refreshRes.ok) {
        setSelectedDebtDetails(refreshData);
      }
      
      // We don't reload the whole page here to keep the modal open and feel "Pro",
      // but we might want to tell the parent to refresh if the user closes the modal.
    } catch (err: any) {
      alert(err.message);
    } finally {
      setPayingInstallmentId(null);
    }
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
          <button 
            onClick={() => setIsPaymentModalOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[var(--color-accent)]/20 transition-all hover:bg-[var(--color-accent-hover)]"
          >
            <HandCoins size={18} />
            To'lov qabul qilish
          </button>
        </div>
      </div>

      {/* Accept Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-lg bg-[var(--color-bg-card)] rounded-3xl border border-[var(--color-border)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-[var(--color-border)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[var(--color-success)]/10 flex items-center justify-center text-[var(--color-success)]">
                  <HandCoins size={20} />
                </div>
                <div>
                  <h2 className="font-bold text-lg">Qarz to'lovini qabul qilish</h2>
                  <p className="text-[11px] text-[var(--color-text-tertiary)] uppercase font-bold tracking-wider">Moliya bo'limi</p>
                </div>
              </div>
              <button 
                onClick={() => setIsPaymentModalOpen(false)}
                className="p-2 rounded-full hover:bg-[var(--color-bg-elevated)] transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handlePayment} className="p-6 space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium">
                  {error}
                </div>
              )}
              
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)] ml-1">Mijozni qidirish (Ism yoki ID) *</label>
                <div className="relative group" ref={searchRef}>
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]" size={16} />
                  <input 
                    type="text"
                    placeholder="Mijoz ismi yoki qarz ID..."
                    className="w-full h-11 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)] pl-10 pr-4 text-sm outline-none focus:border-[var(--color-accent)] transition-all"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setShowResults(true);
                      if (!e.target.value) setSelectedDebt('');
                    }}
                    onFocus={() => setShowResults(true)}
                  />
                  
                  {showResults && (searchTerm || debtsWithDebt.length > 0) && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-2 max-h-60 overflow-y-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-2 shadow-2xl animate-in fade-in zoom-in-95 custom-scrollbar">
                      {debtsWithDebt
                        .filter(d => 
                          d.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          d.id.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map(debt => (
                          <button
                            key={debt.id}
                            type="button"
                            className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left hover:bg-[var(--color-accent)]/10 transition-colors group/item"
                            onClick={() => {
                              setSelectedDebt(debt.id);
                              setPaymentForm({
                                ...paymentForm, 
                                amount: debt.monthlyPayment
                              });
                              setSearchTerm(debt.customerName);
                              setShowResults(false);
                            }}
                          >
                            <div>
                              <div className="text-sm font-bold">{debt.customerName}</div>
                              <div className="text-[10px] text-[var(--color-text-tertiary)] font-mono uppercase">№ {debt.id.slice(0,8)}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-bold text-[var(--color-accent)]">{formatPrice(debt.remainingAmount)}</div>
                              <div className="text-[9px] font-bold text-[var(--color-text-tertiary)] uppercase">Qoldiq</div>
                            </div>
                          </button>
                        ))}
                      {debtsWithDebt.length === 0 && (
                        <div className="py-8 text-center text-xs text-[var(--color-text-tertiary)]">
                          Aktiv qarzdorlar topilmadi
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)] ml-1">To'lov summasi *</label>
                  <div className="relative">
                    <input 
                      required
                      type="number" 
                      placeholder="0.00" 
                      className="w-full h-11 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)] px-4 text-sm font-bold outline-none focus:border-[var(--color-accent)] transition-all"
                      value={paymentForm.amount}
                      onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})}
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[var(--color-text-tertiary)]">SO'M</div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)] ml-1">To'lov usuli *</label>
                  <select 
                    required
                    className="w-full h-11 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)] px-4 text-sm outline-none focus:border-[var(--color-accent)] transition-all"
                    value={paymentForm.method}
                    onChange={e => setPaymentForm({...paymentForm, method: e.target.value})}
                  >
                    <option value="cash">Naqd pul</option>
                    <option value="card">Plastik karta</option>
                    <option value="transfer">Bank o'tkazmasi</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)] ml-1">Izoh</label>
                <textarea 
                  placeholder="To'lov bo'yicha qo'shimcha izoh..." 
                  rows={2}
                  className="w-full rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)] p-4 text-sm outline-none focus:border-[var(--color-accent)] transition-all resize-none"
                  value={paymentForm.notes}
                  onChange={e => setPaymentForm({...paymentForm, notes: e.target.value})}
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="flex-1 h-12 rounded-xl border border-[var(--color-border)] font-bold text-sm hover:bg-[var(--color-bg-elevated)] transition-all"
                >
                  Bekor qilish
                </button>
                <button 
                  type="submit"
                  disabled={loading || !selectedDebt}
                  className="flex-[2] h-12 rounded-xl bg-[var(--color-success)] text-white font-bold text-sm shadow-xl shadow-[var(--color-success)]/20 hover:bg-[var(--color-success-hover)] transition-all flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                  To'lovni tasdiqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
        <div className="premium-card rounded-2xl p-4 md:p-5">
          <div className="mb-2 text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">Jami nasiya</div>
          <div className="text-xl md:text-2xl font-bold">
            {formatPrice(visibleDataForStats.reduce((acc, i) => acc + Number(i.remainingAmount), 0).toString())}
            <span className="text-[10px] md:text-xs font-normal text-[var(--color-text-tertiary)] ml-1">so'm</span>
          </div>
        </div>
        <div className="premium-card rounded-2xl p-4 md:p-5 border-l-4 border-l-[var(--color-danger)]">
          <div className="mb-2 text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">Muddati o'tgan</div>
          <div className="flex items-center gap-2">
            <div className="text-xl md:text-2xl font-bold text-[var(--color-danger)]">
              {visibleDataForStats.filter(i => i.isOverdue).length}
            </div>
            <AlertCircle size={14} className="text-[var(--color-danger)]" />
          </div>
        </div>
        <div className="premium-card rounded-2xl p-4 md:p-5">
          <div className="mb-2 text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">Bugun kutilayotgan</div>
          <div className="text-xl md:text-2xl font-bold text-[var(--color-info)]">~ 4.5 mln</div>
        </div>
        <div className="premium-card rounded-2xl p-4 md:p-5">
          <div className="mb-2 text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">Yopilgan nasiyalar</div>
          <div className="text-xl md:text-2xl font-bold">{visibleDataForStats.filter(i => i.status === 'paid').length}</div>
        </div>
      </div>

      {/* Table Section */}
      <div className="premium-card overflow-hidden rounded-2xl">
        <div className="p-4 border-b border-[var(--color-border)] flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]" size={18} />
            <input 
              type="text" 
              placeholder="Qidirish..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)]/50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[var(--color-accent)] focus:ring-4 focus:ring-[var(--color-accent)]/10 transition-all"
            />
          </div>
          <DateFilter onRangeChange={setDateRange} className="flex-none" />
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
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
                    <td className="px-6 py-4">
                      <div className="font-semibold text-[var(--color-text-primary)]">{debt.customerName}</div>
                      <div className="flex items-center gap-2 mt-1">
                        {debt.phoneLastFour && (
                          <div className="text-[10px] text-[var(--color-text-tertiary)] flex items-center gap-1 font-bold">
                            <Phone size={10} /> ...{debt.phoneLastFour}
                          </div>
                        )}
                        <div className="text-[10px] text-[var(--color-text-tertiary)] flex items-center gap-1 font-mono uppercase">
                          <Tag size={10} /> {debt.id.slice(0, 8)}
                        </div>
                      </div>
                    </td>
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
                    <td className="px-6 py-4 text-[var(--color-text-secondary)] whitespace-nowrap">
                      {formatDate(debt.nextPaymentDate)}
                    </td>
                    <td className="px-6 py-4">
                      {isOverdue ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-danger)]/10 px-2.5 py-0.5 text-[10px] font-bold text-[var(--color-danger)] border border-[var(--color-danger)]/20"><Clock size={12} />Muddati o'tgan</span>
                      ) : debt.status === 'paid' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-success)]/10 px-2.5 py-0.5 text-[10px] font-bold text-[var(--color-success)] border border-[var(--color-success)]/20"><CheckCircle2 size={12} />Yopilgan</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-info)]/10 px-2.5 py-0.5 text-[10px] font-bold text-[var(--color-info)] border border-[var(--color-info)]/20">Aktiv</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleShowDetails(debt.id)} className="flex items-center gap-1 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-bold transition-all hover:bg-[var(--color-bg-elevated)]">
                        Batafsil <ChevronRight size={14} />
                      </button>
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-[var(--color-text-tertiary)]">Topilmadi</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-[var(--color-border)]">
          {filteredData.length > 0 ? filteredData.map((debt) => {
            const isOverdue = debt.isOverdue;
            return (
              <div key={debt.id} className="p-4 space-y-4 active:bg-[var(--color-bg-hover)] transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-bold text-base leading-tight mb-0.5">{debt.customerName}</div>
                    <div className="flex items-center gap-2">
                      <div className="text-[10px] text-[var(--color-text-tertiary)] font-bold uppercase">№ {debt.id.slice(0,8).toUpperCase()}</div>
                      {debt.phoneLastFour && (
                        <div className="text-[10px] text-[var(--color-text-tertiary)] font-bold italic">...{debt.phoneLastFour}</div>
                      )}
                    </div>
                  </div>
                  <button onClick={() => handleShowDetails(debt.id)} className="rounded-lg p-2 text-[var(--color-text-tertiary)] bg-[var(--color-bg-elevated)]">
                    <ChevronRight size={18} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[10px] font-bold uppercase text-[var(--color-text-tertiary)] mb-0.5">Qoldiq</div>
                    <div className={cn("font-bold text-base", isOverdue ? "text-[var(--color-danger)]" : "text-[var(--color-foreground)]")}>
                      {formatPrice(debt.remainingAmount)} <span className="text-[10px] text-[var(--color-text-tertiary)]">SO'M</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase text-[var(--color-text-tertiary)] mb-0.5">Oylik to'lov</div>
                    <div className="font-bold text-base">{formatPrice(debt.monthlyPayment)} <span className="text-[10px] text-[var(--color-text-tertiary)]">SO'M</span></div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border)]/50">
                  <div className="text-[10px] font-bold text-[var(--color-text-tertiary)] uppercase flex items-center gap-1">
                    <Calendar size={12} /> Keyingi: {formatDate(debt.nextPaymentDate)}
                  </div>
                  {isOverdue ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-danger)]/10 px-2 py-0.5 text-[9px] font-bold text-[var(--color-danger)] border border-[var(--color-danger)]/20"><Clock size={10} />Muddati o'tgan</span>
                  ) : debt.status === 'paid' ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-success)]/10 px-2 py-0.5 text-[9px] font-bold text-[var(--color-success)] border border-[var(--color-success)]/20">Yopilgan</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-info)]/10 px-2 py-0.5 text-[9px] font-bold text-[var(--color-info)] border border-[var(--color-info)]/20">Aktiv</span>
                  )}
                </div>
              </div>
            );
          }) : (
            <div className="p-12 text-center text-[var(--color-text-tertiary)]">Topilmadi</div>
          )}
        </div>
      </div>

      {/* Debt Details Modal */}
      {isDetailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[var(--color-bg-card)] w-full max-w-2xl rounded-3xl border border-[var(--color-border)] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-bg-elevated)]/50">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-[var(--color-accent)]/10 flex items-center justify-center text-[var(--color-accent)]">
                  <User size={24} />
                </div>
                <div>
                  <h2 className="font-bold text-xl">{selectedDebtDetails?.customer?.full_name || 'Yuklanmoqda...'}</h2>
                  <div className="flex items-center gap-2 text-xs text-[var(--color-text-tertiary)] font-bold uppercase tracking-wider">
                    <Tag size={12} />
                    Nasiya № {selectedDebtDetails?.id?.slice(0,8).toUpperCase() || '...'}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setSelectedDebtDetails(null);
                }}
                className="p-2 rounded-full hover:bg-[var(--color-bg-elevated)] transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {detailLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 gap-4">
                <Loader2 className="animate-spin text-[var(--color-accent)]" size={40} />
                <p className="text-sm font-medium text-[var(--color-text-tertiary)]">Ma'lumotlar yuklanmoqda...</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                {/* Progress Card */}
                <div className="premium-card rounded-2xl p-5 border border-[var(--color-border)] bg-[var(--color-bg-elevated)]/30">
                  <div className="flex justify-between items-end mb-4">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)] mb-1">To'langan miqdor</div>
                      <div className="text-2xl font-bold text-[var(--color-success)]">
                        {formatPrice(selectedDebtDetails?.paid_amount || '0')}
                        <span className="text-xs font-normal ml-1">so'm</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)] mb-1">Umumiy qarz</div>
                      <div className="text-lg font-bold">
                        {formatPrice(selectedDebtDetails?.total_amount || '0')}
                        <span className="text-xs font-normal ml-1">so'm</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Simple Progress Bar */}
                  <div className="h-2 w-full bg-[var(--color-border)] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[var(--color-success)] transition-all duration-1000"
                      style={{ 
                        width: `${Math.min(100, (Number(selectedDebtDetails?.paid_amount || 0) / Number(selectedDebtDetails?.total_amount || 1)) * 100)}%` 
                      }}
                    />
                  </div>
                  <div className="mt-2 text-right text-[10px] font-bold text-[var(--color-text-tertiary)]">
                    {Math.round((Number(selectedDebtDetails?.paid_amount || 0) / Number(selectedDebtDetails?.total_amount || 1)) * 100)}% yakunlandi
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 p-1 bg-[var(--color-bg-elevated)] rounded-xl border border-[var(--color-border)]">
                  <button 
                    onClick={() => setActiveTab('schedules')}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all",
                      activeTab === 'schedules' ? "bg-[var(--color-bg-card)] text-[var(--color-accent)] shadow-sm" : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
                    )}
                  >
                    <ListOrdered size={14} />
                    To'lovlar grafigi
                  </button>
                  <button 
                    onClick={() => setActiveTab('payments')}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all",
                      activeTab === 'payments' ? "bg-[var(--color-bg-card)] text-[var(--color-accent)] shadow-sm" : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
                    )}
                  >
                    <History size={14} />
                    To'lovlar tarixi
                  </button>
                </div>

                {/* Tab Content */}
                <div className="space-y-3">
                  {activeTab === 'schedules' ? (
                    selectedDebtDetails?.schedules?.map((s: any, idx: number) => (
                      <div key={s.id} className="flex items-center justify-between p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)]/20 hover:bg-[var(--color-bg-elevated)]/40 transition-colors group">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "h-8 w-8 rounded-lg flex items-center justify-center text-[10px] font-bold border",
                            Number(s.paid_amount) >= Number(s.expected_amount) 
                              ? "bg-[var(--color-success)]/10 text-[var(--color-success)] border-[var(--color-success)]/20" 
                              : "bg-[var(--color-bg-elevated)] text-[var(--color-text-tertiary)] border-[var(--color-border)]"
                          )}>
                            {idx + 1}
                          </div>
                          <div>
                            <div className="text-sm font-bold">{formatPrice(s.expected_amount)} so'm</div>
                            <div className="text-[10px] font-bold text-[var(--color-text-tertiary)] uppercase flex items-center gap-1">
                              <Calendar size={10} />
                              Muddati: {formatDate(s.due_date)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {Number(s.paid_amount) >= Number(s.expected_amount) ? (
                            <div className="flex flex-col items-end gap-0.5">
                              <div className="flex items-center gap-1 text-[var(--color-success)] text-[10px] font-bold uppercase">
                                <CheckCircle2 size={12} />
                                To'langan
                              </div>
                              {s.paid_at && (
                                <div className="text-[9px] font-bold text-[var(--color-text-tertiary)] flex items-center gap-1">
                                  <Clock size={10} />
                                  {formatDateTime(s.paid_at)}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              {Number(s.paid_amount) > 0 ? (
                                <div className="text-[var(--color-info)] text-[10px] font-bold uppercase text-right">
                                  Qisman: {formatPrice(s.paid_amount)}
                                </div>
                              ) : (
                                <div className="text-[var(--color-text-tertiary)] text-[10px] font-bold uppercase">To'lanmagan</div>
                              )}
                              
                              <button
                                onClick={() => handlePayInstallment(s)}
                                disabled={payingInstallmentId !== null}
                                className={cn(
                                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all",
                                  "bg-[var(--color-accent)]/10 text-[var(--color-accent)] border border-[var(--color-accent)]/20 hover:bg-[var(--color-accent)] hover:text-white",
                                  payingInstallmentId === s.id && "opacity-50 cursor-not-allowed"
                                )}
                              >
                                {payingInstallmentId === s.id ? (
                                  <Loader2 size={10} className="animate-spin" />
                                ) : (
                                  <HandCoins size={10} />
                                )}
                                To'lash
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    selectedDebtDetails?.payments?.length > 0 ? (
                      selectedDebtDetails?.payments?.map((p: any) => (
                        <div key={p.id} className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)]/20">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <div className="h-7 w-7 rounded-lg bg-[var(--color-success)]/10 flex items-center justify-center text-[var(--color-success)]">
                                <HandCoins size={14} />
                              </div>
                              <div className="text-sm font-bold">+{formatPrice(p.amount)} so'm</div>
                            </div>
                            <div className="text-[10px] font-bold text-[var(--color-text-tertiary)]">
                              {new Date(p.created_at).toLocaleString('uz-UZ', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          {p.notes && (
                            <div className="mt-3 p-3 rounded-lg bg-[var(--color-bg-elevated)]/50 text-[11px] leading-relaxed text-[var(--color-text-secondary)] border-l-2 border-[var(--color-accent)] italic">
                              {p.notes}
                            </div>
                          )}
                          <div className="mt-2 flex items-center gap-2">
                             <div className="px-2 py-0.5 rounded bg-[var(--color-bg-elevated)] text-[9px] font-bold uppercase text-[var(--color-text-tertiary)] border border-[var(--color-border)]">
                               {p.method === 'cash' ? 'Naqd' : p.method === 'card' ? 'Karta' : 'O\'tkazma'}
                             </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-12 text-center text-xs text-[var(--color-text-tertiary)] opacity-50 italic">
                        Hozircha to'lovlar mavjud emas
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
            
            {/* Modal Footer */}
            <div className="p-6 border-t border-[var(--color-border)] bg-[var(--color-bg-elevated)]/30">
              <button 
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setSelectedDebtDetails(null);
                  window.location.reload(); // Refresh main list on close
                }}
                className="w-full py-3 rounded-2xl bg-[var(--color-bg-card)] border border-[var(--color-border)] text-sm font-bold transition-all hover:bg-[var(--color-bg-elevated)] active:scale-[0.98]"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
