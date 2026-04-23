'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authClient } from '@/lib/auth-client';
import { Mail, Lock, Loader2 } from 'lucide-react';

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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Email */}
      <div>
        <label
          htmlFor="email"
          className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]"
        >
          Email
        </label>
        <div className="relative">
          <Mail
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]"
          />
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="admin@mobicenter.uz"
            {...register('email')}
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] py-3 pl-10 pr-4 text-sm text-[var(--color-foreground)] placeholder-[var(--color-text-tertiary)] transition-all duration-180 ease-spring focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20"
          />
        </div>
        {errors.email && (
          <p className="mt-1.5 text-xs text-[var(--color-danger)]">
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Password */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label
            htmlFor="password"
            className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]"
          >
            Parol
          </label>
          <a
            href="/forgot-password"
            className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-accent)]"
          >
            Unutdingizmi?
          </a>
        </div>
        <div className="relative">
          <Lock
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]"
          />
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            {...register('password')}
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] py-3 pl-10 pr-4 text-sm text-[var(--color-foreground)] placeholder-[var(--color-text-tertiary)] transition-all duration-180 ease-spring focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20"
          />
        </div>
        {errors.password && (
          <p className="mt-1.5 text-xs text-[var(--color-danger)]">
            {errors.password.message}
          </p>
        )}
      </div>

      {/* Server error */}
      {serverError && (
        <div className="rounded-xl border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 px-4 py-3 text-sm text-[var(--color-danger)]">
          {serverError}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending}
        className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)] py-3.5 text-sm font-semibold text-white shadow-[0_0_24px_rgba(255,107,53,0.25)] transition-all duration-180 ease-spring hover:bg-[var(--color-accent-hover)] hover:shadow-[0_0_32px_rgba(255,107,53,0.45)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Kirilmoqda...
          </>
        ) : (
          'Kirish'
        )}
      </button>
    </form>
  );
}
