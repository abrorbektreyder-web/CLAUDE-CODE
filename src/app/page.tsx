import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute -right-48 -top-48 h-[600px] w-[600px] rounded-full opacity-30 blur-3xl"
        style={{
          background:
            'radial-gradient(circle, rgba(255, 107, 53, 0.4) 0%, transparent 60%)',
        }}
      />

      {/* Header */}
      <header className="relative z-10 border-b border-[var(--color-border)] backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-gradient-to-br from-[var(--color-accent)] to-orange-400 font-bold text-white shadow-[0_0_24px_rgba(255,107,53,0.25)]">
              M
            </div>
            <div className="leading-tight">
              <div className="font-display text-xl">Mobile</div>
              <div className="text-[9px] font-bold uppercase tracking-[0.15em] text-[var(--color-text-tertiary)]">
                Premium POS
              </div>
            </div>
          </div>

          <nav className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-[10px] border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-2 text-sm font-semibold text-[var(--color-text-secondary)] transition-all duration-180 ease-spring hover:border-[var(--color-border-strong)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-foreground)]"
            >
              Tizimga kirish
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 mx-auto max-w-5xl px-6 pt-24 pb-32 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-1.5 text-xs font-semibold text-[var(--color-text-secondary)]">
          <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-[var(--color-success)]" />
          Beta versiya • Ro&apos;yxatga olish ochiq
        </div>

        <h1 className="mx-auto max-w-3xl font-display text-6xl leading-[1.05] tracking-tight md:text-8xl">
          Telefon do&apos;koningiz uchun
          <br />
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage:
                'linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%)',
            }}
          >
            zamonaviy savdo tizimi
          </span>
        </h1>

        <p className="mx-auto mt-8 max-w-xl text-lg leading-relaxed text-[var(--color-text-secondary)]">
          IMEI bo&apos;yicha kuzatuv, nasiya boshqaruvi, real-time hisobot va
          Telegram bot integratsiyasi — barchasi bitta joyda.
        </p>

        <div className="mt-10 flex items-center justify-center gap-3">
          <Link
            href="/register"
            className="group relative rounded-xl bg-[var(--color-accent)] px-7 py-3.5 text-sm font-semibold text-white shadow-[0_0_24px_rgba(255,107,53,0.3)] transition-all duration-180 ease-spring hover:bg-[var(--color-accent-hover)] hover:shadow-[0_0_32px_rgba(255,107,53,0.5)]"
          >
            14 kun bepul boshlash
          </Link>
          <Link
            href="#features"
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] px-7 py-3.5 text-sm font-semibold text-[var(--color-foreground)] transition-all duration-180 ease-spring hover:border-[var(--color-border-strong)] hover:bg-[var(--color-bg-hover)]"
          >
            Imkoniyatlar
          </Link>
        </div>

        <p className="mt-6 text-xs text-[var(--color-text-tertiary)]">
          Karta kiritish shart emas • Istalgan vaqtda bekor qilish
        </p>
      </main>

      {/* Features grid */}
      <section
        id="features"
        className="relative z-10 mx-auto max-w-7xl px-6 pb-32"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="premium-card relative overflow-hidden rounded-2xl p-6 transition-all duration-280 ease-spring hover:-translate-y-1 hover:border-[var(--color-border-strong)]"
            >
              <div
                className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-2xl"
                style={{ backgroundColor: feature.iconBg }}
              >
                {feature.icon}
              </div>
              <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

const features = [
  {
    icon: '📱',
    iconBg: 'rgba(100, 210, 255, 0.12)',
    title: 'IMEI bo\'yicha kuzatuv',
    desc: 'Har bir telefon alohida — kafolat, mijoz, holat. AES-256 shifrlangan.',
  },
  {
    icon: '💎',
    iconBg: 'rgba(48, 209, 88, 0.12)',
    title: 'Nasiya tizimi',
    desc: 'Avtomatik to\'lov grafigi, kechikkan qarzlar uchun Telegram eslatma.',
  },
  {
    icon: '📊',
    iconBg: 'rgba(255, 107, 53, 0.12)',
    title: 'Real-time hisobot',
    desc: 'Sotuv, foyda, top mahsulotlar — bir qarashda butun biznes ko\'rinadi.',
  },
  {
    icon: '🤖',
    iconBg: 'rgba(191, 90, 242, 0.12)',
    title: 'Telegram bot',
    desc: 'Har sotuv haqida xabar, kunlik hisobot, mijozlar uchun avtomatik bildirishnoma.',
  },
  {
    icon: '🔒',
    iconBg: 'rgba(255, 69, 58, 0.12)',
    title: 'Multi-tenant + RLS',
    desc: 'Sizning ma\'lumotlaringiz boshqa do\'konlardan to\'liq ajratilgan.',
  },
  {
    icon: '🖨️',
    iconBg: 'rgba(255, 214, 10, 0.12)',
    title: 'Termo printer',
    desc: 'Xprinter, Rongta va boshqa USB termo printerlarga avtomatik chop etish.',
  },
];
