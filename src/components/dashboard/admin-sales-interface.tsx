'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Wallet,
  Smartphone,
  ScanBarcode,
  Package,
  Users,
  CreditCard,
  Banknote,
  X,
  CheckCircle2,
  Loader2,
  ChevronRight,
  ArrowRight,
  Info
} from 'lucide-react';
import { cn, formatSum, formatUSD } from '@/lib/utils';
import { useSession } from '@/lib/auth-client';
import { createSale, searchProducts, createCustomer } from '@/db/queries';
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

interface AdminSalesInterfaceProps {
  inventoryData: any[];
  customersData: any[];
  debtsData: any[];
  salesData: any[];
}

export function AdminSalesInterface({
  inventoryData = [],
  customersData = [],
}: AdminSalesInterfaceProps) {
  const { data: session } = useSession();
  const router = useRouter();
  
  const [activeView, setActiveView] = useState<'catalog' | 'checkout'>('catalog');
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<any[]>(inventoryData);
  const [isSearching, setIsSearching] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'credit'>('cash');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Customer Selection
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  
  // New Customer State
  const [newCustomer, setNewCustomer] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    notes: ''
  });
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  
  // Credit specific
  const [debtMonths, setDebtMonths] = useState(3);
  const [downPayment, setDownPayment] = useState('');
  const [saleImei, setSaleImei] = useState('');

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Search products
  useEffect(() => {
    if (!session?.user) return;

    if (!search.trim()) {
      setProducts(inventoryData);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const results = await searchProducts(search, (session.user as any).tenantId);
        setProducts(results);
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search, session?.user, inventoryData]);

  const pName = (p: any) => p.name || `${p.brand} ${p.model}`;

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

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const tax = 0; // Or calculate if needed
  const total = subtotal + tax;

  const handleFinishSale = async () => {
    if (!session?.user || cart.length === 0) return;
    
    setIsProcessing(true);
    try {
      await createSale({
        tenantId: (session.user as any).tenantId,
        branchId: (session.user as any).branchId || '00000000-0000-0000-0000-000000000000',
        cashierId: session.user.id,
        subtotal: subtotal,
        total: total,
        paymentMethod: paymentMethod,
        paidAmount: paymentMethod === 'credit' ? (Number(downPayment) || 0) : total,
        debtAmount: paymentMethod === 'credit' ? (total - (Number(downPayment) || 0)) : 0,
        debtMonths: paymentMethod === 'credit' ? debtMonths : undefined,
        customerId: selectedCustomer?.id,
        customerData: selectedCustomer ? {
          fullName: selectedCustomer.fullName,
          phone: selectedCustomer.phone,
          imei: saleImei
        } : undefined,
        items: cart.map(item => ({
          productId: item.id,
          productName: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
          costPrice: item.price * 0.8,
          total: item.price * item.quantity,
          imei: item.imei
        }))
      });

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setIsProcessing(false);
        setCart([]);
        setSelectedCustomer(null);
        router.push('/sales');
      }, 1500);
    } catch (err) {
      console.error('Sale creation failed:', err);
      setIsProcessing(false);
      alert("Xatolik yuz berdi: " + (err as any).message);
    }
  };

  const handleAddCustomer = async () => {
    const { firstName, phone } = newCustomer;
    
    if (!firstName.trim() || !phone.trim()) {
      alert("Iltimos, ism va telefon raqamini to'liq kiriting");
      return;
    }

    if (!session?.user) {
      alert("Sessiya topilmadi. Iltimos, sahifani yangilang va qayta kiring.");
      return;
    }

    setIsAddingCustomer(true);
    try {
      const res = await createCustomer({
        tenantId: (session.user as any).tenantId,
        fullName: `${newCustomer.firstName} ${newCustomer.lastName}`.trim(),
        phone: newCustomer.phone,
        address: newCustomer.address,
        notes: newCustomer.notes
      });

      // Update local state
      const created = {
        id: res.id,
        fullName: res.full_name,
        phone: newCustomer.phone,
        totalSpent: 0
      };

      setSelectedCustomer(created);
      setIsAddCustomerModalOpen(false);
      setIsCustomerModalOpen(false);
      
      // Reset form
      setNewCustomer({
        firstName: '',
        lastName: '',
        phone: '',
        address: '',
        notes: ''
      });
      
    } catch (err) {
      console.error('Failed to add customer:', err);
      alert("Xatolik: " + (err as any).message);
    } finally {
      setIsAddingCustomer(false);
    }
  };

  const ProductThumbnail = ({ name, imageUrl }: any) => {
    if (imageUrl) {
      return <img src={imageUrl} alt={name} className="w-full h-full object-cover" />;
    }
    const firstLetter = name ? name.trim().charAt(0).toUpperCase() : '?';
    return (
      <div className="w-full h-full bg-[var(--color-bg-base)] flex items-center justify-center text-[var(--color-text-tertiary)] font-bold text-2xl">
        {firstLetter}
      </div>
    );
  };

  const filteredCustomers = customersData.filter(c => 
    c.fullName.toLowerCase().includes(customerSearch.toLowerCase()) || 
    c.phone.includes(customerSearch)
  );

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Top Navigation / Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="font-display text-2xl md:text-3xl">Yangi Savdo</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">Admin paneli orqali tezkor savdo amalga oshirish</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-[var(--color-bg-card)] rounded-xl p-1 border border-[var(--color-border)] shadow-sm">
            <button
              onClick={() => setActiveView('catalog')}
              className={cn(
                "px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
                activeView === 'catalog' ? "bg-[var(--color-accent)] text-white shadow-lg shadow-[var(--color-accent)]/20" : "text-[var(--color-text-tertiary)] hover:text-[var(--color-foreground)]"
              )}
            >
              <Package size={16} />
              Katalog
            </button>
            <button
              onClick={() => setActiveView('checkout')}
              className={cn(
                "px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 relative",
                activeView === 'checkout' ? "bg-[var(--color-accent)] text-white shadow-lg shadow-[var(--color-accent)]/20" : "text-[var(--color-text-tertiary)] hover:text-[var(--color-foreground)]"
              )}
            >
              <ShoppingCart size={16} />
              Savat
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white ring-2 ring-[var(--color-bg-card)] animate-in zoom-in">
                  {cart.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0 overflow-hidden">
        {/* Left Side: Product Selection */}
        <div className={cn(
          "flex-1 flex flex-col gap-6 min-w-0 h-full overflow-hidden",
          activeView === 'checkout' && "hidden lg:flex"
        )}>
          {/* Search Bar */}
          <div className="premium-card p-5 md:p-8 flex flex-col md:flex-row gap-5 items-center relative overflow-hidden group shrink-0">
            <div className="absolute top-0 left-0 w-1 h-full bg-[var(--color-accent)] opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex-1 w-full">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] group-focus-within:text-[var(--color-accent)] transition-colors" size={22} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Mahsulot nomi, model yoki barcodeni kiriting..."
                className="w-full h-14 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)]/50 pl-14 pr-6 text-base font-medium outline-none focus:border-[var(--color-accent)] focus:ring-4 focus:ring-[var(--color-accent)]/10 transition-all placeholder:text-[var(--color-text-tertiary)]/50"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-[var(--color-bg-base)] border border-[var(--color-border)] text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-widest shadow-sm">
              <div className="h-2 w-2 rounded-full bg-[var(--color-success)] animate-pulse" />
              <ScanBarcode size={18} className="text-[var(--color-accent)]" />
              Skaner Faol
            </div>
          </div>

          {/* Product Catalog */}
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {isSearching ? (
              <div className="flex flex-col items-center justify-center py-20 text-[var(--color-text-tertiary)]">
                <Loader2 className="animate-spin mb-4" size={40} />
                <p className="font-medium">Qidirilmoqda...</p>
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 pb-10">
                {products.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => addToCart(p)}
                    className="premium-card group rounded-2xl p-3 text-left hover:border-[var(--color-accent)]/50 transition-all active:scale-[0.98] flex flex-col relative overflow-hidden h-full"
                  >
                    <div className="mb-3 aspect-square rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)] flex items-center justify-center overflow-hidden relative shadow-sm group-hover:shadow-lg transition-all duration-500">
                      <ProductThumbnail name={pName(p)} imageUrl={p.imageUrl} />
                      <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg bg-[var(--color-accent)] text-white text-[9px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 shadow-lg whitespace-nowrap z-10">
                        + Qo'shish
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <div className="font-bold text-[13px] line-clamp-2 mb-0.5 text-[var(--color-foreground)] group-hover:text-[var(--color-accent)] transition-colors leading-tight">{pName(p)}</div>
                      <div className="text-[9px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-[0.15em] mb-2">{p.brand}</div>
                    </div>
                    
                    <div className="pt-2 border-t border-[var(--color-border)]/40 flex items-center justify-between">
                      <div className="flex flex-col">
                        <div className="font-display text-sm font-black text-[var(--color-accent)]">{formatUSD(p.retailPrice)}</div>
                      </div>
                      <div className={cn(
                        "text-[9px] font-bold px-2 py-0.5 rounded-md border transition-colors",
                        p.stock > 5 ? "bg-emerald-500/5 text-emerald-500 border-emerald-500/10" : "bg-red-500/5 text-red-500 border-red-500/10"
                      )}>
                        {p.stock}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-[var(--color-text-tertiary)] opacity-30">
                <Package size={80} className="mb-4" />
                <p className="text-xl font-display font-bold">Mahsulotlar topilmadi</p>
                <p className="text-sm">Boshqa nom bilan qidirib ko'ring</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Cart & Checkout */}
        <div className={cn(
          "w-full lg:w-[400px] xl:w-[460px] flex flex-col h-full overflow-hidden",
          activeView === 'catalog' && "hidden lg:flex"
        )}>
          {/* Cart Section */}
          <div className="premium-card flex-1 flex flex-col overflow-hidden shadow-2xl relative">
            <div className="p-3 border-b border-[var(--color-border)] flex items-center justify-between bg-gradient-to-r from-[var(--color-bg-card)] to-[var(--color-bg-elevated)]/30 shrink-0">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-[var(--color-accent)]/10 flex items-center justify-center text-[var(--color-accent)]">
                  <ShoppingCart size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Savat</h3>
                  <p className="text-[9px] font-bold uppercase text-[var(--color-text-tertiary)] tracking-widest">{cart.length} ta mahsulot</p>
                </div>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={() => setCart([])}
                  className="p-1.5 text-[var(--color-text-tertiary)] hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                  title="Tozalash"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar min-h-[120px]">
              {cart.length > 0 ? (
                cart.map((item) => (
                  <div key={item.id} className="group relative flex items-center gap-2.5 p-2 rounded-lg bg-[var(--color-bg-card)] border border-[var(--color-border)] hover:border-[var(--color-accent)]/40 transition-all shadow-sm">
                    <div className="h-9 w-9 rounded-md bg-[var(--color-bg-base)] flex items-center justify-center shrink-0 border border-[var(--color-border)] overflow-hidden">
                      <ProductThumbnail name={item.name} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-[12px] text-[var(--color-foreground)] truncate leading-tight mb-1">{item.name}</div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center bg-[var(--color-bg-base)] rounded-md border border-[var(--color-border)] p-0.5">
                          <button onClick={() => updateQuantity(item.id, -1)} className="w-5 h-5 flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] rounded transition-all">
                            <Minus size={10} strokeWidth={4} />
                          </button>
                          <span className="w-6 text-center text-[11px] font-black text-[var(--color-foreground)]">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="w-5 h-5 flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] rounded transition-all">
                            <Plus size={10} strokeWidth={4} />
                          </button>
                        </div>
                        <div className="text-[11px] font-black text-[var(--color-accent)]">{formatUSD(item.price * item.quantity)}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="p-1 text-[var(--color-text-tertiary)] hover:text-red-500 rounded transition-all"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-[var(--color-text-tertiary)] opacity-30 space-y-4 py-20">
                  <ShoppingCart size={64} strokeWidth={1} />
                  <div className="text-center">
                    <p className="font-display text-xl font-bold text-[var(--color-foreground)]">Savat bo'sh</p>
                    <p className="text-[10px] uppercase tracking-[0.2em] mt-2 font-bold">Mahsulot tanlang</p>
                  </div>
                </div>
              )}
            </div>

            {/* Checkout Area - Ultra Compact Redesign */}
            <div className="shrink-0 bg-[var(--color-bg-card)] border-t border-[var(--color-border)] shadow-[0_-10px_40px_rgba(0,0,0,0.4)] z-[40]">
              <div className="p-3 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {/* Customer Selector Block */}
                  <div className="space-y-1.5">
                    <label className="text-[8px] font-bold uppercase text-[var(--color-text-tertiary)] tracking-widest ml-1">Mijoz</label>
                    {selectedCustomer ? (
                      <div className="flex items-center gap-2 px-2.5 rounded-lg bg-[var(--color-accent)]/[0.07] border border-[var(--color-accent)]/30 overflow-hidden min-h-[44px]">
                        <div className="h-7 w-7 rounded-full bg-[var(--color-accent)]/20 flex items-center justify-center shrink-0">
                          <Users size={13} className="text-[var(--color-accent)]" />
                        </div>
                        <div className="flex-1 min-w-0 py-1">
                          <div className="truncate font-bold text-[11px] text-[var(--color-foreground)] leading-tight">{selectedCustomer.fullName}</div>
                          {selectedCustomer.phone && (
                            <div className="text-[9px] text-[var(--color-text-tertiary)] truncate">{selectedCustomer.phone}</div>
                          )}
                        </div>
                        <button
                          onClick={() => setSelectedCustomer(null)}
                          className="p-1.5 text-red-500/40 hover:text-red-500 hover:bg-red-500/10 transition-colors rounded-md cursor-pointer shrink-0"
                          aria-label="Mijozni o'chirish"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setIsCustomerModalOpen(true)}
                        className="w-full flex items-center gap-2 px-3 rounded-lg bg-[var(--color-bg-base)] border border-dashed border-[var(--color-border)] text-[var(--color-text-tertiary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent)]/[0.03] transition-all min-h-[44px] cursor-pointer"
                        aria-label="Mijoz tanlash"
                      >
                        <Plus size={14} />
                        <span className="text-[11px] font-bold">Mijoz tanlash</span>
                      </button>
                    )}
                  </div>

                  {/* Payment Method Block */}
                  <div className="space-y-1.5">
                    <label className="text-[8px] font-bold uppercase text-[var(--color-text-tertiary)] tracking-widest ml-1">To'lov usuli</label>
                    <div className="grid grid-cols-3 gap-1" style={{minHeight: '44px'}}>
                      {[
                        { id: 'cash', icon: Banknote, label: 'Naqd' },
                        { id: 'card', icon: CreditCard, label: 'Karta' },
                        { id: 'credit', icon: Smartphone, label: 'Nasiya' },
                      ].map((m) => (
                        <button
                          key={m.id}
                          onClick={() => setPaymentMethod(m.id as any)}
                          aria-label={m.label}
                          aria-pressed={paymentMethod === m.id}
                          className={cn(
                            "flex flex-col items-center justify-center gap-0.5 py-1 rounded-lg border transition-all active:scale-95 cursor-pointer min-h-[44px]",
                            paymentMethod === m.id
                              ? "bg-[var(--color-accent)]/10 border-[var(--color-accent)] text-[var(--color-accent)] shadow-inner"
                              : "bg-[var(--color-bg-base)] border-[var(--color-border)] text-[var(--color-text-tertiary)] hover:border-[var(--color-accent)]/40"
                          )}
                        >
                          <m.icon size={14} />
                          <span className="text-[8px] font-bold leading-none">{m.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Nasiya Settings Block */}
                {paymentMethod === 'credit' && (
                  <div className="p-2 rounded-lg bg-[var(--color-accent)]/[0.03] border border-[var(--color-accent)]/10 grid grid-cols-2 gap-2 animate-in slide-in-from-top-2 duration-300">
                    <select 
                      value={debtMonths}
                      onChange={(e) => setDebtMonths(Number(e.target.value))}
                      className="bg-[var(--color-bg-base)] border border-[var(--color-border)] rounded-md px-2 py-1.5 text-[10px] font-bold outline-none cursor-pointer focus:border-[var(--color-accent)]"
                    >
                      {[1, 3, 6, 9, 12, 18, 24].map(m => <option key={m} value={m}>{m} oy</option>)}
                    </select>
                    <input 
                      type="text"
                      placeholder="Bo'nak"
                      value={downPayment}
                      onChange={(e) => setDownPayment(e.target.value)}
                      className="bg-[var(--color-bg-base)] border border-[var(--color-border)] rounded-md px-2 py-1.5 text-[10px] font-bold outline-none placeholder:text-[var(--color-text-tertiary)]/50 focus:border-[var(--color-accent)]"
                    />
                  </div>
                )}

                {/* Summary & Checkout Action */}
                <div className="flex items-center gap-3 pt-1">
                  <div className="flex-1 min-w-0">
                    <div className="text-[8px] font-bold uppercase text-[var(--color-text-tertiary)] tracking-widest mb-0.5">To'lanadigan jami</div>
                    <div className="font-mono text-xl font-black text-[var(--color-accent)] leading-none tabular-nums">{formatUSD(total)}</div>
                    <div className="text-[9px] font-mono text-[var(--color-text-tertiary)] opacity-60 mt-1 tabular-nums">{formatSum(total, false)}</div>
                  </div>

                  <button
                    id="pos-checkout-btn"
                    disabled={cart.length === 0 || isProcessing || (paymentMethod === 'credit' && !selectedCustomer)}
                    onClick={handleFinishSale}
                    aria-label="Savdoni yakunlash"
                    className={cn(
                      "flex items-center justify-center gap-2 px-7 min-h-[56px] rounded-xl font-black text-sm shadow-2xl transition-all duration-200 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:grayscale shrink-0 cursor-pointer",
                      isSuccess
                        ? "bg-emerald-500 text-white shadow-emerald-500/30"
                        : "bg-[var(--color-accent)] text-white shadow-[var(--color-accent)]/30 hover:brightness-110"
                    )}
                  >
                    {isProcessing ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : isSuccess ? (
                      <>
                        <CheckCircle2 size={20} className="animate-in zoom-in duration-300" />
                        <span>Muvaffaq!</span>
                      </>
                    ) : (
                      <>
                        <Wallet size={20} />
                        <span>Yakunlash</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Nasiya validation warning */}
                {paymentMethod === 'credit' && !selectedCustomer && cart.length > 0 && (
                  <div role="alert" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-bold animate-in fade-in duration-200">
                    <Info size={12} className="shrink-0" />
                    Nasiya uchun avval mijoz tanlang
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals remain same but ensures z-index priority */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-lg bg-[var(--color-bg-elevated)] rounded-[40px] border border-[var(--color-border)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[80vh]">
            <div className="p-8 border-b border-[var(--color-border)] flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-display font-bold">Mijozni tanlash</h2>
                <p className="text-xs text-[var(--color-text-secondary)]">Ro'yxatdan mijozni tanlang yoki yangi yarating</p>
              </div>
              <button
                onClick={() => setIsCustomerModalOpen(false)}
                className="h-10 w-10 rounded-full border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-hover)] transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 bg-[var(--color-bg-card)]/50">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]" size={18} />
                <input
                  autoFocus
                  type="text"
                  placeholder="Ism yoki telefon raqami bo'yicha qidirish..."
                  className="w-full h-12 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-base)] pl-12 pr-4 text-sm outline-none focus:border-[var(--color-accent)] transition-all"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedCustomer(c);
                      setIsCustomerModalOpen(false);
                      setCustomerSearch('');
                    }}
                    className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-[var(--color-bg-card)] transition-all group"
                  >
                    <div className="flex items-center gap-4 text-left">
                      <div className="h-11 w-11 rounded-full bg-[var(--color-bg-base)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-tertiary)] group-hover:bg-[var(--color-accent)] group-hover:text-white transition-all">
                        <Users size={20} />
                      </div>
                      <div>
                        <div className="font-bold text-sm group-hover:text-[var(--color-accent)] transition-colors">{c.fullName}</div>
                        <div className="text-xs text-[var(--color-text-tertiary)]">{c.phone}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-bold uppercase text-[var(--color-text-tertiary)] mb-0.5">Xaridlar</div>
                      <div className="text-xs font-mono font-bold">{c.totalSpent} so'm</div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="py-12 text-center text-[var(--color-text-tertiary)]">
                  <p className="text-sm">Mijoz topilmadi</p>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-[var(--color-border)] bg-[var(--color-bg-card)]/30">
              <button 
                onClick={() => setIsAddCustomerModalOpen(true)}
                className="w-full h-12 rounded-xl border border-dashed border-[var(--color-border)] text-sm font-bold flex items-center justify-center gap-2 hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-all"
              >
                <Plus size={18} />
                Yangi mijoz qo'shish
              </button>
            </div>
          </div>
        </div>
      )}

      {isAddCustomerModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="w-full max-w-xl bg-[var(--color-bg-elevated)] rounded-[40px] border border-[var(--color-border)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col">
            <div className="p-8 border-b border-[var(--color-border)] flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-display font-bold">Yangi mijoz</h2>
                <p className="text-xs text-[var(--color-text-secondary)]">Mijoz ma'lumotlarini kiriting</p>
              </div>
              <button
                onClick={() => setIsAddCustomerModalOpen(false)}
                className="h-10 w-10 rounded-full border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-hover)] transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-8 space-y-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-[var(--color-text-tertiary)] tracking-widest px-1">Ismi</label>
                  <input
                    type="text"
                    placeholder="Masalan: Alisher"
                    className="w-full h-14 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-base)] px-6 text-base font-medium outline-none focus:border-[var(--color-accent)] focus:ring-4 focus:ring-[var(--color-accent)]/10 transition-all"
                    value={newCustomer.firstName}
                    onChange={(e) => setNewCustomer({...newCustomer, firstName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-[var(--color-text-tertiary)] tracking-widest px-1">Sharifi</label>
                  <input
                    type="text"
                    placeholder="Masalan: Usmonov"
                    className="w-full h-14 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-base)] px-6 text-base font-medium outline-none focus:border-[var(--color-accent)] focus:ring-4 focus:ring-[var(--color-accent)]/10 transition-all"
                    value={newCustomer.lastName}
                    onChange={(e) => setNewCustomer({...newCustomer, lastName: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-[var(--color-text-tertiary)] tracking-widest px-1">Telefon raqami</label>
                <div className="relative">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] font-bold">+998</div>
                  <input
                    type="tel"
                    placeholder="90 123 45 67"
                    className="w-full h-14 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-base)] pl-20 pr-6 text-base font-medium outline-none focus:border-[var(--color-accent)] focus:ring-4 focus:ring-[var(--color-accent)]/10 transition-all"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-[var(--color-text-tertiary)] tracking-widest px-1">Manzili</label>
                <input
                  type="text"
                  placeholder="Masalan: Toshkent sh, Chilonzor 1..."
                  className="w-full h-14 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-base)] px-6 text-base font-medium outline-none focus:border-[var(--color-accent)] focus:ring-4 focus:ring-[var(--color-accent)]/10 transition-all"
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer({...newCustomer, address: e.target.value})}
                />
              </div>

              {/* Purchase Context */}
              <div className="p-6 rounded-3xl bg-[var(--color-accent)]/[0.03] border border-[var(--color-accent)]/10 space-y-4">
                <h4 className="text-xs font-bold uppercase text-[var(--color-accent)] tracking-widest">Xarid ma'lumotlari</h4>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1">
                      <div className="text-[10px] text-[var(--color-text-tertiary)] uppercase font-bold">Mahsulot</div>
                      <div className="text-sm font-bold truncate">{cart.length > 0 ? cart.map(i => i.name).join(', ') : 'Tanlanmagan'}</div>
                   </div>
                   <div className="space-y-1">
                      <div className="text-[10px] text-[var(--color-text-tertiary)] uppercase font-bold">Narxi</div>
                      <div className="text-sm font-bold text-[var(--color-accent)]">{formatUSD(total)}</div>
                   </div>
                </div>
                
                <div className="space-y-2 pt-2">
                  <label className="text-[10px] font-bold uppercase text-[var(--color-text-tertiary)] tracking-widest px-1">IMEI kodi</label>
                  <input
                    type="text"
                    placeholder="15 raqamli IMEI..."
                    className="w-full h-12 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-base)] px-5 text-sm font-medium outline-none focus:border-[var(--color-accent)] transition-all"
                    value={saleImei}
                    onChange={(e) => setSaleImei(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-[var(--color-text-tertiary)] tracking-widest px-1">Qo'shimcha izoh</label>
                <textarea
                  placeholder="..."
                  rows={2}
                  className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-base)] p-5 text-sm font-medium outline-none focus:border-[var(--color-accent)] transition-all resize-none"
                  value={newCustomer.notes}
                  onChange={(e) => setNewCustomer({...newCustomer, notes: e.target.value})}
                />
              </div>
            </div>
            
            <div className="p-8 border-t border-[var(--color-border)] bg-[var(--color-bg-card)]/50">
              <button 
                disabled={isAddingCustomer}
                onClick={handleAddCustomer}
                className="w-full h-14 rounded-2xl bg-[var(--color-accent)] text-white font-bold flex items-center justify-center gap-3 shadow-xl shadow-[var(--color-accent)]/20 hover:bg-[var(--color-accent-hover)] transition-all active:scale-95 disabled:opacity-50"
              >
                {isAddingCustomer ? <Loader2 className="animate-spin" /> : (
                  <>
                    <CheckCircle2 size={20} />
                    Saqlash va davom etish
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
