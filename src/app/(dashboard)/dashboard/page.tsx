
import { getDashboardKpis, getSales, getChartData } from '@/db/queries';
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
import { DashboardFilter } from '@/components/dashboard/dashboard-filter';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period = 'today' } = await searchParams;
  let session = null;
  try {
    session = await auth.api.getSession({
      headers: await headers(),
    });
  } catch (error) {
    console.error('[Dashboard Page] auth.api.getSession failed:', error);
  }

  const tenantId = session?.user.tenantId;

  // Calculate dates based on period in Uzbekistan Time (UTC+5)
  const uzbTime = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Tashkent' }));
  let startDate: string | undefined;
  let endDate: string | undefined;

  if (period === 'today') {
    const today = new Date(uzbTime);
    today.setHours(0, 0, 0, 0);
    // Convert local 00:00 back to UTC for database comparison
    // Tashkent is UTC+5, so 00:00 Tashkent is 19:00 UTC previous day
    startDate = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString();
    // Actually, a simpler way to get the exact start of today in Uzb as a UTC string:
    const d = new Date(uzbTime);
    d.setHours(0, 0, 0, 0);
    // We need to offset the UTC date to match the beginning of Uzb day
    // Uzb is 5 hours ahead, so 00:00 Uzb = 19:00 UTC (prev day)
    const startOfTodayUzb = new Date(d.getTime() - (5 * 60 * 60 * 1000));
    startDate = startOfTodayUzb.toISOString();
  } else if (period === 'week') {
    const weekAgo = new Date(uzbTime);
    weekAgo.setDate(uzbTime.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);
    startDate = new Date(weekAgo.getTime() - (5 * 60 * 60 * 1000)).toISOString();
  } else if (period === 'month') {
    const monthAgo = new Date(uzbTime);
    monthAgo.setMonth(uzbTime.getMonth() - 1);
    monthAgo.setHours(0, 0, 0, 0);
    startDate = new Date(monthAgo.getTime() - (5 * 60 * 60 * 1000)).toISOString();
  }

  // Initialize with empty/default values in case of failure
  let kpisData: any = { 
    today: { revenue: 0, count: 0, profit: 0, avgTicket: 0 },
    yesterday: { revenue: 0 },
    debts: { totalAmount: 0, overdueCount: 0 }
  };
  let recentSales: any[] = [];
  let chartData: any[] = [];

  try {
    if (tenantId) {
      const days = period === 'month' ? 30 : period === 'week' ? 7 : 7;
      const [kpis, sales, chart] = await Promise.all([
        getDashboardKpis(tenantId, startDate, endDate),
        getSales(tenantId, 8),
        getChartData(tenantId, days)
      ]);
      kpisData = kpis;
      recentSales = sales;
      chartData = chart;
    }
  } catch (error) {
    console.error('[Dashboard] Error fetching data:', error);
  }

  const formatPrice = (price: number) => formatSum(price, false);

  const periodLabel = period === 'today' ? 'Bugungi' : period === 'week' ? 'Haftalik' : 'Oylik';

  const kpis = [
    {
      label: `${periodLabel} savdo`,
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

  const maxRevenue = Math.max(...chartData.map(d => d.revenue), 1000000);

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Welcome Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between bg-[var(--color-bg-card)]/30 p-4 md:p-6 rounded-[24px] border border-[var(--color-border)]/50 backdrop-blur-md">
        <div>
          <h1 className="font-display text-2xl md:text-3xl text-[var(--color-foreground)] tracking-tight">
            Xush kelibsiz!
          </h1>
          <p className="text-[var(--color-text-secondary)] text-sm mt-0.5 opacity-80">
            Do'koningizning {period === 'today' ? 'bugungi' : period === 'week' ? 'haftalik' : 'oylik'} holati qanday?
          </p>
        </div>
        <div className="flex-shrink-0">
          <DashboardFilter />
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, idx) => (
          <div
            key={kpi.label}
            className="group relative overflow-hidden transition-all duration-300 hover:translate-y-[-4px]"
            style={{
              background: 'rgba(24, 25, 27, 0.4)',
              backdropFilter: 'blur(10px)',
              border: '1px solid var(--color-border)',
              borderRadius: 24,
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
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
                borderRadius: 12,
                width: 40,
                height: 40,
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

          <div className="h-64 w-full flex items-end justify-between gap-1.5 sm:gap-3 px-2">
            {chartData.map((d, i) => {
              const h = (d.revenue / maxRevenue) * 100;
              const ph = (d.profit / maxRevenue) * 100;
              return (
                <div key={i} className="group/bar relative flex-1 flex flex-col items-center gap-4 h-full justify-end">
                  {/* Tooltip */}
                  <div className="opacity-0 group-hover/bar:opacity-100 transition-all duration-300 absolute -top-12 px-3 py-2 rounded-xl bg-black/80 backdrop-blur-md border border-white/10 text-[10px] font-bold text-white whitespace-nowrap z-20 shadow-2xl scale-90 group-hover/bar:scale-100">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-gray-400">Savdo:</span>
                        <span className="text-[var(--color-accent)]">{formatSum(d.revenue, false)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-gray-400">Foyda:</span>
                        <span className="text-[var(--color-success)]">{formatSum(d.profit, false)}</span>
                      </div>
                      <div className="mt-1 pt-1 border-t border-white/10 text-center opacity-60">
                        {d.date}
                      </div>
                    </div>
                  </div>
                  
                  {/* Bars Container */}
                  <div className="w-full flex items-end justify-center gap-0.5 h-full relative">
                    {/* Revenue Bar */}
                    <div 
                      className="w-full max-w-[12px] sm:max-w-[20px] rounded-t-lg transition-all duration-700 ease-spring relative overflow-hidden"
                      style={{ 
                        height: `${Math.max(h, 2)}%`,
                        background: i === chartData.length - 1 ? 'var(--color-accent)' : 'var(--color-bg-elevated)',
                        border: i === chartData.length - 1 ? 'none' : '1px solid var(--color-border)',
                        boxShadow: i === chartData.length - 1 ? '0 0 30px rgba(255, 107, 53, 0.3)' : 'none'
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                      {i === chartData.length - 1 && <div className="absolute inset-0 bg-white/20 animate-pulse" />}
                    </div>

                    {/* Profit Bar (Layered) */}
                    <div 
                      className="w-full max-w-[8px] sm:max-w-[14px] rounded-t-lg transition-all duration-1000 ease-spring absolute bottom-0 opacity-40 group-hover/bar:opacity-100"
                      style={{ 
                        height: `${Math.max(ph, 1)}%`,
                        background: 'var(--color-info)',
                        mixBlendMode: 'plus-lighter'
                      }}
                    />
                  </div>
                  
                  <span className="text-[9px] font-black text-[var(--color-text-tertiary)] uppercase tracking-tighter sm:tracking-widest opacity-60 group-hover/bar:opacity-100 transition-opacity">
                    {d.day}
                  </span>
                </div>
              );
            })}
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
