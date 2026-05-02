'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Loader2, ArrowLeft, AlertCircle, Eye, EyeOff, ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { authClient } from '@/lib/auth-client';

const cashierLoginSchema = z.object({
  email: z.string().email('To\'g\'ri email manzil kiriting'),
  password: z.string().min(6, 'Parol kamida 6 ta belgi bo\'lishi kerak'),
});

type CashierLoginInput = z.infer<typeof cashierLoginSchema>;

export default function CashierLoginPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CashierLoginInput>({
    resolver: zodResolver(cashierLoginSchema),
  });

  async function onSubmit(data: CashierLoginInput) {
    setServerError(null);
    setIsPending(true);

    try {
      console.log('Attempting sign-in with:', data.email);
      const { data: resData, error } = await authClient.signIn.email({
        email: data.email,
        password: data.password,
        callbackURL: '/staff/pos',
      });

      if (error) {
        console.error('Sign-in error:', error);
        setServerError(error.message || 'Email yoki parol noto\'g\'ri');
        setIsPending(false);
        return;
      }

      console.log('Sign-in success:', resData);
      // Success
      router.push('/staff/pos');
      router.refresh();
    } catch (error: any) {
      console.error('Sign-in exception:', error);
      setServerError(`Xatolik: ${error.message || 'Server bilan aloqa uzildi'}`);
      setIsPending(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 rounded-full opacity-10 blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(10, 132, 255, 0.4) 0%, transparent 60%)',
        }}
      />

      <div className="premium-card relative z-10 w-full max-w-md rounded-2xl p-8 shadow-2xl">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-xs font-medium text-[var(--color-text-tertiary)] hover:text-[var(--color-foreground)] transition-colors mb-8"
        >
          <ArrowLeft size={14} />
          Asosiy login sahifasiga qaytish
        </Link>

        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-info)]/10 text-[var(--color-info)] border border-[var(--color-info)]/20">
            <ShoppingCart size={28} />
          </div>
          <h1 className="font-display text-3xl">Kassa Terminali</h1>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            Email va parol orqali kassir paneliga kiring
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Email */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
              Email manzil
            </label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] group-focus-within:text-[var(--color-info)] transition-colors duration-300">
                <Mail size={18} />
              </div>
              <input
                type="email"
                placeholder="kassir@dokon.uz"
                autoComplete="email"
                {...register('email')}
                className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)]/30 backdrop-blur-sm py-4 pl-12 pr-4 text-sm font-medium transition-all duration-300 focus:border-[var(--color-info)]/50 focus:bg-[var(--color-bg-elevated)]/60 focus:outline-none focus:ring-4 focus:ring-[var(--color-info)]/5"
              />
            </div>
            {errors.email && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 text-xs font-medium text-[var(--color-danger)] flex items-center gap-1">
                <AlertCircle size={12} /> {errors.email.message}
              </motion.p>
            )}
          </motion.div>

          {/* Password */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
              Parol
            </label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] group-focus-within:text-[var(--color-info)] transition-colors duration-300">
                <Lock size={18} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="current-password"
                {...register('password')}
                className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)]/30 backdrop-blur-sm py-4 pl-12 pr-12 text-sm font-medium transition-all duration-300 focus:border-[var(--color-info)]/50 focus:bg-[var(--color-bg-elevated)]/60 focus:outline-none focus:ring-4 focus:ring-[var(--color-info)]/5"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] hover:text-[var(--color-foreground)] transition-colors focus:outline-none p-1"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 text-xs font-medium text-[var(--color-danger)] flex items-center gap-1">
                <AlertCircle size={12} /> {errors.password.message}
              </motion.p>
            )}
          </motion.div>

          <AnimatePresence>
            {serverError && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-start gap-3 rounded-2xl border border-[var(--color-danger)]/20 bg-[var(--color-danger)]/5 p-4 text-sm text-[var(--color-danger)]"
              >
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <p>{serverError}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            type="submit"
            disabled={isPending}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--color-info)] py-4 text-sm font-bold text-white shadow-xl shadow-[var(--color-info)]/25 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isPending ? <Loader2 size={18} className="animate-spin" /> : <ShoppingCart size={18} />}
            {isPending ? 'Kirilmoqda...' : 'Kassaga kirish'}
          </motion.button>
        </form>

        <p className="mt-8 text-center text-xs text-[var(--color-text-tertiary)]">
          Login va parolni do'kon adminidan oling.
        </p>
      </div>
    </div>
  );
}
