import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/login-form';
import Link from 'next/link';

export const metadata = {
  title: 'Tizimga kirish',
};

export default function LoginPage() {
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
        <div className="mb-8 text-center">
          <h1 className="font-display text-4xl">Xush kelibsiz</h1>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            Hisobingizga kirish uchun ma&apos;lumotlarni kiriting
          </p>
        </div>

        <Suspense fallback={<div className="h-40 flex items-center justify-center">Yuklanmoqda...</div>}>
          <LoginForm />
        </Suspense>

        <div className="mt-6 border-t border-[var(--color-border)] pt-6 text-center text-sm">
          <span className="text-[var(--color-text-tertiary)]">
            Hisob yo&apos;qmi?{' '}
          </span>
          <Link
            href="/register"
            className="font-semibold text-[var(--color-accent)] transition-colors hover:text-[var(--color-accent-hover)]"
          >
            Ro&apos;yxatdan o&apos;tish
          </Link>
        </div>
      </div>

      {/* Cashier link */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
        <p className="text-xs text-[var(--color-text-tertiary)]">
          Kassirsizmi?{' '}
          <Link
            href="/cashier-login"
            className="text-[var(--color-info)] hover:underline"
          >
            Telefon + PIN bilan kirish
          </Link>
        </p>
      </div>
    </div>
  );
}
