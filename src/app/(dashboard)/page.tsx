export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* KPI grid placeholder */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="premium-card animate-fade-up rounded-2xl p-5"
          >
            <div className="mb-4 flex items-start justify-between">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-[10px] text-lg"
                style={{ backgroundColor: kpi.iconBg }}
              >
                {kpi.icon}
              </div>
              <div
                className="rounded-md px-2 py-0.5 font-mono-tabular text-[11px] font-bold"
                style={{
                  backgroundColor: 'rgba(48, 209, 88, 0.12)',
                  color: 'var(--color-success)',
                }}
              >
                ▲ {kpi.trend}
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

      {/* Welcome card */}
      <div className="premium-card rounded-2xl p-8 text-center">
        <div className="mb-3 font-display text-3xl">
          Bu sizning dashboardingiz boshlanishi
        </div>
        <p className="mx-auto max-w-xl text-sm leading-relaxed text-[var(--color-text-secondary)]">
          Loyiha skeleton tayyor. Endi <code className="rounded bg-[var(--color-bg-elevated)] px-1.5 py-0.5 font-mono text-xs text-[var(--color-accent)]">@/db/queries.ts</code> dan
          KPI funksiyalarini chaqirib, real ma&apos;lumotlar bilan to&apos;ldiring.
        </p>
        <p className="mt-4 text-xs text-[var(--color-text-tertiary)]">
          Tayyor mockup uchun:{' '}
          <code className="rounded bg-[var(--color-bg-elevated)] px-1.5 py-0.5 font-mono text-xs">
            admin-dashboard-mockup.html
          </code>
        </p>
      </div>
    </div>
  );
}

const kpis = [
  {
    label: 'Bugungi savdo',
    value: '47,250,000',
    unit: 'so\'m',
    icon: '💰',
    iconBg: 'rgba(255, 107, 53, 0.1)',
    trend: '12.4%',
  },
  {
    label: 'Sotuvlar soni',
    value: '23',
    unit: 'chek',
    icon: '🧾',
    iconBg: 'rgba(100, 210, 255, 0.12)',
    trend: '4 ta',
  },
  {
    label: 'Sof foyda',
    value: '8,470,000',
    unit: 'so\'m',
    icon: '💎',
    iconBg: 'rgba(48, 209, 88, 0.12)',
    trend: '8.1%',
  },
  {
    label: 'Aktiv qarzlar',
    value: '156,300,000',
    unit: 'so\'m',
    icon: '⚠️',
    iconBg: 'rgba(255, 69, 58, 0.12)',
    trend: '12 over',
  },
];
