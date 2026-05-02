
'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Users, Plus, Phone, Mail, MapPin, 
  ChevronRight, Search, Filter, 
  ArrowUpRight, ArrowDownRight, Wallet, History,
  TrendingUp, TrendingDown, MoreHorizontal
} from 'lucide-react';
import Link from 'next/link';
import { formatSum } from '@/lib/utils';

// ─── Types ──────────────────────────────────────────────────────────────────

type Supplier = {
  id: string;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  current_balance: string | number;
  is_active: boolean;
};

// ─── Components ──────────────────────────────────────────────────────────────

function SupplierCard({ supplier }: { supplier: Supplier }) {
  const balance = Number(supplier.current_balance);
  const isOwed = balance > 0;

  return (
    <Link 
      href={`/suppliers/${supplier.id}`}
      className="group relative overflow-hidden transition-all duration-300 hover:translate-y-[-2px]"
      style={{
        background: 'rgba(24, 25, 27, 0.4)',
        backdropFilter: 'blur(10px)',
        border: '1px solid var(--color-border)',
        borderRadius: 20,
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-accent-soft)] border border-[var(--color-accent)]/20 text-[var(--color-accent)] group-hover:scale-110 transition-transform duration-300">
            <Users size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[var(--color-foreground)] leading-tight">{supplier.name}</h3>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">{supplier.contact_person || 'Mas\'ul shaxs yo\'q'}</p>
          </div>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
          <ChevronRight size={18} />
        </div>
      </div>

      <div className="space-y-3">
        {supplier.phone && (
          <div className="flex items-center gap-3 text-sm text-[var(--color-text-secondary)]">
            <Phone size={14} className="text-[var(--color-accent)]" />
            <span>{supplier.phone}</span>
          </div>
        )}
        {supplier.email && (
          <div className="flex items-center gap-3 text-sm text-[var(--color-text-secondary)]">
            <Mail size={14} className="text-[var(--color-accent)]" />
            <span className="truncate">{supplier.email}</span>
          </div>
        )}
      </div>

      <div className="mt-2 pt-4 border-t border-[var(--color-border-subtle)]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider">Hozirgi Balans</span>
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold ${
            isOwed ? 'bg-[var(--color-danger)]/10 text-[var(--color-danger)]' : 'bg-[var(--color-success)]/10 text-[var(--color-success)]'
          }`}>
            <Wallet size={14} />
            <span className="font-mono-tabular">{formatSum(Math.abs(balance))}</span>
          </div>
        </div>
        <p className="text-[10px] text-[var(--color-text-tertiary)] mt-2 text-right">
          {isOwed ? 'Bizdan qarzdorlik' : 'Qarzdorlik yo\'q'}
        </p>
      </div>
    </Link>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state
  const [form, setForm] = useState({
    name: '', contactPerson: '', phone: '', email: '', address: '', inn: ''
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/suppliers');
      if (res.ok) setSuppliers(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/suppliers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowAddModal(false);
      setForm({ name: '', contactPerson: '', phone: '', email: '', address: '', inn: '' });
      load();
    }
  };

  const filtered = suppliers.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.contact_person?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-4xl text-[var(--color-foreground)]">Ta'minotchilar</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">Barcha hamkorlar va hisob-kitoblar boshqaruvi</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white rounded-xl font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-[var(--color-accent)]/20"
        >
          <Plus size={20} />
          <span>Yangi Ta'minotchi</span>
        </button>
      </div>

      {/* Filters & Stats */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between bg-[var(--color-bg-elevated)] p-4 rounded-2xl border border-[var(--color-border)]">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]" size={18} />
          <input
            type="text"
            placeholder="Nomi yoki mas'ul shaxs bo'yicha qidirish..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-[var(--color-accent)] transition-colors"
          />
        </div>
        <div className="flex items-center gap-6 px-4">
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest text-[var(--color-text-tertiary)] font-bold">Jami Hamkorlar</p>
            <p className="text-xl font-black text-[var(--color-foreground)]">{suppliers.length}</p>
          </div>
          <div className="h-8 w-px bg-[var(--color-border)]" />
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest text-[var(--color-text-tertiary)] font-bold">Umumiy Qarz</p>
            <p className="text-xl font-black text-[var(--color-danger)]">
              {formatSum(suppliers.reduce((acc, s) => acc + (Number(s.current_balance) > 0 ? Number(s.current_balance) : 0), 0))}
            </p>
          </div>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-[280px] rounded-[20px] bg-[var(--color-bg-card)] animate-pulse border border-[var(--color-border)]" />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(s => (
            <SupplierCard key={s.id} supplier={s} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-[var(--color-bg-card)] rounded-3xl border border-dashed border-[var(--color-border)]">
          <div className="h-20 w-20 bg-[var(--color-bg-elevated)] rounded-full flex items-center justify-center text-[var(--color-text-tertiary)] mb-4">
            <Users size={40} />
          </div>
          <h3 className="text-xl font-bold text-[var(--color-foreground)]">Ta'minotchilar topilmadi</h3>
          <p className="text-[var(--color-text-secondary)] mt-1 max-w-xs">
            Hali hech qanday ta'minotchi qo'shilmagan yoki qidiruvga mos kelmadi.
          </p>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="relative w-full max-w-lg bg-[var(--color-bg-card)] rounded-3xl border border-[var(--color-border)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-8 py-6 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-bg-elevated)]">
              <div>
                <h2 className="text-xl font-bold text-[var(--color-foreground)]">Yangi Ta'minotchi</h2>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Hamkorlik ma'lumotlarini kiriting</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-white/5 transition-colors text-[var(--color-text-secondary)]">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAdd} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--color-text-tertiary)] uppercase ml-1">Kompaniya nomi *</label>
                  <input
                    required
                    value={form.name}
                    onChange={e => setForm({...form, name: e.target.value})}
                    placeholder="Masalan: Apple Distribution"
                    className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-[var(--color-accent)] transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--color-text-tertiary)] uppercase ml-1">Mas'ul shaxs</label>
                  <input
                    value={form.contactPerson}
                    onChange={e => setForm({...form, contactPerson: e.target.value})}
                    placeholder="Ism sharifi"
                    className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-[var(--color-accent)] transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--color-text-tertiary)] uppercase ml-1">Telefon raqam</label>
                  <input
                    value={form.phone}
                    onChange={e => setForm({...form, phone: e.target.value})}
                    placeholder="+998 90 123 45 67"
                    className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-[var(--color-accent)] transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--color-text-tertiary)] uppercase ml-1">INN</label>
                  <input
                    value={form.inn}
                    onChange={e => setForm({...form, inn: e.target.value})}
                    placeholder="Soliq raqami"
                    className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-[var(--color-accent)] transition-colors"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--color-text-tertiary)] uppercase ml-1">Manzil</label>
                <textarea
                  value={form.address}
                  onChange={e => setForm({...form, address: e.target.value})}
                  placeholder="Do'kon yoki ombor manzili"
                  rows={2}
                  className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-[var(--color-accent)] transition-colors resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-6 py-3 rounded-xl border border-[var(--color-border)] font-bold text-[var(--color-text-secondary)] hover:bg-white/5 transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white rounded-xl font-bold transition-all shadow-lg shadow-[var(--color-accent)]/20"
                >
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function X({ size, className }: { size?: number, className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size || 24} 
      height={size || 24} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
