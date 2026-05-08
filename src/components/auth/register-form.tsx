'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authClient } from '@/lib/auth-client';
import { Mail, Lock, Loader2, Eye, EyeOff, User, Store } from 'lucide-react';

const registerSchema = z
  .object({
    name: z.string().min(2, "Ism kamida 2 ta belgi bo'lishi kerak"),
    storeName: z.string().min(2, "Do'kon nomi kamida 2 ta belgi bo'lishi kerak"),
    email: z.string().email("Email manzili noto'g'ri"),
    phone: z.string().min(9, "Telefon raqami noto'g'ri").max(20),
    password: z
      .string()
      .min(8, 'Parol kamida 8 ta belgi')
      .regex(/[A-Z]/, "Kamida 1 ta katta harf bo'lsin")
      .regex(/[0-9]/, "Kamida 1 ta raqam bo'lsin"),
  });

type RegisterInput = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const router = useRouter();

  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  async function onSubmit(data: RegisterInput) {
    setServerError(null);
    setIsPending(true);

    const { error } = await authClient.signUp.email({
      email: data.email,
      password: data.password,
      name: data.name,
      phone: `+998${data.phone}`,
      storeName: data.storeName,
      callbackURL: '/dashboard',
    });

    if (error) {
      setServerError(
        error.message === 'User already exists'
          ? 'Bu email bilan hisob allaqachon mavjud'
          : error.message ?? 'Xatolik yuz berdi'
      );
      setIsPending(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Full Name */}
      <div>
        <label
          htmlFor="name"
          className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]"
        >
          To'liq ism
        </label>
        <div className="relative">
          <User
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]"
          />
          <input
            id="name"
            type="text"
            autoComplete="name"
            placeholder="Ali Valiyev"
            {...register('name')}
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] py-3 pl-10 pr-4 text-sm text-[var(--color-foreground)] placeholder-[var(--color-text-tertiary)] transition-all duration-180 ease-spring focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20"
          />
        </div>
        {errors.name && (
          <p className="mt-1.5 text-xs text-[var(--color-danger)]">
            {errors.name.message}
          </p>
        )}
      </div>

      {/* Store Name */}
      <div>
        <label
          htmlFor="storeName"
          className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]"
        >
          Do'kon nomi
        </label>
        <div className="relative">
          <Store
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]"
          />
          <input
            id="storeName"
            type="text"
            autoComplete="organization"
            placeholder="MobiCenter Toshkent"
            {...register('storeName')}
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] py-3 pl-10 pr-4 text-sm text-[var(--color-foreground)] placeholder-[var(--color-text-tertiary)] transition-all duration-180 ease-spring focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20"
          />
        </div>
        {errors.storeName && (
          <p className="mt-1.5 text-xs text-[var(--color-danger)]">
            {errors.storeName.message}
          </p>
        )}
      </div>

      {/* Email */}
      <div>
        <label
          htmlFor="reg-email"
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
            id="reg-email"
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

      {/* Phone */}
      <div>
        <label
          htmlFor="phone"
          className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]"
        >
          Telefon
        </label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] text-sm font-medium">
            +998
          </div>
          <input
            id="phone"
            type="tel"
            autoComplete="tel"
            placeholder="901234567"
            {...register('phone')}
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] py-3 pl-14 pr-4 text-sm text-[var(--color-foreground)] placeholder-[var(--color-text-tertiary)] transition-all duration-180 ease-spring focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20"
          />
        </div>
        {errors.phone && (
          <p className="mt-1.5 text-xs text-[var(--color-danger)]">
            {errors.phone.message}
          </p>
        )}
      </div>

      {/* Password */}
      <div>
        <label
          htmlFor="reg-password"
          className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]"
        >
          Parol
        </label>
        <div className="relative">
          <Lock
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]"
          />
          <input
            id="reg-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="••••••••"
            {...register('password')}
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] py-3 pl-10 pr-12 text-sm text-[var(--color-foreground)] placeholder-[var(--color-text-tertiary)] transition-all duration-180 ease-spring focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Parolni yashirish' : "Parolni ko'rsatish"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] transition-colors hover:text-[var(--color-text-secondary)] focus:outline-none"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
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
            Ro&apos;yxatdan o&apos;tilmoqda...
          </>
        ) : (
          '14 kun bepul boshlash →'
        )}
      </button>

      <p className="text-center text-xs text-[var(--color-text-tertiary)]">
        Ro&apos;yxatdan o&apos;tish orqali{' '}
        <a href="/terms" className="text-[var(--color-accent)] hover:underline">
          shartlar
        </a>{' '}
        va{' '}
        <a href="/privacy" className="text-[var(--color-accent)] hover:underline">
          maxfiylik siyosati
        </a>
        ga rozilik bildirasiz.
      </p>
    </form>
  );
}
