import { getDashboardKpis } from '@/db/queries';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { 
  Banknote, 
  ShoppingCart, 
  TrendingUp, 
  AlertCircle,
  ArrowUpRight,
  ArrowDownLeft 
} from 'lucide-react';

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Fetch KPIs filtered by tenant_id
  const kpisData = await getDashboardKpis(session?.user.tenantId);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('uz-UZ').format(price);
  };

  const kpis = [
    {
      label: 'Bugungi savdo',
      value: formatPrice(kpisData.today.revenue),
      unit: "so'm",
      icon: <Banknote size={20} />,
      iconBg: 'rgba(255, 107, 53, 0.1)',
      iconColor: 'var(--color-accent)',
      trend: '12.4%',
      trendType: 'up',
    },
    {
      label: 'Sotuvlar soni',
      value: kpisData.today.count.toString(),
      unit: 'chek',
      icon: <ShoppingCart size={20} />,
      iconBg: 'rgba(100, 210, 255, 0.12)',
      iconColor: 'var(--color-info)',
      trend: '4 ta',
      trendType: 'up',
    },
    {
      label: 'Sof foyda',
      value: formatPrice(kpisData.today.profit),
      unit: "so'm",
      icon: <TrendingUp size={20} />,
      iconBg: 'rgba(48, 209, 88, 0.12)',
      iconColor: 'var(--color-success)',
      trend: '8.1%',
      trendType: 'up',
    },
    {
      label: 'Aktiv qarzlar',
      value: formatPrice(kpisData.debts.totalAmount),
      unit: "so'm",
      icon: <AlertCircle size={20} />,
      iconBg: 'rgba(255, 69, 58, 0.12)',
      iconColor: 'var(--color-danger)',
      trend: kpisData.debts.overdueCount + ' ta',
      trendType: 'down',
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="premium-card animate-fade-up rounded-2xl p-5"
          >
            <div className="mb-4 flex items-start justify-between">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-[10px] text-lg"
                style={{ backgroundColor: kpi.iconBg, color: kpi.iconColor }}
              >
                {kpi.icon}
              </div>
              <div
                className="flex items-center gap-1 rounded-md px-2 py-0.5 font-mono-tabular text-[11px] font-bold"
                style={{
                  backgroundColor: kpi.trendType === 'up' ? 'rgba(48, 209, 88, 0.12)' : 'rgba(255, 69, 58, 0.12)',
                  color: kpi.trendType === 'up' ? 'var(--color-success)' : 'var(--color-danger)',
                }}
              >
                {kpi.trendType === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownLeft size={12} />}
                {kpi.trend}
              </div>
            </div>
            <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--color-text-tertiary)]">
              {kpi.label}
            </div>
            <div className="font-mono-tabular text-3xl font-bold leading-none tracking-tight">
              {kpi.value}
              <span className="ml-1 text-sm font-medium text-[var(--color-text-tertiary)]">
                {kpi.unit}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Stats / Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 premium-card rounded-2xl p-8 flex flex-col justify-center items-center text-center">
          <div className="h-48 w-full flex items-end justify-center gap-4 px-10">
            {[40, 70, 45, 90, 65, 80, 55].map((h, i) => (
              <div key={i} className="flex-1 bg-gradient-to-t from-[var(--color-accent)] to-orange-400 rounded-t-lg opacity-20" style={{ height: `${h}%` }} />
            ))}
          </div>
          <div className="mt-6 font-display text-2xl">Savdo grafigi</div>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">Ushbu haftalik savdo hajmi real vaqt rejimida yangilanmoqda.</p>
        </div>
        
        <div className="premium-card rounded-2xl p-6">
          <div className="font-bold mb-4">Oxirgi harakatlar</div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)]" />
                <div className="flex-1">
                  <div className="text-xs font-bold">Yangi savdo #{8490 + i}</div>
                  <div className="text-[10px] text-[var(--color-text-tertiary)]">2 daqiqa oldin</div>
                </div>
                <div className="text-xs font-bold text-[var(--color-success)]">+1,200,000</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
