import { RegisterForm } from '@/components/auth/register-form';
import Link from 'next/link';

export const metadata = {
  title: "Ro'yxatdan o'tish — 14 kun bepul",
  description:
    "Mobile POS tizimiga ro'yxatdan o'ting. 14 kun bepul, karta talab etilmaydi.",
};

export default function RegisterPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 rounded-full opacity-20 blur-3xl"
        style={{
          background:
            'radial-gradient(circle, rgba(255, 107, 53, 0.5) 0%, transparent 60%)',
        }}
      />

      {/* Logo at top */}
      <Link
        href="/"
        className="absolute left-1/2 top-8 flex -translate-x-1/2 items-center gap-3"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-gradient-to-br from-[var(--color-accent)] to-orange-400 font-bold text-white shadow-[0_0_20px_rgba(255,107,53,0.3)]">
          M
        </div>
        <div className="font-display text-xl">Mobile POS</div>
      </Link>

      {/* Card */}
      <div className="premium-card relative z-10 w-full max-w-md rounded-2xl p-8 shadow-2xl">
        {/* Badge */}
        <div className="mb-6 flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-4 py-1.5 text-xs font-semibold text-[var(--color-text-secondary)]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-success)]" />
            14 kun bepul • Karta talab etilmaydi
          </span>
        </div>

        <div className="mb-8 text-center">
          <h1 className="font-display text-4xl">Boshlaylik!</h1>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            Do&apos;koningizni 2 daqiqada sozlang
          </p>
        </div>

        <RegisterForm />

        <div className="mt-6 border-t border-[var(--color-border)] pt-6 text-center text-sm">
          <span className="text-[var(--color-text-tertiary)]">
            Allaqachon hisobingiz bormi?{' '}
          </span>
          <Link
            href="/login"
            className="font-semibold text-[var(--color-accent)] transition-colors hover:text-[var(--color-accent-hover)]"
          >
            Kirish
          </Link>
        </div>
      </div>
    </div>
  );
}
