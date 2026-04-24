'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authClient } from '@/lib/auth-client';
import { Mail, Lock, Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const loginSchema = z.object({
  email: z.string().email('Email manzili noto\'g\'ri'),
  password: z.string().min(8, 'Kamida 8 ta belgi'),
});

type LoginInput = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callback = searchParams.get('callback') || '/dashboard';

  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginInput) {
    setServerError(null);
    setIsPending(true);

    const { error } = await authClient.signIn.email({
      email: data.email,
      password: data.password,
      callbackURL: callback,
    });

    if (error) {
      setServerError(error.message ?? 'Xatolik yuz berdi');
      setIsPending(false);
      return;
    }

    router.push(callback);
    router.refresh();
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Email */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <label
            htmlFor="email"
            className="mb-2 block text-xs font-bold uppercase tracking-widest text-[var(--color-text-tertiary)]"
          >
            Email
          </label>
          <div className="relative group">
            <Mail
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] group-focus-within:text-[var(--color-accent)] transition-colors duration-200"
            />
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="admin@mobicenter.uz"
              {...register('email')}
              className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)]/50 backdrop-blur-md py-3.5 pl-12 pr-4 text-sm text-[var(--color-foreground)] placeholder-[var(--color-text-tertiary)] transition-all duration-200 focus:border-[var(--color-accent)] focus:outline-none focus:ring-4 focus:ring-[var(--color-accent)]/10"
            />
          </div>
          {errors.email && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-2 text-xs font-medium text-[var(--color-danger)]"
            >
              {errors.email.message}
            </motion.p>
          )}
        </motion.div>

        {/* Password */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="mb-2 flex items-center justify-between">
            <label
              htmlFor="password"
              className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-tertiary)]"
            >
              Parol
            </label>
            <a
              href="/forgot-password"
              className="text-xs font-medium text-[var(--color-accent)] hover:underline underline-offset-4"
            >
              Unutdingizmi?
            </a>
          </div>
          <div className="relative group">
            <Lock
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] group-focus-within:text-[var(--color-accent)] transition-colors duration-200"
            />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              {...register('password')}
              className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)]/50 backdrop-blur-md py-3.5 pl-12 pr-12 text-sm text-[var(--color-foreground)] placeholder-[var(--color-text-tertiary)] transition-all duration-200 focus:border-[var(--color-accent)] focus:outline-none focus:ring-4 focus:ring-[var(--color-accent)]/10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Parolni yashirish' : 'Parolni ko\'rsatish'}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] transition-colors hover:text-[var(--color-accent)] focus:outline-none"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-2 text-xs font-medium text-[var(--color-danger)]"
            >
              {errors.password.message}
            </motion.p>
          )}
        </motion.div>

        {/* Server error */}
        <AnimatePresence>
          {serverError && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex items-start gap-3 rounded-2xl border border-[var(--color-danger)]/20 bg-[var(--color-danger)]/5 p-4 text-sm text-[var(--color-danger)]"
            >
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Xatolik yuz berdi</p>
                <p className="opacity-90">{serverError}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <button
            type="submit"
            disabled={isPending}
            className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-[var(--color-accent)] py-4 text-sm font-bold text-white shadow-xl shadow-[var(--color-accent)]/20 transition-all duration-300 hover:scale-[1.02] hover:bg-[var(--color-accent-hover)] hover:shadow-2xl hover:shadow-[var(--color-accent)]/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
          >
            {isPending ? (
              <div className="flex items-center gap-3">
                <Loader2 size={18} className="animate-spin" />
                <span>Tekshirilmoqda...</span>
              </div>
            ) : (
              'Tizimga kirish'
            )}
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
          </button>
        </motion.div>
      </form>
    </div>
  );
}
