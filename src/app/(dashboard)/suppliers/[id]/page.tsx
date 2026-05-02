
'use client';

import { useState, useEffect, useCallback, use } from 'react';
import {
  Users, Phone, Mail, MapPin, 
  ArrowLeft, Plus, Wallet, History,
  TrendingUp, TrendingDown, Clock,
  ChevronDown, X, DollarSign, Receipt,
  CheckCircle2, AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { formatSum, formatDate, formatRelativeTime } from '@/lib/utils';

// ─── Types ──────────────────────────────────────────────────────────────────

type Transaction = {
  id: string;
  type: 'purchase' | 'payment' | 'return' | 'adjustment';
  amount: number | string;
  balance_snapshot: number | string;
  notes?: string;
  created_at: string;
};

type SupplierDetail = {
  id: string;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  inn?: string;
  current_balance: string | number;
  transactions: Transaction[];
};

// ─── Components ──────────────────────────────────────────────────────────────

function TransactionRow({ tx }: { tx: Transaction }) {
  const amount = Number(tx.amount);
  const isNegative = tx.type === 'payment' || tx.type === 'return';

  const typeConfig = {
    purchase:   { label: 'Xarid',   color: 'var(--color-danger)',  bg: 'rgba(255, 69, 58, 0.1)', icon: TrendingUp },
    payment:    { label: 'To\'lov', color: 'var(--color-success)', bg: 'rgba(48, 209, 88, 0.1)', icon: DollarSign },
    return:     { label: 'Qaytarish', color: 'var(--color-info)',   bg: 'rgba(100, 210, 255, 0.1)', icon: History },
    adjustment: { label: 'Tuzatish', color: 'var(--color-warning)',bg: 'rgba(255, 214, 10, 0.1)', icon: AlertCircle },
  }[tx.type];

  const Icon = typeConfig.icon;

  return (
    <div className="group flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 transition-all border border-transparent hover:border-[var(--color-border)]">
      <div className="flex items-center gap-4">
        <div 
          className="flex h-10 w-10 items-center justify-center rounded-xl border"
          style={{ backgroundColor: typeConfig.bg, borderColor: `${typeConfig.color}20`, color: typeConfig.color }}
        >
          <Icon size={18} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-[var(--color-foreground)]">{typeConfig.label}</span>
            <span className="text-[10px] uppercase font-bold text-[var(--color-text-tertiary)] tracking-widest">• {formatRelativeTime(tx.created_at)}</span>
          </div>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{tx.notes || 'Izoh yo\'q'}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-mono-tabular font-bold text-lg" style={{ color: isNegative ? 'var(--color-success)' : 'var(--color-danger)' }}>
          {isNegative ? '-' : '+'}{formatSum(amount)}
        </p>
        <p className="text-[10px] text-[var(--color-text-tertiary)] font-mono-tabular">Qoldiq: {formatSum(tx.balance_snapshot)}</p>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function SupplierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [supplier, setSupplier] = useState<SupplierDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPayModal, setShowPayModal] = useState(false);
  
  // Transaction form
  const [form, setForm] = useState({
    type: 'payment' as const,
    amount: '',
    notes: ''
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/suppliers/${id}`);
      if (res.ok) setSupplier(await res.json());
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/suppliers/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        amount: parseFloat(form.amount)
      }),
    });
    if (res.ok) {
      setShowPayModal(false);
      setForm({ type: 'payment', amount: '', notes: '' });
      load();
    }
  };

  if (loading) return (
    <div className="h-[80vh] flex items-center justify-center">
      <div className="h-12 w-12 border-4 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!supplier) return (
    <div className="text-center py-20">
      <h2 className="text-2xl font-bold text-[var(--color-foreground)]">Ta'minotchi topilmadi</h2>
      <Link href="/suppliers" className="text-[var(--color-accent)] mt-4 inline-block hover:underline">Orqaga qaytish</Link>
    </div>
  );

  const balance = Number(supplier.current_balance);

  return (
    <div className="space-y-8 animate-fade-up max-w-5xl mx-auto">
      {/* Breadcrumb & Actions */}
      <div className="flex items-center justify-between">
        <Link 
          href="/suppliers" 
          className="flex items-center gap-2 text-[var(--color-text-secondary)] hover:text-[var(--color-foreground)] transition-colors group"
        >
          <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[var(--color-accent-soft)] group-hover:text-[var(--color-accent)] transition-all">
            <ArrowLeft size={18} />
          </div>
          <span className="font-bold text-sm">Hammasi</span>
        </Link>
        <button
          onClick={() => setShowPayModal(true)}
          className="flex items-center gap-2 px-6 py-2.5 bg-[var(--color-success)] hover:bg-[var(--color-success)]/90 text-white rounded-xl font-bold transition-all shadow-lg shadow-[var(--color-success)]/20"
        >
          <Plus size={18} />
          <span>To'lov / Tuzatish</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="premium-card p-8 rounded-[32px] space-y-6">
            <div className="flex flex-col items-center text-center">
              <div className="h-24 w-24 rounded-3xl bg-[var(--color-accent-soft)] border border-[var(--color-accent)]/20 text-[var(--color-accent)] flex items-center justify-center mb-6 shadow-2xl shadow-[var(--color-accent)]/10">
                <Users size={48} />
              </div>
              <h1 className="text-2xl font-black text-[var(--color-foreground)] leading-tight">{supplier.name}</h1>
              <p className="text-[var(--color-text-secondary)] mt-2 font-medium">{supplier.contact_person || 'Mas\'ul shaxs yo\'q'}</p>
            </div>

            <div className="p-6 rounded-2xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)]">
              <p className="text-[10px] uppercase font-bold text-[var(--color-text-tertiary)] tracking-widest mb-1">Joriy Balans</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-black text-[var(--color-foreground)] font-mono-tabular">
                  {formatSum(Math.abs(balance))}
                </p>
              </div>
              <p className={`text-[10px] mt-2 font-bold ${balance > 0 ? 'text-[var(--color-danger)]' : 'text-[var(--color-success)]'}`}>
                {balance > 0 ? 'SIZNING QARZINGIZ' : 'HISOB-KITOB TO\'LIQ'}
              </p>
            </div>

            <div className="space-y-4 pt-4">
              {supplier.phone && (
                <div className="flex items-center gap-4 text-sm">
                  <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center text-[var(--color-accent)]"><Phone size={14} /></div>
                  <span className="text-[var(--color-text-secondary)] font-medium">{supplier.phone}</span>
                </div>
              )}
              {supplier.email && (
                <div className="flex items-center gap-4 text-sm">
                  <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center text-[var(--color-accent)]"><Mail size={14} /></div>
                  <span className="text-[var(--color-text-secondary)] font-medium truncate">{supplier.email}</span>
                </div>
              )}
              {supplier.address && (
                <div className="flex items-center gap-4 text-sm">
                  <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center text-[var(--color-accent)]"><MapPin size={14} /></div>
                  <span className="text-[var(--color-text-secondary)] font-medium leading-relaxed">{supplier.address}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-[var(--color-foreground)] flex items-center gap-3">
              <History size={20} className="text-[var(--color-accent)]" />
              Operatsiyalar Tarixi
            </h2>
          </div>

          <div className="premium-card rounded-[32px] overflow-hidden">
            <div className="divide-y divide-[var(--color-border-subtle)]">
              {supplier.transactions.length > 0 ? (
                supplier.transactions.map(tx => (
                  <TransactionRow key={tx.id} tx={tx} />
                ))
              ) : (
                <div className="py-20 text-center text-[var(--color-text-secondary)]">
                  <Clock size={40} className="mx-auto mb-4 opacity-20" />
                  <p>Hali hech qanday operatsiya amalga oshirilmagan</p>
                </div>
              )}
            </div>
            {supplier.transactions.length >= 50 && (
              <div className="p-4 text-center border-t border-[var(--color-border-subtle)] bg-white/5">
                <button className="text-xs font-bold text-[var(--color-accent)] uppercase tracking-widest">Ko'proq yuklash</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment/Transaction Modal */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="relative w-full max-w-md bg-[var(--color-bg-card)] rounded-3xl border border-[var(--color-border)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-8 py-6 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-bg-elevated)]">
              <div>
                <h2 className="text-xl font-bold text-[var(--color-foreground)]">Hisob-kitob</h2>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Operatsiya turini va summasini tanlang</p>
              </div>
              <button onClick={() => setShowPayModal(false)} className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-white/5 transition-colors text-[var(--color-text-secondary)]">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleTransaction} className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="flex gap-2 p-1 bg-[var(--color-bg-elevated)] rounded-xl border border-[var(--color-border)]">
                  {(['payment', 'purchase', 'adjustment'] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm({...form, type: t})}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all capitalize ${
                        form.type === t 
                          ? 'bg-[var(--color-accent)] text-white shadow-lg' 
                          : 'text-[var(--color-text-secondary)] hover:bg-white/5'
                      }`}
                    >
                      {t === 'payment' ? 'To\'lov' : t === 'purchase' ? 'Xarid' : 'Tuzatish'}
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--color-text-tertiary)] uppercase ml-1">Summa (so'm) *</label>
                  <div className="relative">
                    <input
                      required
                      type="number"
                      value={form.amount}
                      onChange={e => setForm({...form, amount: e.target.value})}
                      placeholder="0"
                      className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl py-4 px-5 text-lg font-bold text-[var(--color-foreground)] focus:outline-none focus:border-[var(--color-accent)] transition-colors pr-16"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--color-text-tertiary)] uppercase">UZS</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--color-text-tertiary)] uppercase ml-1">Izoh</label>
                  <textarea
                    value={form.notes}
                    onChange={e => setForm({...form, notes: e.target.value})}
                    placeholder="To'lov haqida batafsil ma'lumot..."
                    rows={3}
                    className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-[var(--color-accent)] transition-colors resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="flex-1 px-6 py-3 rounded-xl border border-[var(--color-border)] font-bold text-[var(--color-text-secondary)] hover:bg-white/5 transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className={`flex-1 px-6 py-3 rounded-xl font-bold transition-all shadow-lg text-white ${
                    form.type === 'payment' ? 'bg-[var(--color-success)] shadow-[var(--color-success)]/20' : 
                    form.type === 'purchase' ? 'bg-[var(--color-danger)] shadow-[var(--color-danger)]/20' : 
                    'bg-[var(--color-accent)] shadow-[var(--color-accent)]/20'
                  }`}
                >
                  Tasdiqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
