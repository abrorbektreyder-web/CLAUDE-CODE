import Link from 'next/link';
import { ScanBarcode, ShoppingCart } from 'lucide-react';

export const metadata = {
  title: 'Kassir POS',
};

export default function CashierPOSPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="premium-card max-w-2xl rounded-2xl p-12 text-center">
        <div className="mb-6 flex justify-center">
          <div
            className="flex h-20 w-20 items-center justify-center rounded-2xl"
            style={{ backgroundColor: 'rgba(255, 107, 53, 0.12)' }}
          >
            <ShoppingCart size={36} className="text-[var(--color-accent)]" />
          </div>
        </div>

        <h1 className="font-display text-5xl">Kassir POS</h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-[var(--color-text-secondary)]">
          Bu sahifa Premium Dark mockup&apos;dagi (variant 2) interfeysni
          bu yerga ko&apos;chirib, real ishlovchi React komponentga aylantirish
          uchun.
        </p>

        <div className="mt-8 grid grid-cols-2 gap-3 text-left">
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-4">
            <ScanBarcode size={20} className="mb-2 text-[var(--color-info)]" />
            <div className="text-sm font-semibold">Barcode skaner</div>
            <div className="mt-1 text-xs text-[var(--color-text-tertiary)]">
              IMEI orqali telefon topish
            </div>
          </div>
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-4">
            <ShoppingCart size={20} className="mb-2 text-[var(--color-success)]" />
            <div className="text-sm font-semibold">Savat</div>
            <div className="mt-1 text-xs text-[var(--color-text-tertiary)]">
              Mahsulotlar + chegirma + to&apos;lov
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-[var(--color-border)] pt-6">
          <p className="text-xs text-[var(--color-text-tertiary)]">
            Tayyor mockup uchun:{' '}
            <code className="rounded bg-[var(--color-bg-elevated)] px-1.5 py-0.5 font-mono text-xs text-[var(--color-accent)]">
              variant-2-premium-dark.html
            </code>
          </p>
          <Link
            href="/dashboard"
            className="mt-4 inline-block text-sm font-semibold text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]"
          >
            ← Dashboardga qaytish
          </Link>
        </div>
      </div>
    </div>
  );
}
