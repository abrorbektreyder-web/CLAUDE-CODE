'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  ScanBarcode, 
  Search, 
  ShoppingCart, 
  User, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  Banknote, 
  Clock, 
  ChevronRight,
  Monitor,
  Keyboard,
  Settings,
  LogOut,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  type: 'phone' | 'accessory';
  imei?: string;
}

export function PosInterface() {
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'F2') {
        e.preventDefault();
        setIsPaymentModalOpen(true);
      }
      if (e.key === 'Escape') {
        setIsPaymentModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  return (
    <div className="flex h-screen w-full bg-[var(--color-bg-base)] text-[var(--color-foreground)] overflow-hidden">
      {/* Left Sidebar - Quick Actions */}
      <div className="flex w-16 flex-col items-center border-r border-[var(--color-border)] bg-[var(--color-bg-elevated)] py-6 gap-6">
        <div className="h-10 w-10 rounded-xl bg-[var(--color-accent)] flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-[var(--color-accent)]/20">
          M
        </div>
        <button className="p-3 rounded-xl hover:bg-[var(--color-bg-hover)] text-[var(--color-text-tertiary)] transition-colors">
          <Monitor size={24} />
        </button>
        <button className="p-3 rounded-xl bg-[var(--color-accent)]/10 text-[var(--color-accent)] transition-colors">
          <ShoppingCart size={24} />
        </button>
        <button className="p-3 rounded-xl hover:bg-[var(--color-bg-hover)] text-[var(--color-text-tertiary)] transition-colors">
          <Clock size={24} />
        </button>
        <div className="mt-auto flex flex-col gap-4">
          <button className="p-3 rounded-xl hover:bg-[var(--color-bg-hover)] text-[var(--color-text-tertiary)] transition-colors">
            <Settings size={24} />
          </button>
          <button className="p-3 rounded-xl hover:bg-red-500/10 text-red-500 transition-colors">
            <LogOut size={24} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 border-b border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="font-display text-xl font-bold">Kassa #1</h1>
            <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-success)]/10 px-3 py-1 text-[10px] font-bold text-[var(--color-success)] border border-[var(--color-success)]/20">
              <div className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)] animate-pulse" />
              Smena ochiq
            </span>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-sm font-bold">Alisher Qodirov</div>
              <div className="text-[10px] font-bold uppercase text-[var(--color-text-tertiary)]">Kassir / Filial #1</div>
            </div>
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[var(--color-accent)] to-orange-400" />
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 p-6 flex gap-6 overflow-hidden">
          {/* Product Search & Catalog */}
          <div className="flex-1 flex flex-col gap-6 min-w-0">
            {/* Search Bar */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-4 flex items-center text-[var(--color-text-tertiary)] group-focus-within:text-[var(--color-accent)] transition-colors">
                <ScanBarcode size={24} />
              </div>
              <input 
                ref={searchInputRef}
                autoFocus
                type="text" 
                placeholder="Barcode skaner qiling yoki tovar nomini yozing... (F1)"
                className="w-full h-16 rounded-2xl bg-[var(--color-bg-elevated)] border-2 border-[var(--color-border)] px-14 text-lg font-medium outline-none focus:border-[var(--color-accent)] focus:ring-8 focus:ring-[var(--color-accent)]/5 transition-all shadow-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div className="absolute inset-y-0 right-4 flex items-center">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--color-bg-base)] border border-[var(--color-border)] text-[10px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider">
                  <Keyboard size={12} />
                  F1 Qidirish
                </div>
              </div>
            </div>

            {/* Catalog Grid (Mock) */}
            <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 content-start custom-scrollbar">
              {mockProducts.map((p) => (
                <button 
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className="premium-card group rounded-2xl p-4 text-left hover:border-[var(--color-accent)] transition-all active:scale-95"
                >
                  <div className="mb-3 aspect-square rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)] flex items-center justify-center group-hover:bg-[var(--color-accent)]/5 transition-colors overflow-hidden">
                    {p.type === 'phone' ? <Smartphone size={32} className="text-[var(--color-text-tertiary)] group-hover:text-[var(--color-accent)]" /> : <Headphones size={32} className="text-[var(--color-text-tertiary)] group-hover:text-[var(--color-accent)]" />}
                  </div>
                  <div className="font-bold text-sm line-clamp-2 h-10 mb-1">{p.name}</div>
                  <div className="text-[10px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider mb-3">{p.brand}</div>
                  <div className="flex items-end justify-between">
                    <div className="font-display text-lg font-bold text-[var(--color-accent)]">
                      {new Intl.NumberFormat('uz-UZ').format(p.price)}
                    </div>
                    <div className="text-[10px] font-bold text-[var(--color-text-tertiary)] mb-1">SO'M</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right Sidebar - Cart */}
          <div className="w-[400px] flex flex-col bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-3xl overflow-hidden shadow-2xl">
            {/* Cart Header */}
            <div className="p-6 border-b border-[var(--color-border)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[var(--color-accent)]/10 flex items-center justify-center text-[var(--color-accent)]">
                  <ShoppingCart size={20} />
                </div>
                <div>
                  <div className="font-bold">Savat</div>
                  <div className="text-[10px] font-bold uppercase text-[var(--color-text-tertiary)]">{cart.length} ta mahsulot</div>
                </div>
              </div>
              <button 
                onClick={() => setCart([])}
                className="p-2 text-[var(--color-text-tertiary)] hover:text-red-500 transition-colors"
              >
                <Trash2 size={20} />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar">
              {cart.length > 0 ? cart.map((item) => (
                <div key={item.id} className="p-3 rounded-2xl bg-[var(--color-bg-base)] border border-[var(--color-border)] flex flex-col gap-3 group">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm truncate">{item.name}</div>
                      {item.imei && <div className="text-[10px] font-mono text-[var(--color-accent)]">IMEI: {item.imei}</div>}
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="text-[var(--color-text-tertiary)] hover:text-red-500 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-1">
                      <button 
                        onClick={() => updateQuantity(item.id, -1)}
                        className="p-1 rounded-md hover:bg-[var(--color-bg-hover)] transition-colors"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, 1)}
                        className="p-1 rounded-md hover:bg-[var(--color-bg-hover)] transition-colors"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{new Intl.NumberFormat('uz-UZ').format(item.price * item.quantity)}</div>
                      <div className="text-[9px] font-bold text-[var(--color-text-tertiary)] uppercase">SO'M</div>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="flex-1 flex flex-col items-center justify-center text-[var(--color-text-tertiary)] opacity-30 gap-3">
                  <ShoppingCart size={64} strokeWidth={1} />
                  <p className="font-medium">Savat bo'sh</p>
                </div>
              )}
            </div>

            {/* Cart Footer */}
            <div className="p-6 bg-[var(--color-bg-base)] border-t border-[var(--color-border)] space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[var(--color-text-secondary)]">Jami</span>
                <div className="text-right">
                  <span className="text-3xl font-display font-bold text-[var(--color-accent)]">
                    {new Intl.NumberFormat('uz-UZ').format(total)}
                  </span>
                  <span className="text-[10px] font-bold text-[var(--color-text-tertiary)] ml-1 uppercase">SO'M</span>
                </div>
              </div>

              <button 
                onClick={() => setIsPaymentModalOpen(true)}
                disabled={cart.length === 0}
                className="w-full h-16 rounded-2xl bg-[var(--color-accent)] text-white font-bold text-xl flex items-center justify-center gap-3 shadow-xl shadow-[var(--color-accent)]/30 hover:bg-[var(--color-accent-hover)] transition-all active:scale-[0.98] disabled:opacity-50 disabled:grayscale disabled:scale-100"
              >
                <Banknote size={24} />
                To'lov (F2)
              </button>
              <div className="text-center">
                <span className="text-[10px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest">Klaviatura orqali boshqarish</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-[var(--color-bg-elevated)] rounded-[32px] border border-[var(--color-border)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 flex flex-col gap-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-display font-bold">To'lov</h2>
                  <p className="text-sm text-[var(--color-text-secondary)]">To'lov turini tanlang va chekni chop eting</p>
                </div>
                <button 
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="h-12 w-12 rounded-full border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-hover)] transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex flex-col items-center justify-center p-10 rounded-[24px] bg-[var(--color-bg-base)] border border-[var(--color-border)]">
                <div className="text-[12px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-[0.2em] mb-2">Umumiy summa</div>
                <div className="text-6xl font-display font-bold text-[var(--color-foreground)]">
                  {new Intl.NumberFormat('uz-UZ').format(total)}
                </div>
                <div className="text-xs font-bold text-[var(--color-text-tertiary)] mt-2 uppercase">O'zbekiston so'mi</div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <button className="flex flex-col items-center gap-4 p-6 rounded-2xl border-2 border-[var(--color-border)] hover:border-[var(--color-accent)] hover:bg-[var(--color-accent)]/5 transition-all group">
                  <div className="h-14 w-14 rounded-full bg-[var(--color-success)]/10 flex items-center justify-center text-[var(--color-success)] group-hover:scale-110 transition-transform">
                    <Banknote size={28} />
                  </div>
                  <div className="font-bold">Naqd</div>
                </button>
                <button className="flex flex-col items-center gap-4 p-6 rounded-2xl border-2 border-[var(--color-border)] hover:border-[var(--color-accent)] hover:bg-[var(--color-accent)]/5 transition-all group">
                  <div className="h-14 w-14 rounded-full bg-[var(--color-info)]/10 flex items-center justify-center text-[var(--color-info)] group-hover:scale-110 transition-transform">
                    <CreditCard size={28} />
                  </div>
                  <div className="font-bold">Karta</div>
                </button>
                <button className="flex flex-col items-center gap-4 p-6 rounded-2xl border-2 border-[var(--color-border)] hover:border-[var(--color-accent)] hover:bg-[var(--color-accent)]/5 transition-all group">
                  <div className="h-14 w-14 rounded-full bg-[var(--color-purple)]/10 flex items-center justify-center text-[var(--color-purple)] group-hover:scale-110 transition-transform">
                    <HandCoins size={28} />
                  </div>
                  <div className="font-bold">Nasiya</div>
                </button>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="flex-1 h-16 rounded-2xl border border-[var(--color-border)] font-bold text-lg hover:bg-[var(--color-bg-hover)] transition-all"
                >
                  Bekor qilish
                </button>
                <button className="flex-[2] h-16 rounded-2xl bg-[var(--color-accent)] text-white font-bold text-xl shadow-xl shadow-[var(--color-accent)]/20 hover:bg-[var(--color-accent-hover)] transition-all">
                  To'lovni yakunlash & Chek
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--color-border);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: var(--color-text-tertiary);
        }
      `}</style>
    </div>
  );
}

const mockProducts = [
  { id: '1', name: 'iPhone 15 Pro Max, 256GB, Blue Titanium', brand: 'Apple', price: 16450000, type: 'phone', imei: '358291039284712' },
  { id: '2', name: 'Samsung Galaxy S24 Ultra, 512GB, Gray', brand: 'Samsung', price: 14200000, type: 'phone', imei: '357712039200192' },
  { id: '3', name: 'AirPods Pro (2nd Gen) with MagSafe', brand: 'Apple', price: 2850000, type: 'accessory' },
  { id: '4', name: 'Xiaomi Redmi Note 13 Pro+, 12/512GB', brand: 'Xiaomi', price: 4600000, type: 'phone', imei: '359910029384755' },
  { id: '5', name: 'Apple Watch Series 9, 45mm, GPS', brand: 'Apple', price: 5200000, type: 'accessory' },
  { id: '6', name: 'Sony WH-1000XM5 Noise Cancelling', brand: 'Sony', price: 4800000, type: 'accessory' },
  { id: '7', name: 'Samsung Galaxy Buds 2 Pro', brand: 'Samsung', price: 1950000, type: 'accessory' },
  { id: '8', name: 'iPhone 13, 128GB, Midnight', brand: 'Apple', price: 8900000, type: 'phone', imei: '352210049583722' },
];

import { Smartphone, Headphones, HandCoins } from 'lucide-react';
