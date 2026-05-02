'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Search, Filter, Plus, MoreHorizontal, Package,
  Smartphone, Headphones, Watch, AlertTriangle,
  X, ChevronDown, Loader2, Check, SlidersHorizontal
} from 'lucide-react';
import { cn, formatSum, formatUSD } from '@/lib/utils';

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  brand: string | null;
  model: string | null;
  productType: string;
  costPrice: string;
  retailPrice: string;
  wholesalePrice: string | null;
  minStock: number;
  warrantyMonths: number;
  description: string | null;
  imageUrl: string | null;
  totalQuantity: number;
  phoneCount: number;
}

interface InventoryListProps {
  initialData: InventoryItem[];
}

const PRODUCT_TYPES = [
  { value: 'all', label: 'Barcha turlar' },
  { value: 'phone', label: 'Telefonlar' },
  { value: 'accessory', label: 'Aksessuarlar' },
  { value: 'tablet', label: 'Planshetlar' },
  { value: 'wearable', label: 'Soatlar' },
  { value: 'other', label: 'Boshqalar' },
];

// ── Add Product Modal ──────────────────────────────────────────────────────

function AddProductModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (item: InventoryItem) => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '', brand: '', model: '', sku: '', barcode: '',
    productType: 'accessory' as string,
    costPrice: '', retailPrice: '', wholesalePrice: '',
    minStock: '5', warrantyMonths: '12', description: '',
  });

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          brand: form.brand || undefined,
          model: form.model || undefined,
          sku: form.sku,
          barcode: form.barcode || undefined,
          productType: form.productType,
          costPrice: Number(form.costPrice),
          retailPrice: Number(form.retailPrice),
          wholesalePrice: form.wholesalePrice ? Number(form.wholesalePrice) : undefined,
          minStock: Number(form.minStock),
          warrantyMonths: Number(form.warrantyMonths),
          description: form.description || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Xato yuz berdi');
      const p = json.product;
      onSuccess({
        id: p.id, name: p.name, sku: p.sku, barcode: p.barcode,
        brand: p.brand, model: p.model, productType: p.product_type,
        costPrice: String(p.cost_price),
        retailPrice: String(p.retail_price),
        wholesalePrice: p.wholesale_price ? String(p.wholesale_price) : null,
        minStock: p.min_stock,
        warrantyMonths: p.warranty_months || 0,
        description: p.description || null,
        imageUrl: p.image_url || null,
        totalQuantity: 0, phoneCount: 0,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20 transition-all placeholder:text-[var(--color-text-tertiary)]";
  const labelCls = "block text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)] mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <div className="relative w-full max-w-2xl rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border)] p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-accent)]/10">
              <Plus size={18} className="text-[var(--color-accent)]" />
            </div>
            <div>
              <h2 className="font-bold text-base">Yangi tovar qo'shish</h2>
              <p className="text-[11px] text-[var(--color-text-tertiary)]">Mahsulot ma'lumotlarini kiriting</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-elevated)] transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
          <div className="p-5 space-y-5">
            {error && (
              <div className="rounded-xl border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 px-4 py-3 text-sm text-[var(--color-danger)]">
                {error}
              </div>
            )}

            {/* Product Type */}
            <div>
              <label className={labelCls}>Tovar turi *</label>
              <input
                list="product-types"
                value={form.productType}
                onChange={set('productType')}
                placeholder="masalan: Telefon, Chexol, Xizmat..."
                className={inputCls}
                required
              />
              <datalist id="product-types">
                <option value="Telefon" />
                <option value="Aksessuar" />
                <option value="Planshet" />
                <option value="Soat" />
              </datalist>
            </div>

            {/* Name */}
            <div>
              <label className={labelCls}>Tovar nomi *</label>
              <input value={form.name} onChange={set('name')} placeholder="masalan: iPhone 15 Pro Max" className={inputCls} required />
            </div>

            {/* Brand & Model */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Brend</label>
                <input value={form.brand} onChange={set('brand')} placeholder="Apple, Samsung..." className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Model</label>
                <input value={form.model} onChange={set('model')} placeholder="15 Pro Max" className={inputCls} />
              </div>
            </div>

            {/* IMEI & Barcode */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>IMEI *</label>
                <input value={form.sku} onChange={set('sku')} placeholder="351234567890123" className={inputCls} required />
              </div>
              <div>
                <label className={labelCls}>Barcode</label>
                <input value={form.barcode} onChange={set('barcode')} placeholder="0123456789012" className={inputCls} />
              </div>
            </div>

            {/* Prices */}
            <div>
              <label className={labelCls}>Narxlar (so'm) *</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <input value={form.costPrice} onChange={set('costPrice')} type="number" min="0" placeholder="Tannarx" className={inputCls} required />
                  <span className="mt-1 block text-[10px] text-[var(--color-text-tertiary)]">Tannarx</span>
                </div>
                <div>
                  <input value={form.retailPrice} onChange={set('retailPrice')} type="number" min="0" placeholder="Chakana" className={inputCls} required />
                  <span className="mt-1 block text-[10px] text-[var(--color-text-tertiary)]">Chakana narx</span>
                </div>
                <div>
                  <input value={form.wholesalePrice} onChange={set('wholesalePrice')} type="number" min="0" placeholder="Ulgurji" className={inputCls} />
                  <span className="mt-1 block text-[10px] text-[var(--color-text-tertiary)]">Ulgurji narx</span>
                </div>
              </div>
            </div>

            {/* Min stock & Warranty */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Min. zaxira (dona)</label>
                <input value={form.minStock} onChange={set('minStock')} type="number" min="0" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Kafolat (oy)</label>
                <input value={form.warrantyMonths} onChange={set('warrantyMonths')} type="number" min="0" className={inputCls} />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className={labelCls}>Izoh</label>
              <textarea value={form.description} onChange={set('description')} rows={2} placeholder="Qo'shimcha ma'lumot..." className={cn(inputCls, 'resize-none')} />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 border-t border-[var(--color-border)] p-4">
          <button type="button" onClick={onClose} disabled={loading}
            className="w-full sm:w-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-5 py-2.5 text-sm font-semibold transition-all hover:bg-[var(--color-bg-hover)] disabled:opacity-50">
            Bekor qilish
          </button>
          <button
            onClick={handleSubmit as any}
            disabled={loading}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[var(--color-accent)]/20 transition-all hover:opacity-90 disabled:opacity-50">
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
            {loading ? 'Saqlanmoqda...' : 'Saqlash'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Filter Panel ───────────────────────────────────────────────────────────

function FilterPanel({
  filterType, setFilterType, onClose, options
}: {
  filterType: string;
  setFilterType: (v: string) => void;
  onClose: () => void;
  options: { value: string, label: string }[];
}) {
  return (
    <div className="absolute right-0 top-full z-40 mt-2 w-56 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-2xl overflow-hidden">
      <div className="border-b border-[var(--color-border)] px-4 py-3">
        <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">Tovar turi</p>
      </div>
      <div className="p-2">
        {options.map(t => (
          <button
            key={t.value}
            onClick={() => { setFilterType(t.value); onClose(); }}
            className={cn(
              "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              filterType === t.value
                ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                : "text-[var(--color-foreground)] hover:bg-[var(--color-bg-elevated)]"
            )}
          >
            {t.label}
            {filterType === t.value && <Check size={14} />}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Edit Product Modal ─────────────────────────────────────────────────────

function EditProductModal({
  item,
  onClose,
  onSuccess
}: {
  item: InventoryItem;
  onClose: () => void;
  onSuccess: (item: InventoryItem) => void
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: item.name,
    brand: item.brand || '',
    model: item.model || '',
    sku: item.sku,
    barcode: item.barcode || '',
    productType: item.productType,
    costPrice: item.costPrice,
    retailPrice: item.retailPrice,
    wholesalePrice: item.wholesalePrice || '',
    minStock: String(item.minStock),
    warrantyMonths: String(item.warrantyMonths),
    description: item.description || '',
  });

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          name: form.name,
          brand: form.brand || undefined,
          model: form.model || undefined,
          sku: form.sku,
          barcode: form.barcode || undefined,
          productType: form.productType,
          costPrice: Number(form.costPrice),
          retailPrice: Number(form.retailPrice),
          wholesalePrice: form.wholesalePrice ? Number(form.wholesalePrice) : undefined,
          minStock: Number(form.minStock),
          warrantyMonths: Number(form.warrantyMonths),
          description: form.description || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Xato yuz berdi');
      const p = json.product;
      onSuccess({
        ...item,
        id: p.id, name: p.name, sku: p.sku, barcode: p.barcode,
        brand: p.brand, model: p.model, productType: p.product_type,
        costPrice: String(p.cost_price),
        retailPrice: String(p.retail_price),
        wholesalePrice: p.wholesale_price ? String(p.wholesale_price) : null,
        minStock: p.min_stock,
        warrantyMonths: p.warranty_months,
        description: p.description,
        imageUrl: p.image_url,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20 transition-all placeholder:text-[var(--color-text-tertiary)]";
  const labelCls = "block text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)] mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <div className="relative w-full max-w-2xl rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border)] p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-accent)]/10">
              <Package size={18} className="text-[var(--color-accent)]" />
            </div>
            <div>
              <h2 className="font-bold text-base">Tovarni tahrirlash</h2>
              <p className="text-[11px] text-[var(--color-text-tertiary)]">{item.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-elevated)] transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
          <div className="p-5 space-y-5">
            {error && (
              <div className="rounded-xl border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 px-4 py-3 text-sm text-[var(--color-danger)]">
                {error}
              </div>
            )}

            {/* Product Type */}
            <div>
              <label className={labelCls}>Tovar turi *</label>
              <input
                list="product-types"
                value={form.productType}
                onChange={set('productType')}
                placeholder="masalan: Telefon, Chexol, Xizmat..."
                className={inputCls}
                required
              />
              <datalist id="product-types">
                <option value="Telefon" />
                <option value="Aksessuar" />
                <option value="Planshet" />
                <option value="Soat" />
              </datalist>
            </div>

            {/* Name */}
            <div>
              <label className={labelCls}>Tovar nomi *</label>
              <input value={form.name} onChange={set('name')} placeholder="masalan: iPhone 15 Pro Max" className={inputCls} required />
            </div>

            {/* Brand & Model */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Brend</label>
                <input value={form.brand} onChange={set('brand')} placeholder="Apple, Samsung..." className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Model</label>
                <input value={form.model} onChange={set('model')} placeholder="15 Pro Max" className={inputCls} />
              </div>
            </div>

            {/* IMEI & Barcode */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>IMEI *</label>
                <input value={form.sku} onChange={set('sku')} placeholder="351234567890123" className={inputCls} required />
              </div>
              <div>
                <label className={labelCls}>Barcode</label>
                <input value={form.barcode} onChange={set('barcode')} placeholder="0123456789012" className={inputCls} />
              </div>
            </div>

            {/* Prices */}
            <div>
              <label className={labelCls}>Narxlar (so'm) *</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <input value={form.costPrice} onChange={set('costPrice')} type="number" min="0" placeholder="Tannarx" className={inputCls} required />
                  <span className="mt-1 block text-[10px] text-[var(--color-text-tertiary)]">Tannarx</span>
                </div>
                <div>
                  <input value={form.retailPrice} onChange={set('retailPrice')} type="number" min="0" placeholder="Chakana" className={inputCls} required />
                  <span className="mt-1 block text-[10px] text-[var(--color-text-tertiary)]">Chakana narx</span>
                </div>
                <div>
                  <input value={form.wholesalePrice} onChange={set('wholesalePrice')} type="number" min="0" placeholder="Ulgurji" className={inputCls} />
                  <span className="mt-1 block text-[10px] text-[var(--color-text-tertiary)]">Ulgurji narx</span>
                </div>
              </div>
            </div>

            {/* Min stock & Warranty */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Min. zaxira (dona)</label>
                <input value={form.minStock} onChange={set('minStock')} type="number" min="0" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Kafolat (oy)</label>
                <input value={form.warrantyMonths} onChange={set('warrantyMonths')} type="number" min="0" className={inputCls} />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className={labelCls}>Izoh</label>
              <textarea value={form.description} onChange={set('description')} rows={2} placeholder="Qo'shimcha ma'lumot..." className={cn(inputCls, 'resize-none')} />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 border-t border-[var(--color-border)] p-4">
          <button type="button" onClick={onClose} disabled={loading}
            className="w-full sm:w-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-5 py-2.5 text-sm font-semibold transition-all hover:bg-[var(--color-bg-hover)] disabled:opacity-50">
            Bekor qilish
          </button>
          <button
            onClick={handleSubmit as any}
            disabled={loading}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[var(--color-accent)]/20 transition-all hover:opacity-90 disabled:opacity-50">
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
            {loading ? 'Saqlanmoqda...' : 'Saqlash'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Action Menu ─────────────────────────────────────────────────────────────

function ActionMenu({
  onEdit,
  onDelete
}: {
  onEdit: () => void;
  onDelete: () => void
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-lg p-2 text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-foreground)] transition-colors"
      >
        <MoreHorizontal size={18} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-40 mt-1 w-32 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-1 shadow-xl">
          <button
            onClick={() => { onEdit(); setIsOpen(false); }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium hover:bg-[var(--color-bg-elevated)] transition-colors"
          >
            Tahrirlash
          </button>
          <button
            onClick={() => { if (confirm('Haqiqatdan ham o\'chirmoqchimisiz?')) onDelete(); setIsOpen(false); }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 transition-colors"
          >
            O'chirish
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export function InventoryList({ initialData }: InventoryListProps) {
  const [items, setItems] = useState<InventoryItem[]>(initialData);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showFilter, setShowFilter] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  // Close filter panel on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setShowFilter(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filteredData = items.filter(item => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase()) ||
      (item.barcode?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      (item.brand?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchesType = filterType === 'all' || item.productType === filterType;
    return matchesSearch && matchesType;
  });

  const getIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t === 'phone' || t === 'telefon') return <Smartphone size={18} />;
    if (t === 'accessory' || t === 'aksessuar') return <Headphones size={18} />;
    if (t === 'tablet' || t === 'planshet') return <Smartphone size={18} />;
    if (t === 'wearable' || t === 'soat') return <Watch size={18} />;
    return <Package size={18} />;
  };

  const formatPrice = (price: string | number) =>
    formatSum(price, false);

  const uniqueTypes = Array.from(new Set(items.map(i => i.productType))).filter(Boolean);
  const dynamicTypes = [
    { value: 'all', label: 'Barcha turlar' },
    ...uniqueTypes.map(t => ({ value: t, label: t }))
  ];

  const activeFilterLabel = dynamicTypes.find(t => t.value === filterType)?.label || 'Barcha turlar';
  const totalValue = items.reduce((acc, i) => acc + Number(i.retailPrice) * (i.totalQuantity + i.phoneCount), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">Ombor</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">Mavjud tovarlar va zaxira nazorati</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Add Product Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 rounded-xl bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[var(--color-accent)]/20 transition-all hover:opacity-90 active:scale-95"
          >
            <Plus size={16} />
            Qo'shish
          </button>
          {/* Filter button */}
          <div className="relative" ref={filterRef}>
            <button
              id="inventory-filter-btn"
              onClick={() => setShowFilter(v => !v)}
              className={cn(
                "flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all",
                showFilter || filterType !== 'all'
                  ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                  : "border-[var(--color-border)] bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-hover)]"
              )}
            >
              <SlidersHorizontal size={16} />
              Filtr
              {filterType !== 'all' && (
                <span className="ml-1 rounded-full bg-[var(--color-accent)] px-1.5 py-0.5 text-[10px] text-white font-bold">1</span>
              )}
            </button>
            {showFilter && (
              <FilterPanel
                filterType={filterType}
                setFilterType={setFilterType}
                onClose={() => setShowFilter(false)}
                options={dynamicTypes}
              />
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
        <div className="premium-card rounded-2xl p-4 md:p-5">
          <div className="mb-2 text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">Jami tovarlar</div>
          <div className="text-xl md:text-2xl font-bold">{items.length} <span className="text-[10px] md:text-xs font-normal text-[var(--color-text-tertiary)]">tur</span></div>
        </div>
        <div className="premium-card rounded-2xl p-4 md:p-5 border-l-4 border-l-[var(--color-accent)]">
          <div className="mb-2 text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">Zaxira (Umumiy)</div>
          <div className="text-xl md:text-2xl font-bold">{items.reduce((acc, i) => acc + i.totalQuantity + i.phoneCount, 0)} <span className="text-[10px] md:text-xs font-normal text-[var(--color-text-tertiary)]">dona</span></div>
        </div>
        <div className="premium-card rounded-2xl p-4 md:p-5">
          <div className="mb-2 text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">Kam qolganlar</div>
          <div className="flex items-center gap-2">
            <div className="text-xl md:text-2xl font-bold text-[var(--color-danger)]">
              {items.filter(i => (i.totalQuantity + i.phoneCount) <= i.minStock).length}
            </div>
            <AlertTriangle size={14} className="text-[var(--color-danger)]" />
          </div>
        </div>
        <div className="premium-card rounded-2xl p-4 md:p-5 sm:col-span-2 md:col-span-1">
          <div className="mb-2 text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">Ombor qiymati</div>
          <div className="text-lg md:text-xl font-bold">
            {totalValue > 0 ? (
              <div className="flex flex-col">
                <div className="flex items-baseline gap-1">
                  <span>~ {formatSum(Math.round(totalValue / 1_000_000), false)} mln</span>
                  <span className="text-[10px] font-normal text-[var(--color-text-tertiary)]">so'm</span>
                </div>
                <div className="text-sm text-[var(--color-accent)] font-semibold">
                  {formatUSD(totalValue)}
                </div>
              </div>
            ) : (
              '~ 1.2 mlrd so\'m'
            )}
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="premium-card overflow-hidden rounded-2xl">
        <div className="flex flex-col md:flex-row items-center gap-4 border-b border-[var(--color-border)] p-4">
          <div className="relative w-full md:flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]" size={18} />
            <input
              type="text"
              placeholder="Qidirish..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)]/50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[var(--color-accent)] focus:ring-4 focus:ring-[var(--color-accent)]/10 transition-all"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full md:w-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-2.5 text-sm font-semibold outline-none focus:border-[var(--color-accent)] transition-all cursor-pointer"
          >
            {dynamicTypes.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-elevated)]/30 text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                <th className="px-6 py-4">Tovar</th>
                <th className="px-6 py-4">Turi</th>
                <th className="px-6 py-4">IMEI / Barcode</th>
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
                    <td className="px-6 py-4 capitalize">{item.productType}</td>
                    <td className="px-6 py-4 font-mono text-xs">
                      <div className="text-[var(--color-foreground)]">{item.sku}</div>
                      <div className="text-[var(--color-text-tertiary)]">{item.barcode}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <div className="font-bold text-sm">{formatSum(item.retailPrice)}</div>
                        <div className="text-[11px] font-bold text-[var(--color-accent)]">
                          {formatUSD(item.retailPrice)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={cn("font-bold text-lg", isLow ? "text-[var(--color-danger)]" : "text-[var(--color-foreground)]")}>
                        {stock}
                      </div>
                      <div className="text-[10px] text-[var(--color-text-tertiary)] uppercase font-bold">DONA</div>
                    </td>
                    <td className="px-6 py-4">
                      {isLow ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-danger)]/10 px-2.5 py-0.5 text-[10px] font-bold text-[var(--color-danger)] border border-[var(--color-danger)]/20">Kam qolgan</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-success)]/10 px-2.5 py-0.5 text-[10px] font-bold text-[var(--color-success)] border border-[var(--color-success)]/20">Mavjud</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ActionMenu
                        onEdit={() => setEditingItem(item)}
                        onDelete={async () => {
                          try {
                            const res = await fetch(`/api/inventory?id=${item.id}`, { method: 'DELETE' });
                            if (res.ok) setItems(prev => prev.filter(i => i.id !== item.id));
                          } catch (err) { console.error('Delete error:', err); }
                        }}
                      />
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={7} className="px-6 py-16 text-center text-[var(--color-text-tertiary)]">Topilmadi</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-[var(--color-border)]">
          {filteredData.length > 0 ? filteredData.map((item) => {
            const stock = item.productType === 'phone' ? item.phoneCount : item.totalQuantity;
            const isLow = stock <= item.minStock;
            return (
              <div key={item.id} className="p-4 space-y-4 active:bg-[var(--color-bg-hover)] transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-[var(--color-text-tertiary)]">
                      {getIcon(item.productType)}
                    </div>
                    <div>
                      <div className="font-bold text-base leading-tight mb-0.5">{item.name}</div>
                      <div className="text-[10px] text-[var(--color-text-tertiary)] uppercase font-bold tracking-wider">{item.brand} {item.model}</div>
                    </div>
                  </div>
                  <ActionMenu
                    onEdit={() => setEditingItem(item)}
                    onDelete={async () => {
                      try {
                        const res = await fetch(`/api/inventory?id=${item.id}`, { method: 'DELETE' });
                        if (res.ok) setItems(prev => prev.filter(i => i.id !== item.id));
                      } catch (err) { console.error('Delete error:', err); }
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex flex-col">
                      <div className="font-bold text-base leading-none mb-1">{formatSum(item.retailPrice)}</div>
                      <div className="text-xs font-bold text-[var(--color-accent)]">{formatUSD(item.retailPrice)}</div>
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase text-[var(--color-text-tertiary)] mb-0.5">Qoldiq</div>
                    <div className={cn("font-bold text-base", isLow ? "text-[var(--color-danger)]" : "text-[var(--color-foreground)]")}>
                      {stock} <span className="text-[10px] text-[var(--color-text-tertiary)]">DONA</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border)]/50">
                  <div className="text-[10px] font-mono text-[var(--color-text-tertiary)] truncate max-w-[150px]">
                    {item.sku}
                  </div>
                  {isLow ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-danger)]/10 px-2 py-0.5 text-[9px] font-bold text-[var(--color-danger)] border border-[var(--color-danger)]/20">Kam qolgan</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-success)]/10 px-2 py-0.5 text-[9px] font-bold text-[var(--color-success)] border border-[var(--color-success)]/20">Mavjud</span>
                  )}
                </div>
              </div>
            );
          }) : (
            <div className="p-12 text-center text-[var(--color-text-tertiary)]">Topilmadi</div>
          )}
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <AddProductModal
          onClose={() => setShowAddModal(false)}
          onSuccess={(newItem) => {
            setItems(prev => [newItem, ...prev]);
            setShowAddModal(false);
          }}
        />
      )}

      {/* Edit Modal */}
      {editingItem && (
        <EditProductModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSuccess={(updatedItem) => {
            setItems(prev => prev.map(i => i.id === updatedItem.id ? updatedItem : i));
            setEditingItem(null);
          }}
        />
      )}
    </div>
  );
}
