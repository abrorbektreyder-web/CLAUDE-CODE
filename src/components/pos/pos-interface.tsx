'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  ScanBarcode, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  Banknote, 
  Clock, 
  Monitor, 
  Keyboard, 
  Settings, 
  LogOut, 
  X, 
  Smartphone, 
  Headphones, 
  HandCoins, 
  Loader2, 
  CheckCircle2,
  Printer,
  User as UserIcon,
  Calendar,
  Phone as PhoneIcon,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession } from '@/lib/auth-client';
import { createSale, searchProducts } from '@/db/queries';
import { useRouter } from 'next/navigation';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  type: 'phone' | 'accessory';
  imei?: string;
  brand: string;
}

export function PosInterface() {
  const { data: session } = useSession();
  const router = useRouter();
  
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'credit'>('cash');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [lastSale, setLastSale] = useState<any>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  // Debt Customer Form
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [debtMonths, setDebtMonths] = useState(3);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  // Search products when query changes
  useEffect(() => {
    if (!session?.user) return;
    
    const timer = setTimeout(async () => {
      try {
        const results = await searchProducts(search, session.user.tenantId);
        setProducts(results);
      } catch (err) {
        console.error('Search failed:', err);
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [search, session?.user]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'F2') {
        e.preventDefault();
        if (cart.length > 0) setIsPaymentModalOpen(true);
      }
      if (e.key === 'Escape') {
        setIsPaymentModalOpen(false);
        setShowReceipt(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart.length]);

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { 
        id: product.id,
        name: pName(product),
        price: Number(product.retailPrice),
        quantity: 1,
        type: product.productType === 'phone' ? 'phone' : 'accessory',
        brand: product.brand,
        imei: product.barcode || 'N/A'
      }];
    });
  };

  const pName = (p: any) => p.name || `${p.brand} ${p.model}`;

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

  const handleFinishSale = async () => {
    if (!session?.user || cart.length === 0) return;
    if (paymentMethod === 'credit' && (!customerName || !customerPhone)) {
      alert("Nasiya uchun mijoz ma'lumotlarini to'ldiring");
      return;
    }
    
    setIsProcessing(true);
    try {
      const saleResult = await createSale({
        tenantId: session.user.tenantId,
        branchId: '00000000-0000-0000-0000-000000000000', // Mock branch for now
        cashierId: session.user.id,
        subtotal: total,
        total: total,
        paymentMethod: paymentMethod,
        paidAmount: paymentMethod === 'credit' ? 0 : total,
        debtAmount: paymentMethod === 'credit' ? total : 0,
        debtMonths: paymentMethod === 'credit' ? debtMonths : undefined,
        customerData: paymentMethod === 'credit' ? {
          fullName: customerName,
          phone: customerPhone
        } : undefined,
        items: cart.map(item => ({
          productId: item.id,
          productName: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
          costPrice: item.price * 0.8, // Mock cost
          total: item.price * item.quantity
        }))
      });
      
      setLastSale({
        ...saleResult,
        cart: [...cart],
        time: new Date().toLocaleString('uz-UZ'),
        cashier: session.user.name
      });
      
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setIsProcessing(false);
        setIsPaymentModalOpen(false);
        setShowReceipt(true);
        setCart([]);
        setCustomerName('');
        setCustomerPhone('');
      }, 1000);
    } catch (err) {
      console.error('Sale creation failed:', err);
      setIsProcessing(false);
      alert("Xatolik yuz berdi: " + (err as any).message);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!session) return <div className="flex h-screen items-center justify-center bg-[var(--color-bg-base)] text-[var(--color-text-tertiary)]"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="flex h-screen w-full bg-[var(--color-bg-base)] text-[var(--color-foreground)] overflow-hidden font-sans">
      {/* Left Sidebar - Quick Actions */}
      <div className="flex w-16 flex-col items-center border-r border-[var(--color-border)] bg-[var(--color-bg-elevated)] py-6 gap-6">
        <div className="h-10 w-10 rounded-xl bg-[var(--color-accent)] flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-[var(--color-accent)]/20">
          M
        </div>
        <button className="p-3 rounded-xl hover:bg-[var(--color-bg-hover)] text-[var(--color-text-tertiary)] transition-colors" onClick={() => router.push('/dashboard')}>
          <Monitor size={24} />
        </button>
        <button className="p-3 rounded-xl bg-[var(--color-accent)]/10 text-[var(--color-accent)] transition-colors">
          <ShoppingCart size={24} />
        </button>
        <button className="p-3 rounded-xl hover:bg-[var(--color-bg-hover)] text-[var(--color-text-tertiary)] transition-colors" onClick={() => router.push('/sales')}>
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
              <div className="text-sm font-bold">{session.user.name}</div>
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

            {/* Catalog Grid */}
            <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 content-start custom-scrollbar">
              {(products.length > 0 ? products : mockProducts).map((p) => (
                <button 
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className="premium-card group rounded-2xl p-4 text-left hover:border-[var(--color-accent)] transition-all active:scale-95"
                >
                  <div className="mb-3 aspect-square rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)] flex items-center justify-center group-hover:bg-[var(--color-accent)]/5 transition-colors overflow-hidden">
                    {p.productType === 'phone' ? <Smartphone size={32} className="text-[var(--color-text-tertiary)] group-hover:text-[var(--color-accent)]" /> : <Headphones size={32} className="text-[var(--color-text-tertiary)] group-hover:text-[var(--color-accent)]" />}
                  </div>
                  <div className="font-bold text-sm line-clamp-2 h-10 mb-1">{pName(p)}</div>
                  <div className="text-[10px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider mb-3">{p.brand}</div>
                  <div className="flex items-end justify-between">
                    <div className="font-display text-lg font-bold text-[var(--color-accent)]">
                      {new Intl.NumberFormat('uz-UZ').format(p.retailPrice)}
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
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-[var(--color-bg-elevated)] rounded-[40px] border border-[var(--color-border)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 flex flex-col gap-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-display font-bold">To'lov</h2>
                  <p className="text-xs text-[var(--color-text-secondary)]">To'lov turini tanlang</p>
                </div>
                <button 
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="h-10 w-10 rounded-full border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-hover)] transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex flex-col items-center justify-center py-6 px-6 rounded-[32px] bg-[var(--color-bg-base)] border border-[var(--color-border)]">
                <div className="text-[10px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-[0.2em] mb-1">Jami summa</div>
                <div className="text-4xl font-display font-bold text-[var(--color-foreground)]">
                  {new Intl.NumberFormat('uz-UZ').format(total)}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'cash', icon: Banknote, label: 'Naqd', color: 'var(--color-success)' },
                  { id: 'card', icon: CreditCard, label: 'Karta', color: 'var(--color-info)' },
                  { id: 'credit', icon: HandCoins, label: 'Nasiya', color: 'var(--color-purple)' },
                ].map((m) => (
                  <button 
                    key={m.id}
                    onClick={() => setPaymentMethod(m.id as any)}
                    className={cn(
                      "flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all",
                      paymentMethod === m.id 
                        ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10" 
                        : "border-[var(--color-border)] hover:border-[var(--color-accent)]/50 bg-[var(--color-bg-base)]"
                    )}
                  >
                    <div className={cn(
                      "h-12 w-12 rounded-full flex items-center justify-center",
                      paymentMethod === m.id ? "bg-[var(--color-accent)] text-white" : "bg-[var(--color-bg-hover)] text-[var(--color-text-tertiary)]"
                    )}>
                      <m.icon size={24} />
                    </div>
                    <div className="font-bold text-xs">{m.label}</div>
                  </button>
                ))}
              </div>

              {/* Debt Form */}
              {paymentMethod === 'credit' && (
                <div className="flex flex-col gap-4 p-5 rounded-3xl bg-[var(--color-bg-base)] border border-[var(--color-border)] animate-in slide-in-from-top-4 duration-300">
                  <div className="flex items-center gap-2 text-xs font-bold text-[var(--color-accent)] uppercase tracking-wider mb-1">
                    <UserIcon size={14} />
                    Mijoz ma'lumotlari
                  </div>
                  <div className="space-y-3">
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="F.I.SH (Ism Familiya)"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full h-12 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)] px-10 text-sm font-medium outline-none focus:border-[var(--color-accent)] transition-all"
                      />
                      <UserIcon size={18} className="absolute left-3 top-3.5 text-[var(--color-text-tertiary)]" />
                    </div>
                    <div className="relative">
                      <input 
                        type="tel" 
                        placeholder="Telefon raqami (+998)"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full h-12 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)] px-10 text-sm font-medium outline-none focus:border-[var(--color-accent)] transition-all"
                      />
                      <PhoneIcon size={18} className="absolute left-3 top-3.5 text-[var(--color-text-tertiary)]" />
                    </div>
                    <div className="relative">
                      <select 
                        value={debtMonths}
                        onChange={(e) => setDebtMonths(Number(e.target.value))}
                        className="w-full h-12 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)] px-10 text-sm font-medium outline-none focus:border-[var(--color-accent)] transition-all appearance-none"
                      >
                        <option value={1}>1 oy (Muddati: {new Date(new Date().setMonth(new Date().getMonth() + 1)).toLocaleDateString()})</option>
                        <option value={3}>3 oy</option>
                        <option value={6}>6 oy</option>
                        <option value={12}>12 oy</option>
                      </select>
                      <Calendar size={18} className="absolute left-3 top-3.5 text-[var(--color-text-tertiary)]" />
                      <ChevronDown size={18} className="absolute right-3 top-3.5 text-[var(--color-text-tertiary)] pointer-events-none" />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button 
                  onClick={() => setIsPaymentModalOpen(false)}
                  disabled={isProcessing}
                  className="flex-1 h-14 rounded-2xl border border-[var(--color-border)] font-bold text-sm hover:bg-[var(--color-bg-hover)] transition-all"
                >
                  Bekor qilish
                </button>
                <button 
                  onClick={handleFinishSale}
                  disabled={isProcessing || cart.length === 0}
                  className="flex-[2] h-14 rounded-2xl bg-[var(--color-accent)] text-white font-bold text-lg shadow-xl shadow-[var(--color-accent)]/20 hover:bg-[var(--color-accent-hover)] transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  {isProcessing ? <Loader2 className="animate-spin" size={24} /> : isSuccess ? <CheckCircle2 size={24} /> : "To'lovni tasdiqlash"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receipt View (Thermal Style) */}
      {showReceipt && lastSale && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="w-full max-w-sm flex flex-col gap-6 animate-in zoom-in-95 duration-300">
            <div 
              ref={receiptRef}
              className="bg-white text-black p-8 shadow-2xl rounded-sm font-mono text-[11px] leading-tight print:p-0 print:shadow-none"
            >
              <div className="text-center mb-6">
                <div className="text-base font-bold uppercase mb-1">M-TELECOM</div>
                <div>Filial #1 (Markaziy)</div>
                <div>Tel: +998 71 200 00 00</div>
              </div>
              
              <div className="border-t border-dashed border-black/20 my-4" />
              
              <div className="space-y-1 mb-4">
                <div className="flex justify-between">
                  <span>CHEK №:</span>
                  <span className="font-bold">{lastSale.receipt_number || lastSale.id.slice(0,8).toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span>SANA:</span>
                  <span>{lastSale.time}</span>
                </div>
                <div className="flex justify-between">
                  <span>KASSIR:</span>
                  <span className="uppercase">{lastSale.cashier}</span>
                </div>
                <div className="flex justify-between">
                  <span>MIJOZ:</span>
                  <span className="font-bold uppercase">{lastSale.customerName}</span>
                </div>
              </div>
              
              <div className="border-t border-dashed border-black/20 my-4" />
              
              <div className="mb-4">
                <div className="flex font-bold mb-2">
                  <span className="flex-1">MAHSULOT</span>
                  <span className="w-8 text-right">SONI</span>
                  <span className="w-20 text-right">SUMMA</span>
                </div>
                <div className="space-y-3">
                  {lastSale.cart.map((item: any, idx: number) => (
                    <div key={idx} className="flex flex-col">
                      <div className="flex">
                        <span className="flex-1 font-bold">{item.name}</span>
                        <span className="w-8 text-right">{item.quantity}</span>
                        <span className="w-20 text-right">{(item.price * item.quantity).toLocaleString()}</span>
                      </div>
                      <div className="text-[9px] opacity-70">IMEI: {item.imei}</div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="border-t border-dashed border-black/20 my-4" />
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>JAMI:</span>
                  <span className="font-bold">{Number(lastSale.total).toLocaleString()} SO'M</span>
                </div>
                <div className="flex justify-between">
                  <span>TO'LOV TURI:</span>
                  <span className="font-bold uppercase">
                    {lastSale.payment_method === 'cash' ? 'NAQD' : lastSale.payment_method === 'card' ? 'KARTA' : 'NASIYA'}
                  </span>
                </div>
                {lastSale.payment_method === 'credit' && (
                  <div className="p-2 bg-black/5 rounded mt-2">
                    <div className="font-bold mb-1">NASIYA MA'LUMOTLARI:</div>
                    <div>Muddati: {lastSale.debtMonths} oy</div>
                    <div>Oylik to'lov: {Math.ceil(lastSale.total / lastSale.debtMonths).toLocaleString()} SO'M</div>
                  </div>
                )}
              </div>
              
              <div className="border-t border-dashed border-black/20 my-4" />
              
              <div className="text-center space-y-1">
                <div className="font-bold">XARIDINGIZ UCHUN RAXMAT!</div>
                <div className="text-[9px]">Sotilgan tovarlar 24 soat ichida almashtiriladi.</div>
                <div className="pt-2">www.m-telecom.uz</div>
              </div>
            </div>

            <div className="flex gap-3 no-print">
              <button 
                onClick={handlePrint}
                className="flex-1 h-12 rounded-xl bg-white text-black font-bold flex items-center justify-center gap-2 hover:bg-white/90 transition-all"
              >
                <Printer size={18} />
                Chop etish
              </button>
              <button 
                onClick={() => setShowReceipt(false)}
                className="flex-1 h-12 rounded-xl bg-[var(--color-accent)] text-white font-bold hover:bg-[var(--color-accent-hover)] transition-all"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body * { visibility: hidden; }
          #receipt-content, #receipt-content * { visibility: visible; }
          #receipt-content { position: absolute; left: 0; top: 0; width: 100%; }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--color-border); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--color-text-tertiary); }
      `}</style>
    </div>
  );
}

const mockProducts = [
  { id: '1', name: 'iPhone 15 Pro Max, 256GB, Blue Titanium', brand: 'Apple', retailPrice: 16450000, productType: 'phone', barcode: '358291039284712' },
  { id: '2', name: 'Samsung Galaxy S24 Ultra, 512GB, Gray', brand: 'Samsung', retailPrice: 14200000, productType: 'phone', barcode: '357712039200192' },
  { id: '3', name: 'AirPods Pro (2nd Gen) with MagSafe', brand: 'Apple', retailPrice: 2850000, productType: 'accessory' },
  { id: '4', name: 'Xiaomi Redmi Note 13 Pro+, 12/512GB', brand: 'Xiaomi', retailPrice: 4600000, productType: 'phone', barcode: '359910029384755' },
  { id: '5', name: 'Apple Watch Series 9, 45mm, GPS', brand: 'Apple', retailPrice: 5200000, productType: 'accessory' },
  { id: '6', name: 'Sony WH-1000XM5 Noise Cancelling', brand: 'Sony', retailPrice: 4800000, productType: 'accessory' },
  { id: '7', name: 'Samsung Galaxy Buds 2 Pro', brand: 'Samsung', retailPrice: 1950000, productType: 'accessory' },
  { id: '8', name: 'iPhone 13, 128GB, Midnight', brand: 'Apple', retailPrice: 8900000, productType: 'phone', barcode: '352210049583722' },
];
