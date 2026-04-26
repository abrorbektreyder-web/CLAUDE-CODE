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
  UserPlus,
  X,
  Loader2,
  CheckCircle2
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

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ fullName: '', phone: '', address: '', passport: '', notes: '' });

  const filteredData = initialData.filter(item => 
    item.fullName.toLowerCase().includes(search.toLowerCase()) ||
    (item.phoneLastFour?.includes(search) ?? false)
  );

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat('uz-UZ').format(Number(price));
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return `Hali savdo yo'q`;
    const d = new Date(date);
    const months = ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek'];
    return `${d.getDate()}-${months[d.getMonth()]}, ${d.getFullYear()}`;
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Xatolik yuz berdi');
      
      setIsAddModalOpen(false);
      window.location.reload(); // Refresh to show new customer
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[var(--color-accent)]/20 transition-all hover:bg-[var(--color-accent-hover)]"
          >
            <UserPlus size={18} />
            Yangi mijoz
          </button>
        </div>
      </div>

      {/* Add Customer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-lg bg-[var(--color-bg-card)] rounded-3xl border border-[var(--color-border)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-[var(--color-border)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[var(--color-accent)]/10 flex items-center justify-center text-[var(--color-accent)]">
                  <UserPlus size={20} />
                </div>
                <div>
                  <h2 className="font-bold text-lg">Yangi mijoz qo'shish</h2>
                  <p className="text-[11px] text-[var(--color-text-tertiary)] uppercase font-bold tracking-wider">CRM tizimi</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 rounded-full hover:bg-[var(--color-bg-elevated)] transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddCustomer} className="p-6 space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium">
                  {error}
                </div>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)] ml-1">F.I.SH *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]" size={16} />
                    <input 
                      required
                      type="text" 
                      placeholder="Ism Familiya" 
                      className="w-full h-11 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)] pl-10 pr-4 text-sm outline-none focus:border-[var(--color-accent)] transition-all"
                      value={form.fullName}
                      onChange={e => setForm({...form, fullName: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)] ml-1">Telefon *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]" size={16} />
                    <input 
                      required
                      type="tel" 
                      placeholder="+998" 
                      className="w-full h-11 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)] pl-10 pr-4 text-sm outline-none focus:border-[var(--color-accent)] transition-all"
                      value={form.phone}
                      onChange={e => setForm({...form, phone: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)] ml-1">Pasport (ixtiyoriy)</label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]" size={16} />
                    <input 
                      type="text" 
                      placeholder="AA1234567" 
                      className="w-full h-11 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)] pl-10 pr-4 text-sm outline-none focus:border-[var(--color-accent)] transition-all"
                      value={form.passport}
                      onChange={e => setForm({...form, passport: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)] ml-1">Manzil</label>
                  <input 
                    type="text" 
                    placeholder="Shahar, tuman, ko'cha..." 
                    className="w-full h-11 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)] px-4 text-sm outline-none focus:border-[var(--color-accent)] transition-all"
                    value={form.address}
                    onChange={e => setForm({...form, address: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)] ml-1">Izoh</label>
                <textarea 
                  placeholder="Qo'shimcha ma'lumotlar..." 
                  rows={2}
                  className="w-full rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)] p-4 text-sm outline-none focus:border-[var(--color-accent)] transition-all resize-none"
                  value={form.notes}
                  onChange={e => setForm({...form, notes: e.target.value})}
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 h-12 rounded-xl border border-[var(--color-border)] font-bold text-sm hover:bg-[var(--color-bg-elevated)] transition-all"
                >
                  Bekor qilish
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="flex-[2] h-12 rounded-xl bg-[var(--color-accent)] text-white font-bold text-sm shadow-xl shadow-[var(--color-accent)]/20 hover:bg-[var(--color-accent-hover)] transition-all flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
