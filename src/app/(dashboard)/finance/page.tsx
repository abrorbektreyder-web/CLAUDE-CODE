'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingCart,
  Plus, Trash2, Calendar, Filter, ChevronDown, X,
  BarChart3, PieChart, Wallet, ArrowUpRight, ArrowDownRight
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

type ExpenseCategory = {
  id: string;
  name: string;
  type: 'operating' | 'fixed' | 'inventory' | 'marketing' | 'other';
  icon?: string;
  color?: string;
};

type Expense = {
  id: string;
  amount: number;
  currency: string;
  expense_date: string;
  description?: string;
  category: ExpenseCategory;
};

type FinanceSummary = {
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  totalExpenses: number;
  netProfit: number;
  margin: number;
};

const CATEGORY_TYPES = [
  { value: 'operating', label: 'Kunlik (Operatsion)', color: '#3b82f6' },
  { value: 'fixed',     label: 'Doimiy (Ijara/Oylik)', color: '#8b5cf6' },
  { value: 'inventory', label: 'Tovar sotib olish', color: '#f59e0b' },
  { value: 'marketing', label: 'Reklama/Marketing', color: '#ec4899' },
  { value: 'other',     label: 'Boshqa', color: '#6b7280' },
];

// ─── Formatters ──────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat('uz-UZ').format(Math.round(n));
}

// ─── Stat Card ──────────────────────────────────────────────────────────────

function StatCard({
  title, value, sub, icon: Icon, trend, color
}: {
  title: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
  color: string;
}) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 16,
      padding: '20px 24px',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      backdropFilter: 'blur(12px)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: '#94a3b8', fontSize: 13, fontWeight: 500 }}>{title}</span>
        <span style={{
          background: `${color}20`,
          borderRadius: 10,
          padding: '6px 8px',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Icon size={16} color={color} />
        </span>
      </div>
      <div>
        <p style={{ fontSize: 26, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>{value}</p>
        {sub && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
            {trend === 'up' && <ArrowUpRight size={14} color="#22c55e" />}
            {trend === 'down' && <ArrowDownRight size={14} color="#ef4444" />}
            <span style={{ color: trend === 'up' ? '#22c55e' : trend === 'down' ? '#ef4444' : '#64748b', fontSize: 12 }}>{sub}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FinancePage() {
  const [summary, setSummary]       = useState<FinanceSummary | null>(null);
  const [expenses, setExpenses]     = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);

  // Filters
  const today = new Date();
  const [startDate, setStartDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);

  // New expense form
  const [form, setForm] = useState({
    categoryId: '', amount: '', description: '', expenseDate: today.toISOString().split('T')[0]
  });

  // New category form
  const [catForm, setCatForm] = useState({ name: '', type: 'operating' as const, color: '#3b82f6' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, expRes, catRes] = await Promise.all([
        fetch(`/api/finance/summary?start=${startDate}&end=${endDate}`),
        fetch(`/api/finance/expenses?start=${startDate}&end=${endDate}`),
        fetch('/api/finance/categories'),
      ]);
      if (sumRes.ok) setSummary(await sumRes.json());
      if (expRes.ok) setExpenses(await expRes.json());
      if (catRes.ok) setCategories(await catRes.json());
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => { load(); }, [load]);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/finance/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowAddModal(false);
      setForm({ categoryId: '', amount: '', description: '', expenseDate: today.toISOString().split('T')[0] });
      load();
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/finance/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(catForm),
    });
    if (res.ok) {
      setShowCatModal(false);
      setCatForm({ name: '', type: 'operating', color: '#3b82f6' });
      load();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu xarajatni o\'chirasizmi?')) return;
    await fetch(`/api/finance/expenses/${id}`, { method: 'DELETE' });
    load();
  };

  // Group expenses by category for mini chart
  const byCategory = expenses.reduce((acc, e) => {
    const name = e.category?.name || 'Boshqa';
    acc[name] = (acc[name] || 0) + Number(e.amount);
    return acc;
  }, {} as Record<string, number>);

  const totalExp = Object.values(byCategory).reduce((a, b) => a + b, 0);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
      padding: '24px',
      fontFamily: '"Inter", sans-serif',
      color: '#f1f5f9',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
            <BarChart3 size={28} color="#818cf8" />
            Finance Pro
          </h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>
            Tushumlar, xarajatlar va sof foyda tahlili
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setShowCatModal(true)} style={btnOutline}>
            <PieChart size={15} /> Toifa
          </button>
          <button onClick={() => setShowAddModal(true)} style={btnPrimary}>
            <Plus size={15} /> Xarajat qo'shish
          </button>
        </div>
      </div>

      {/* Date Filter */}
      <div style={{
        display: 'flex', gap: 12, alignItems: 'center', marginBottom: 24,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 12, padding: '12px 16px',
      }}>
        <Calendar size={16} color="#64748b" />
        <span style={{ color: '#64748b', fontSize: 13 }}>Davr:</span>
        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={dateInput} />
        <span style={{ color: '#475569' }}>—</span>
        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={dateInput} />
      </div>

      {/* Stat Cards */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
          <StatCard title="Jami Tushum" value={`$${fmt(summary.totalRevenue)}`}
            icon={DollarSign} color="#22c55e" trend="up" sub="Savdolardan" />
          <StatCard title="Tovar Tannarxi" value={`$${fmt(summary.totalCost)}`}
            icon={ShoppingCart} color="#f59e0b" trend="neutral" sub="Xarid narxi" />
          <StatCard title="Yalpi Foyda" value={`$${fmt(summary.grossProfit)}`}
            icon={TrendingUp} color="#818cf8" trend={summary.grossProfit > 0 ? 'up' : 'down'}
            sub={`Margin: ${summary.grossProfit > 0 && summary.totalRevenue > 0 ? ((summary.grossProfit / summary.totalRevenue) * 100).toFixed(1) : 0}%`} />
          <StatCard title="Xarajatlar" value={`$${fmt(summary.totalExpenses)}`}
            icon={TrendingDown} color="#ef4444" trend="down" sub="Jami chiqim" />
          <StatCard
            title="SOF FOYDA" value={`$${fmt(summary.netProfit)}`}
            icon={Wallet} color={summary.netProfit >= 0 ? '#22c55e' : '#ef4444'}
            trend={summary.netProfit >= 0 ? 'up' : 'down'}
            sub={`Margin: ${summary.margin.toFixed(1)}%`} />
        </div>
      )}

      {/* Main Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
        {/* Expenses Table */}
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#e2e8f0' }}>
              Xarajatlar Ro'yxati
            </h2>
            <span style={{ background: '#ef444420', color: '#ef4444', borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>
              {expenses.length} ta yozuv
            </span>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#475569' }}>Yuklanmoqda...</div>
          ) : expenses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <p style={{ color: '#475569', margin: 0 }}>Hozircha xarajat yo'q</p>
              <button onClick={() => setShowAddModal(true)} style={{ ...btnPrimary, marginTop: 12 }}>
                <Plus size={14} /> Birinchi xarajatni qo'shing
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {expenses.map(exp => (
                <div key={exp.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                  background: 'rgba(255,255,255,0.03)', borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.05)',
                  transition: 'background 0.15s',
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: `${exp.category?.color || '#6b7280'}20`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16,
                  }}>
                    {exp.category?.icon || '💸'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: 500, fontSize: 14, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {exp.description || exp.category?.name}
                    </p>
                    <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
                      {exp.category?.name} · {new Date(exp.expense_date).toLocaleDateString('uz-UZ')}
                    </p>
                  </div>
                  <p style={{ margin: 0, fontWeight: 700, color: '#ef4444', fontSize: 15, flexShrink: 0 }}>
                    -${fmt(exp.amount)}
                  </p>
                  <button onClick={() => handleDelete(exp.id)} style={{
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    padding: 6, borderRadius: 6, color: '#475569',
                    flexShrink: 0, display: 'flex',
                  }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Category Breakdown */}
        <div style={card}>
          <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600, color: '#e2e8f0' }}>
            Toifalar bo'yicha
          </h2>
          {Object.keys(byCategory).length === 0 ? (
            <p style={{ color: '#475569', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
              Ma'lumot yo'q
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {Object.entries(byCategory)
                .sort(([, a], [, b]) => b - a)
                .map(([name, amount]) => {
                  const pct = totalExp > 0 ? (amount / totalExp) * 100 : 0;
                  const cat = categories.find(c => c.name === name);
                  const color = cat?.color || '#818cf8';
                  return (
                    <div key={name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 13, color: '#cbd5e1' }}>{name}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>
                          ${fmt(amount)}
                        </span>
                      </div>
                      <div style={{ height: 6, background: 'rgba(255,255,255,0.07)', borderRadius: 99 }}>
                        <div style={{
                          width: `${pct}%`, height: '100%',
                          background: color, borderRadius: 99,
                          transition: 'width 0.4s ease',
                        }} />
                      </div>
                      <span style={{ fontSize: 11, color: '#475569' }}>{pct.toFixed(1)}%</span>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* ─── Add Expense Modal ─── */}
      {showAddModal && (
        <Modal title="Xarajat Qo'shish" onClose={() => setShowAddModal(false)}>
          <form onSubmit={handleAddExpense} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <label style={labelStyle}>
              Toifa *
              <select value={form.categoryId} onChange={e => setForm(p => ({ ...p, categoryId: e.target.value }))}
                required style={inputStyle}>
                <option value="">Tanlang...</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label style={labelStyle}>
              Miqdor (USD) *
              <input type="number" min="0.01" step="0.01" value={form.amount}
                onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                required style={inputStyle} placeholder="0.00" />
            </label>
            <label style={labelStyle}>
              Sana *
              <input type="date" value={form.expenseDate}
                onChange={e => setForm(p => ({ ...p, expenseDate: e.target.value }))}
                required style={inputStyle} />
            </label>
            <label style={labelStyle}>
              Izoh
              <input type="text" value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                style={inputStyle} placeholder="Masalan: Aprel oyi ijarasi" />
            </label>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
              <button type="button" onClick={() => setShowAddModal(false)} style={btnOutline}>Bekor</button>
              <button type="submit" style={btnPrimary}>Saqlash</button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─── Add Category Modal ─── */}
      {showCatModal && (
        <Modal title="Yangi Toifa" onClose={() => setShowCatModal(false)}>
          <form onSubmit={handleAddCategory} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <label style={labelStyle}>
              Toifa nomi *
              <input type="text" value={catForm.name}
                onChange={e => setCatForm(p => ({ ...p, name: e.target.value }))}
                required style={inputStyle} placeholder="Masalan: Ijara" />
            </label>
            <label style={labelStyle}>
              Turi *
              <select value={catForm.type} onChange={e => setCatForm(p => ({ ...p, type: e.target.value as any }))}
                style={inputStyle}>
                {CATEGORY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </label>
            <label style={labelStyle}>
              Rang
              <input type="color" value={catForm.color}
                onChange={e => setCatForm(p => ({ ...p, color: e.target.value }))}
                style={{ ...inputStyle, height: 44, padding: 4, cursor: 'pointer' }} />
            </label>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
              <button type="button" onClick={() => setShowCatModal(false)} style={btnOutline}>Bekor</button>
              <button type="submit" style={btnPrimary}>Yaratish</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ─── Modal Component ─────────────────────────────────────────────────────────

function Modal({ title, children, onClose }: {
  title: string; children: React.ReactNode; onClose: () => void;
}) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 20, padding: 28, width: '100%', maxWidth: 420,
        boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#f1f5f9' }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 4 }}>
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const btnPrimary: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 6,
  background: 'linear-gradient(135deg, #6366f1, #818cf8)',
  color: '#fff', border: 'none', borderRadius: 10,
  padding: '9px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
};

const btnOutline: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 6,
  background: 'transparent',
  color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10, padding: '9px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer',
};

const card: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 16, padding: 20, backdropFilter: 'blur(12px)',
};

const dateInput: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, padding: '6px 10px', color: '#e2e8f0', fontSize: 13,
  colorScheme: 'dark',
};

const labelStyle: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: 6,
  color: '#94a3b8', fontSize: 13, fontWeight: 500,
};

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10, padding: '10px 14px', color: '#f1f5f9', fontSize: 14,
  colorScheme: 'dark', outline: 'none',
};
