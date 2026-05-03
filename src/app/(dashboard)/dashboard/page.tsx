
import { getDashboardKpis, getSales } from '@/db/queries';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { 
  Banknote, 
  ShoppingCart, 
  TrendingUp, 
  AlertCircle,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  MoreVertical,
  Activity,
  History,
  Zap
} from 'lucide-react';
import { formatSum, formatUSD, formatRelativeTime } from '@/lib/utils';
import Link from 'next/link';

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const tenantId = session?.user.tenantId;

  // Initialize with empty/default values in case of failure
  let kpisData: any = { 
    today: { revenue: 0, count: 0, profit: 0, avgTicket: 0 },
    yesterday: { revenue: 0 },
    debts: { totalAmount: 0, overdueCount: 0 }
  };
  let recentSales: any[] = [];

  try {
    if (tenantId) {
      const [kpis, sales] = await Promise.all([
        getDashboardKpis(tenantId),
        getSales(tenantId, 8)
      ]);
      kpisData = kpis;
      recentSales = sales;
    }
  } catch (error) {
    console.error('[Dashboard] Error fetching data:', error);
    // Fallback to empty state already initialized above
  }

  const formatPrice = (price: number) => formatSum(price, false);

  const kpis = [
    {
      label: 'Bugungi savdo',
      value: formatPrice(kpisData.today.revenue),
      usdValue: formatUSD(kpisData.today.revenue),
      unit: "so'm",
      icon: Banknote,
      color: '#FF6B35',
      trend: '12.4%',
      trendType: 'up',
    },
    {
      label: 'Sotuvlar soni',
      value: kpisData.today.count.toString(),
      usdValue: null,
      unit: 'chek',
      icon: ShoppingCart,
      color: '#64D2FF',
      trend: '4 ta',
      trendType: 'up',
    },
    {
      label: 'Sof foyda',
      value: formatPrice(kpisData.today.profit),
      usdValue: formatUSD(kpisData.today.profit),
      unit: "so'm",
      icon: TrendingUp,
      color: '#30D158',
      trend: '8.1%',
      trendType: 'up',
    },
    {
      label: 'Aktiv qarzlar',
      value: formatPrice(kpisData.debts.totalAmount),
      usdValue: formatUSD(kpisData.debts.totalAmount),
      unit: "so'm",
      icon: AlertCircle,
      color: '#FF453A',
      trend: kpisData.debts.overdueCount + ' ta',
      trendType: 'down',
    },
  ];

  return (
    <div className="space-y-8 animate-fade-up">
      {/* Welcome Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-4xl text-[var(--color-foreground)]">Xush kelibsiz!</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">Do'koningizning bugungi holati qanday?</p>
        </div>
        <div className="flex items-center gap-2 p-1 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl">
          <button className="px-4 py-2 text-xs font-bold rounded-lg bg-[var(--color-accent)] text-white shadow-lg shadow-[var(--color-accent)]/20">Bugun</button>
          <button className="px-4 py-2 text-xs font-bold text-[var(--color-text-tertiary)] hover:text-[var(--color-foreground)] transition-colors">Hafta</button>
          <button className="px-4 py-2 text-xs font-bold text-[var(--color-text-tertiary)] hover:text-[var(--color-foreground)] transition-colors">Oy</button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, idx) => (
          <div
            key={kpi.label}
            className="group relative overflow-hidden transition-all duration-300 hover:translate-y-[-4px]"
            style={{
              background: 'rgba(24, 25, 27, 0.4)',
              backdropFilter: 'blur(10px)',
              border: '1px solid var(--color-border)',
              borderRadius: 24,
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            }}
          >
            {/* Ambient glow */}
            <div style={{
              position: 'absolute',
              top: -20,
              right: -20,
              width: 100,
              height: 100,
              background: `${kpi.color}15`,
              filter: 'blur(30px)',
              borderRadius: '50%',
              zIndex: 0
            }} />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
              <div style={{
                background: `${kpi.color}15`,
                borderRadius: 14,
                width: 44,
                height: 44,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `1px solid ${kpi.color}30`,
              }} className="group-hover:scale-110 transition-transform duration-300">
                <kpi.icon size={22} color={kpi.color} />
              </div>
              <div
                className="flex items-center gap-1 rounded-full px-3 py-1 font-mono-tabular text-[10px] font-black uppercase tracking-wider"
                style={{
                  backgroundColor: kpi.trendType === 'up' ? 'rgba(48, 209, 88, 0.1)' : 'rgba(255, 69, 58, 0.1)',
                  color: kpi.trendType === 'up' ? 'var(--color-success)' : 'var(--color-danger)',
                }}
              >
                {kpi.trendType === 'up' ? <ArrowUpRight size={10} /> : <ArrowDownLeft size={10} />}
                {kpi.trend}
              </div>
            </div>

            <div style={{ position: 'relative', zIndex: 1 }}>
              <span style={{ color: 'var(--color-text-tertiary)', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{kpi.label}</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 4 }}>
                <p style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-foreground)', margin: 0, letterSpacing: '-0.02em' }}>{kpi.value}</p>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-tertiary)' }}>{kpi.unit}</span>
              </div>
              {kpi.usdValue && (
                <div style={{ color: 'var(--color-accent)', fontWeight: 700, fontSize: 13, marginTop: 4, opacity: 0.8 }}>
                  {kpi.usdValue}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Charts & Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 relative group overflow-hidden" style={{
          background: 'var(--color-bg-card)',
          borderRadius: 32,
          border: '1px solid var(--color-border)',
          padding: '32px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
        }}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Activity size={20} className="text-[var(--color-accent)]" />
                Savdo Grafigi
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)] mt-1">Haftalik savdo hajmi dinamikasi</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[var(--color-accent)]" />
                <span className="text-xs font-bold text-[var(--color-text-secondary)]">Savdo</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[var(--color-info)]" />
                <span className="text-xs font-bold text-[var(--color-text-secondary)]">Foyda</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full flex items-end justify-between gap-3 px-2">
            {[35, 60, 45, 85, 70, 95, 55].map((h, i) => (
              <div key={i} className="group/bar relative flex-1 flex flex-col items-center gap-4">
                {/* Value Label */}
                <div className="opacity-0 group-hover/bar:opacity-100 transition-opacity absolute -top-8 px-2 py-1 rounded bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-[10px] font-black text-white whitespace-nowrap z-10 shadow-xl">
                  {formatSum(h * 1000000, true)}
                </div>
                
                {/* Bar */}
                <div 
                  className="w-full rounded-t-xl transition-all duration-500 ease-spring relative overflow-hidden"
                  style={{ 
                    height: `${h}%`,
                    background: i === 5 ? 'var(--color-accent)' : 'var(--color-bg-elevated)',
                    border: i === 5 ? 'none' : '1px solid var(--color-border)',
                    boxShadow: i === 5 ? '0 0 30px rgba(255, 107, 53, 0.3)' : 'none'
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  {i === 5 && <div className="absolute inset-0 bg-white/10 animate-pulse-dot" />}
                </div>
                
                <span className="text-[10px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest">
                  {['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'][i]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div style={{
          background: 'var(--color-bg-card)',
          borderRadius: 32,
          border: '1px solid var(--color-border)',
          padding: '32px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
        }} className="flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <History size={20} className="text-[var(--color-accent)]" />
              Oxirgi Harakatlar
            </h2>
            <Link href="/sales" className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-white/5 text-[var(--color-text-secondary)] transition-colors">
              <ArrowUpRight size={18} />
            </Link>
          </div>

          <div className="space-y-6 flex-1 overflow-y-auto pr-2">
            {recentSales.map((sale: any) => (
              <div key={sale.id} className="flex items-center gap-4 group cursor-pointer hover:translate-x-1 transition-transform">
                <div className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)] group-hover:border-[var(--color-accent)] transition-colors">
                  <Zap size={18} className="text-[var(--color-text-tertiary)] group-hover:text-[var(--color-accent)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-[var(--color-foreground)] truncate">#{sale.receiptNumber}</div>
                  <div className="text-[10px] text-[var(--color-text-tertiary)] uppercase font-bold tracking-wider mt-0.5">{formatRelativeTime(sale.createdAt)}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-black text-[var(--color-success)]">+{formatSum(sale.total, false)}</div>
                  <div className="text-[10px] text-[var(--color-text-tertiary)] uppercase font-bold tracking-widest">{sale.paymentMethod}</div>
                </div>
              </div>
            ))}

            {recentSales.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                <div className="h-16 w-16 mb-4 rounded-full border-2 border-dashed border-[var(--color-border)] flex items-center justify-center">
                  <History size={24} />
                </div>
                <p className="text-sm font-bold">Ma'lumot yo'q</p>
              </div>
            )}
          </div>

          <Link 
            href="/sales" 
            className="mt-8 flex items-center justify-center gap-2 py-3 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-xs font-bold hover:bg-[var(--color-bg-hover)] transition-colors"
          >
            Barchasini ko'rish
          </Link>
        </div>
      </div>
    </div>
  );
}
