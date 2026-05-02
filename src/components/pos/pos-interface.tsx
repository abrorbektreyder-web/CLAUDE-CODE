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
  Wallet,
  Loader2,
  CheckCircle2,
  Printer,
  User as UserIcon,
  Calendar,
  Phone as PhoneIcon,
  ChevronDown,
  Package,
  Users,
  BarChart,
  Activity
} from 'lucide-react';
import { cn, formatSum } from '@/lib/utils';
import { useSession } from '@/lib/auth-client';
import { createSale, searchProducts, openShift, closeShift } from '@/db/queries';
import { useRouter } from 'next/navigation';
import { InventoryList } from '@/components/dashboard/inventory-list';
import { CustomerList } from '@/components/dashboard/customer-list';
import { DebtList } from '@/components/dashboard/debt-list';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  type: 'phone' | 'accessory';
  imei?: string;
  brand: string;
}

type ActiveTab = 'pos' | 'inventory' | 'customers' | 'credit' | 'reports' | 'audit';

export function PosInterface({
  inventoryData = [],
  customersData = [],
  salesData = [],
  debtsData = [],
  hideSidebar = false
}: {
  inventoryData?: any[];
  customersData?: any[];
  salesData?: any[];
  debtsData?: any[];
  hideSidebar?: boolean;
}) {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<ActiveTab>('pos');
  const [mobileView, setMobileView] = useState<'catalog' | 'cart'>('catalog');
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<any[]>(inventoryData);
  const [isSearching, setIsSearching] = useState(false);
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
  const [downPayment, setDownPayment] = useState('');
  const [saleImei, setSaleImei] = useState('');

  // Shift Management
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [shiftStatus, setShiftStatus] = useState<'open' | 'closed'>('closed');
  const [currentShiftId, setCurrentShiftId] = useState<string | null>(null);
  const [isShiftProcessing, setIsShiftProcessing] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  // Auto-open shift on mount
  useEffect(() => {
    async function autoOpenShift() {
      if (!session?.user) return;
      try {
        const tenantId = (session.user as any).tenantId;
        const branchId = (session.user as any).branchId || '00000000-0000-0000-0000-000000000000';
        
        const newShift = await openShift(tenantId, session.user.id, branchId, 0); // 0 starting cash
        setCurrentShiftId(newShift.id);
        setShiftStatus('open');
      } catch (err) {
        console.error('Auto shift open failed:', err);
      }
    }
    
    if (session?.user && shiftStatus === 'closed' && !currentShiftId) {
      autoOpenShift();
    }
  }, [session?.user]);

  // Search products when query changes
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
        tenantId: (session.user as any).tenantId,
        branchId: (session.user as any).branchId || '00000000-0000-0000-0000-000000000000',
        cashierId: session.user.id,
        subtotal: total,
        total: total,
        paymentMethod: paymentMethod,
        paidAmount: paymentMethod === 'credit' ? (Number(downPayment) || 0) : total,
        debtAmount: paymentMethod === 'credit' ? (total - (Number(downPayment) || 0)) : 0,
        debtMonths: paymentMethod === 'credit' ? debtMonths : undefined,
        customerData: paymentMethod === 'credit' ? {
          fullName: customerName,
          phone: customerPhone,
          imei: saleImei
        } : undefined,
        items: cart.map(item => ({
          productId: item.id,
          productName: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
          costPrice: item.price * 0.8, // Mock cost
          total: item.price * item.quantity,
          imei: item.imei
        }))
      });

      setLastSale({
        ...saleResult,
        cart: [...cart],
        time: new Date().getHours().toString().padStart(2, '0') + ':' + new Date().getMinutes().toString().padStart(2, '0'),
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
        setDownPayment('');
        setSaleImei('');
      }, 1000);
    } catch (err) {
      console.error('Sale creation failed:', err);
      setIsProcessing(false);
      alert("Xatolik yuz berdi: " + (err as any).message);
    }
  };

  const handleShiftToggle = async () => {
    if (!session?.user) return;
    setIsShiftProcessing(true);
    
    try {
      const tenantId = (session.user as any).tenantId;
      const branchId = (session.user as any).branchId || '00000000-0000-0000-0000-000000000000';

      if (shiftStatus === 'closed') {
        // Open shift
        const newShift = await openShift(tenantId, session.user.id, branchId, 0);
        setCurrentShiftId(newShift.id);
        setShiftStatus('open');
      } else {
        // Close shift
        if (currentShiftId) {
          await closeShift(tenantId, currentShiftId, 0, 0, "Avtomatik yopildi"); 
        }
        setCurrentShiftId(null);
        setShiftStatus('closed');
      }
      
      setIsShiftModalOpen(false);
    } catch (err) {
      alert("Smena amaliyotida xatolik: " + (err as any).message);
    } finally {
      setIsShiftProcessing(false);
    }
  };

  const handleLogout = async () => {
    if (session?.user && currentShiftId && shiftStatus === 'open') {
      try {
        const tenantId = (session.user as any).tenantId;
        await closeShift(tenantId, currentShiftId, 0, 0, "Chiqish tizimi orqali yopildi");
      } catch (err) {
        console.error('Failed to close shift on logout:', err);
      }
    }
    router.push('/cashier-login');
  };

  const handlePrint = () => {
    window.print();
  };

  // Redirect if not logged in
  useEffect(() => {
    if (!isPending && !session) {
      router.push('/cashier-login');
    }
  }, [session, isPending, router]);

  if (isPending) return <div className="flex h-screen items-center justify-center bg-[var(--color-bg-base)] text-[var(--color-text-tertiary)]"><Loader2 className="animate-spin" /></div>;
  
  if (!session) return null;

  return (
    <div className={cn(
      "flex flex-col md:flex-row w-full bg-[var(--color-bg-base)] text-[var(--color-foreground)] overflow-hidden font-sans",
      !hideSidebar ? "h-screen" : "h-[calc(100vh-64px)] md:h-full"
    )}>
      {/* Left Sidebar - Quick Actions (Desktop) */}
      {!hideSidebar && (
        <div className="hidden md:flex w-16 flex-col items-center border-r border-[var(--color-border)] bg-[var(--color-bg-elevated)] py-6 gap-2">
          <div className="h-10 w-10 rounded-xl bg-[var(--color-accent)] flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-[var(--color-accent)]/20 mb-4">
            M
          </div>
          {([
            { tab: 'pos' as ActiveTab, icon: ShoppingCart, label: 'Sotuvlar' },
            { tab: 'inventory' as ActiveTab, icon: Package, label: 'Ombor' },
            { tab: 'customers' as ActiveTab, icon: Users, label: 'Mijozlar' },
            { tab: 'credit' as ActiveTab, icon: CreditCard, label: 'Nasiya' },
          ]).map(({ tab, icon: Icon, label }) => (
            <button
              key={tab}
              title={label}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'p-3 rounded-xl transition-all relative group',
                activeTab === tab
                  ? 'bg-[var(--color-accent)]/15 text-[var(--color-accent)]'
                  : 'hover:bg-[var(--color-bg-hover)] text-[var(--color-text-tertiary)]'
              )}
            >
              <Icon size={22} />
              {activeTab === tab && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-[var(--color-accent)] rounded-r-full" />}
            </button>
          ))}

          <div className="w-8 h-px bg-[var(--color-border)] my-2" />

          {([
            { tab: 'reports' as ActiveTab, icon: BarChart, label: 'Hisobotlar' },
            { tab: 'audit' as ActiveTab, icon: Activity, label: 'Audit log' },
          ]).map(({ tab, icon: Icon, label }) => (
            <button
              key={tab}
              title={label}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'p-3 rounded-xl transition-all relative',
                activeTab === tab
                  ? 'bg-[var(--color-accent)]/15 text-[var(--color-accent)]'
                  : 'hover:bg-[var(--color-bg-hover)] text-[var(--color-text-tertiary)]'
              )}
            >
              <Icon size={22} />
              {activeTab === tab && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-[var(--color-accent)] rounded-r-full" />}
            </button>
          ))}

          <div className="mt-auto flex flex-col gap-2">
            <button title="Sozlamalar" className="p-3 rounded-xl hover:bg-[var(--color-bg-hover)] text-[var(--color-text-tertiary)] transition-colors">
              <Settings size={22} />
            </button>
            <button title="Chiqish" onClick={handleLogout} className="p-3 rounded-xl hover:bg-red-500/10 text-red-500 transition-colors">
              <LogOut size={22} />
            </button>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation (Visible only on small screens) */}
      {!hideSidebar && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-[var(--color-border)] bg-[var(--color-bg-elevated)] pb-safe pt-2 px-2">
          {[
            { tab: 'pos' as ActiveTab, icon: ShoppingCart, label: 'Kassa' },
            { tab: 'inventory' as ActiveTab, icon: Package, label: 'Ombor' },
            { tab: 'customers' as ActiveTab, icon: Users, label: 'Mijozlar' },
            { tab: 'credit' as ActiveTab, icon: CreditCard, label: 'Nasiya' },
            { tab: 'reports' as ActiveTab, icon: BarChart, label: 'Hisob' },
          ].map(({ tab, icon: Icon, label }) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'flex flex-col items-center gap-1 p-2 rounded-xl transition-all',
                activeTab === tab ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-tertiary)]'
              )}
            >
              <Icon size={20} />
              <span className="text-[10px] font-bold uppercase tracking-tight">{label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Main Content */}
      <div className={cn(
        "flex-1 flex flex-col min-w-0 pb-[70px] md:pb-0",
        activeTab !== 'pos' && "overflow-hidden"
      )}>
        {/* Actual Components for non-POS views */}
        {activeTab === 'inventory' && (
          <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[var(--color-bg-base)]">
            <InventoryList initialData={inventoryData} />
          </div>
        )}
        {activeTab === 'customers' && (
          <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[var(--color-bg-base)]">
            <CustomerList initialData={customersData} />
          </div>
        )}
        {activeTab === 'credit' && (
          <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[var(--color-bg-base)]">
            <DebtList initialData={debtsData} />
          </div>
        )}
        {activeTab === 'reports' && (
          <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[var(--color-bg-base)] text-center py-20">
            <BarChart size={64} className="mx-auto mb-4 opacity-20" />
            <h2 className="text-xl font-bold">Hisobotlar</h2>
            <p className="text-[var(--color-text-secondary)]">Ushbu bo'lim tez orada ishga tushadi.</p>
          </div>
        )}
        {activeTab === 'audit' && (
          <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[var(--color-bg-base)] text-center py-20">
            <Activity size={64} className="mx-auto mb-4 opacity-20" />
            <h2 className="text-xl font-bold">Audit Log</h2>
            <p className="text-[var(--color-text-secondary)]">Tizim harakatlari jurnali bu yerda ko'rinadi.</p>
          </div>
        )}
        {activeTab === 'pos' && (
          <>
            {/* Top Header */}
            <header className="flex h-16 md:h-20 shrink-0 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-bg-elevated)]/50 px-4 md:px-8 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--color-info)] to-[var(--color-purple)] text-white shadow-lg">
                  <Smartphone size={18} className="md:size-22" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm md:text-lg font-bold leading-none">Kassa #1</span>
                  <button 
                    onClick={() => setIsShiftModalOpen(true)}
                    className="flex items-center gap-1.5 mt-1 hover:opacity-80 transition-opacity text-left"
                  >
                    <span className="relative flex h-1.5 w-1.5">
                      {shiftStatus === 'open' && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-success)] opacity-75"></span>}
                      <span className={cn("relative inline-flex rounded-full h-1.5 w-1.5", shiftStatus === 'open' ? "bg-[var(--color-success)]" : "bg-[var(--color-danger)]")}></span>
                    </span>
                    <span className={cn("text-[9px] md:text-[10px] font-bold uppercase tracking-wider", shiftStatus === 'open' ? "text-[var(--color-success)]" : "text-[var(--color-danger)]")}>
                      {shiftStatus === 'open' ? 'Smena ochiq' : 'Smena yopiq'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Mobile View Switcher */}
              <div className="flex md:hidden items-center bg-[var(--color-bg-card)] rounded-xl p-1 border border-[var(--color-border)]">
                <button
                  onClick={() => setMobileView('catalog')}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                    mobileView === 'catalog' ? "bg-[var(--color-accent)] text-white" : "text-[var(--color-text-tertiary)]"
                  )}
                >
                  Katalog
                </button>
                <button
                  onClick={() => setMobileView('cart')}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-xs font-bold transition-all relative",
                    mobileView === 'cart' ? "bg-[var(--color-accent)] text-white" : "text-[var(--color-text-tertiary)]"
                  )}
                >
                  Savat
                  {cart.length > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-danger)] text-[8px] text-white">
                      {cart.length}
                    </span>
                  )}
                </button>
              </div>

              {!hideSidebar && (
                <div className="hidden md:flex items-center gap-6">
                  <button
                    onClick={() => {
                      setCart([]);
                      setSearch('');
                      setPaymentMethod('cash');
                      if (searchInputRef.current) {
                        searchInputRef.current.focus();
                      }
                    }}
                    className="px-4 py-2 bg-[var(--color-accent)] text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-[var(--color-accent)]/20 hover:bg-[var(--color-accent-hover)] transition-all active:scale-95"
                  >
                    <Plus size={20} />
                    Yangi savdo
                  </button>
                  <div className="w-px h-8 bg-[var(--color-border)]" />
                  <div className="text-right">
                    <div className="text-sm font-bold">{session.user.name}</div>
                    <div className="text-[10px] font-bold uppercase text-[var(--color-text-tertiary)]">Kassir / Filial #1</div>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[var(--color-accent)] to-orange-400" />
                </div>
              )}
            </header>

            {/* Content Area */}
            <div className="flex-1 p-3 md:p-6 flex flex-col md:flex-row gap-4 md:gap-6 overflow-hidden">
              {/* Product Search & Catalog */}
              <div className={cn(
                "flex-1 flex flex-col gap-4 md:gap-6 min-w-0",
                mobileView === 'cart' && "hidden md:flex"
              )}>
                {/* Search Bar */}
                <div className="relative group">
                  <div className="absolute inset-y-0 left-4 flex items-center text-[var(--color-text-tertiary)] group-focus-within:text-[var(--color-accent)] transition-colors pointer-events-none">
                    <ScanBarcode size={24} className="md:size-7" />
                  </div>
                  <input
                    ref={searchInputRef}
                    autoFocus
                    type="text"
                    placeholder="Tovar nomi... (F1)"
                    className="w-full h-12 md:h-16 rounded-2xl bg-[var(--color-bg-elevated)] border-2 border-[var(--color-border)] px-12 md:px-14 text-sm md:text-lg font-medium outline-none focus:border-[var(--color-accent)] focus:ring-8 focus:ring-[var(--color-accent)]/5 transition-all shadow-sm"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <div className="hidden md:flex absolute inset-y-0 right-4 items-center">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--color-bg-base)] border border-[var(--color-border)] text-[10px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider">
                      <Keyboard size={12} />
                      F1 Qidirish
                    </div>
                  </div>
                </div>

                {/* Catalog Grid */}
                <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 content-start custom-scrollbar">
                  {isSearching ? (
                    <div className="col-span-full flex justify-center py-10 text-[var(--color-text-tertiary)]">
                      <Loader2 className="animate-spin" size={32} />
                    </div>
                  ) : products.length > 0 ? (
                    products.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => addToCart(p)}
                        className="premium-card group rounded-2xl p-3 md:p-4 text-left hover:border-[var(--color-accent)] transition-all active:scale-95"
                      >
                        <div className="mb-2 md:mb-3 aspect-square rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)] flex items-center justify-center group-hover:bg-[var(--color-accent)]/5 transition-colors overflow-hidden">
                          {p.productType === 'phone' ? <Smartphone size={24} className="md:size-32 text-[var(--color-text-tertiary)] group-hover:text-[var(--color-accent)]" /> : <Headphones size={24} className="md:size-32 text-[var(--color-text-tertiary)] group-hover:text-[var(--color-accent)]" />}
                        </div>
                        <div className="font-bold text-xs md:text-sm line-clamp-2 h-8 md:h-10 mb-1">{pName(p)}</div>
                        <div className="text-[9px] md:text-[10px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider mb-2 md:mb-3">{p.brand}</div>
                        <div className="flex items-end justify-between">
                          <div className="font-display text-base md:text-lg font-bold text-[var(--color-accent)]">
                            {formatSum(p.retailPrice, false)}
                          </div>
                          <div className="text-[9px] md:text-[10px] font-bold text-[var(--color-text-tertiary)] mb-0.5">SO'M</div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="col-span-full flex flex-col items-center justify-center py-12 md:py-20 text-[var(--color-text-tertiary)] opacity-50">
                      <ScanBarcode size={48} className="md:size-64 mb-4" />
                      <p className="text-sm md:text-base">Mahsulot topilmadi</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Cart / Right Sidebar */}
              <div className={cn(
                "w-full md:w-[350px] lg:w-[400px] flex flex-col bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-3xl overflow-hidden shadow-2xl",
                mobileView === 'catalog' && "hidden md:flex"
              )}>
                {/* Cart Header */}
                <div className="p-4 md:p-6 border-b border-[var(--color-border)] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 md:h-10 md:w-10 rounded-xl bg-[var(--color-accent)]/10 flex items-center justify-center text-[var(--color-accent)]">
                      <ShoppingCart size={18} className="md:size-20" />
                    </div>
                    <div>
                      <div className="font-bold text-sm md:text-base">Savat</div>
                      <div className="text-[9px] md:text-[10px] font-bold uppercase text-[var(--color-text-tertiary)]">{cart.length} ta mahsulot</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setCart([])}
                    className="p-2 text-[var(--color-text-tertiary)] hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                    title="Savatni tozalash"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar min-h-0">
                  {cart.length > 0 ? (
                    cart.map((item) => (
                      <div key={item.id} className="group relative flex items-center gap-3 md:gap-4 p-3 rounded-2xl bg-[var(--color-bg-base)] border border-[var(--color-border)] hover:border-[var(--color-accent)]/50 transition-all">
                        <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-[var(--color-bg-elevated)] flex items-center justify-center shrink-0">
                          {item.type === 'phone' ? <Smartphone size={18} className="md:size-20 text-[var(--color-text-tertiary)]" /> : <Headphones size={18} className="md:size-20 text-[var(--color-text-tertiary)]" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-xs md:text-sm truncate pr-6">{item.name}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center bg-[var(--color-bg-elevated)] rounded-lg border border-[var(--color-border)]">
                              <button
                                onClick={() => updateQuantity(item.id, -1)}
                                className="px-2 py-1 text-[var(--color-text-tertiary)] hover:text-[var(--color-accent)] transition-colors"
                              >
                                -
                              </button>
                              <span className="px-2 text-xs font-mono font-bold">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.id, 1)}
                                className="px-2 py-1 text-[var(--color-text-tertiary)] hover:text-[var(--color-accent)] transition-colors"
                              >
                                +
                              </button>
                            </div>
                            <div className="text-[10px] md:text-xs font-bold text-[var(--color-accent)]">
                              {formatSum(item.price * item.quantity, false)}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-[var(--color-text-tertiary)] opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-[var(--color-text-tertiary)] opacity-50 space-y-4">
                      <ShoppingCart size={48} />
                      <p className="text-xs font-bold uppercase tracking-widest">Savat bo'sh</p>
                    </div>
                  )}
                </div>

                {/* Cart Footer */}
                <div className="p-4 md:p-6 bg-[var(--color-bg-card)] border-t border-[var(--color-border)] space-y-4 md:space-y-6">
                  <div className="flex items-end justify-between">
                    <div className="text-[10px] font-bold uppercase text-[var(--color-text-tertiary)] tracking-widest">Jami</div>
                    <div className="flex items-baseline gap-1.5">
                      <div className="font-display text-2xl md:text-3xl font-bold text-[var(--color-accent)]">{formatSum(total, false)}</div>
                      <div className="text-[10px] font-bold text-[var(--color-text-tertiary)] mb-1 uppercase">so'm</div>
                    </div>
                  </div>

                  <button
                    disabled={cart.length === 0 || isProcessing}
                    onClick={() => setIsPaymentModalOpen(true)}
                    className="w-full h-12 md:h-14 rounded-2xl bg-[var(--color-accent)] text-white font-bold flex items-center justify-center gap-3 shadow-xl shadow-[var(--color-accent)]/20 hover:bg-[var(--color-accent-hover)] active:scale-95 transition-all disabled:opacity-50 disabled:grayscale disabled:scale-100"
                  >
                    <Wallet size={20} className="shrink-0" />
                    To'lov (F2)
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Shift Management Modal */}
      {isShiftModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-sm bg-[var(--color-bg-elevated)] rounded-[32px] border border-[var(--color-border)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 md:p-8 flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-display font-bold">Smena</h2>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    {shiftStatus === 'closed' ? 'Yangi smena ochish' : 'Smenani yopish'}
                  </p>
                </div>
                <button
                  onClick={() => setIsShiftModalOpen(false)}
                  className="h-10 w-10 rounded-full border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-hover)] transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-[var(--color-text-secondary)] text-sm">
                  {shiftStatus === 'open' ? 'Smenani yopishni tasdiqlaysizmi?' : 'Smenani ochishni tasdiqlaysizmi?'}
                </p>
              </div>

              <div className="flex gap-3 mt-2">
                <button
                  onClick={handleShiftToggle}
                  disabled={isShiftProcessing}
                  className={cn(
                    "w-full h-14 rounded-2xl text-white font-bold text-lg shadow-xl hover:opacity-90 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:scale-100",
                    shiftStatus === 'closed' ? "bg-[var(--color-success)] shadow-[var(--color-success)]/20" : "bg-[var(--color-danger)] shadow-[var(--color-danger)]/20"
                  )}
                >
                  {isShiftProcessing ? <Loader2 className="animate-spin" size={24} /> : (
                    shiftStatus === 'closed' ? "Tasdiqlash" : "Smenani yopish"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                  {formatSum(total, false)}
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
                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="IMEI kodni yozing"
                          value={saleImei}
                          onChange={(e) => setSaleImei(e.target.value)}
                          className="w-full h-12 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)] px-10 text-sm font-medium outline-none focus:border-[var(--color-accent)] transition-all"
                        />
                        <Smartphone size={18} className="absolute left-3 top-3.5 text-[var(--color-text-tertiary)]" />
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          placeholder="Boshlang'ich to'lov"
                          value={downPayment}
                          onChange={(e) => setDownPayment(e.target.value)}
                          className="w-full h-12 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)] px-10 text-sm font-medium outline-none focus:border-[var(--color-accent)] transition-all"
                        />
                        <Banknote size={18} className="absolute left-3 top-3.5 text-[var(--color-text-tertiary)]" />
                      </div>
                    </div>

                    <div className="relative">
                      <input
                        type="number"
                        min={1}
                        max={60}
                        placeholder="Muddat (oyda)"
                        value={debtMonths}
                        onChange={(e) => setDebtMonths(Math.max(1, Number(e.target.value)))}
                        className="w-full h-12 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)] px-10 text-sm font-medium outline-none focus:border-[var(--color-accent)] transition-all"
                      />
                      <Calendar size={18} className="absolute left-3 top-3.5 text-[var(--color-text-tertiary)]" />
                      <div className="absolute right-3 top-3.5 text-[10px] font-bold text-[var(--color-text-tertiary)] uppercase">OY</div>
                    </div>

                    {/* Quick Debt Calculation Info */}
                    <div className="mt-2 p-3 rounded-2xl bg-[var(--color-accent)]/5 border border-[var(--color-accent)]/10 space-y-1">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                        <span>Qolgan qarz:</span>
                        <span className="text-[var(--color-foreground)] font-bold">
                          {formatSum(total - (Number(downPayment) || 0), false)} so'm
                        </span>
                      </div>
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                        <span>Oylik to'lov:</span>
                        <span className="text-[var(--color-accent)] font-bold text-sm">
                          {formatSum(Math.ceil((total - (Number(downPayment) || 0)) / (debtMonths || 1)), false)} so'm
                        </span>
                      </div>
                    </div>

                    {/* Schedule Preview */}
                    <div className="mt-2 border border-[var(--color-border)] rounded-2xl overflow-hidden bg-[var(--color-bg-base)]/50">
                      <div className="px-4 py-2 bg-[var(--color-bg-elevated)] border-b border-[var(--color-border)] flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-tertiary)]">To'lovlar grafigi</span>
                        <span className="text-[10px] font-bold text-[var(--color-accent)]">{debtMonths} oy</span>
                      </div>
                      <div className="max-h-32 overflow-y-auto custom-scrollbar p-2 space-y-1">
                        {Array.from({ length: debtMonths }).map((_, i) => {
                          const d = new Date();
                          d.setMonth(d.getMonth() + i + 1);
                          const amt = i === debtMonths - 1 
                            ? (total - (Number(downPayment) || 0)) - (Math.ceil((total - (Number(downPayment) || 0)) / debtMonths) * (debtMonths - 1))
                            : Math.ceil((total - (Number(downPayment) || 0)) / debtMonths);
                          
                          return (
                            <div key={i} className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-[var(--color-bg-elevated)] transition-colors text-[11px]">
                              <div className="flex items-center gap-2">
                                <span className="h-4 w-4 rounded bg-[var(--color-bg-elevated)] border border-[var(--color-border)] flex items-center justify-center text-[8px] font-bold text-[var(--color-text-tertiary)]">{i + 1}</span>
                                <span className="font-medium">{d.getDate()} {['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'][d.getMonth()]}</span>
                              </div>
                              <span className="font-bold">{formatSum(amt, false)} so'm</span>
                            </div>
                          );
                        })}
                      </div>
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
                  {isProcessing ? <Loader2 className="animate-spin" size={24} /> : isSuccess ? <CheckCircle2 size={24} /> : (
                    paymentMethod === 'credit' ? "Nasiyani saqlash" : "To'lovni tasdiqlash"
                  )}
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
                  <span className="font-bold">{lastSale.receipt_number || lastSale.id.slice(0, 8).toUpperCase()}</span>
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
                        <span className="w-20 text-right">{formatSum(item.price * item.quantity, false)}</span>
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
                  <span className="font-bold">{formatSum(lastSale.total, false)} SO'M</span>
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
                    <div>Oylik to'lov: {formatSum(Math.ceil(lastSale.total / lastSale.debtMonths), false)} SO'M</div>
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

      <style dangerouslySetInnerHTML={{ __html: `
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
      `}} />
    </div>
  );
}

