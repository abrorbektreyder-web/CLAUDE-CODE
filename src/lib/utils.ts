import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combine Tailwind classes with conflict resolution
 *
 * @example
 * cn('px-4 py-2', condition && 'bg-red-500', 'px-6')
 * // → 'py-2 bg-red-500 px-6'  (px-4 was overridden)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format Uzbek sum with thousand separators
 *
 * @example
 * formatSum(12500000)         // → '12 500 000 so\'m'
 * formatSum(12500000, false)  // → '12 500 000'
 */
export function formatSum(
  amount: number | string,
  withCurrency = true
): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0';

  const formatted = num
    .toLocaleString('ru-RU', { maximumFractionDigits: 0 })
    .replace(/,/g, ' ');

  return withCurrency ? `${formatted} so'm` : formatted;
}

/**
 * Format large numbers with K/M/B suffix
 *
 * @example
 * formatCompact(1234567)  // → '1.2M'
 * formatCompact(15000)    // → '15K'
 */
export function formatCompact(amount: number): string {
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(1)}K`;
  return amount.toString();
}

/**
 * Format date in Uzbek locale
 *
 * @example
 * formatDate(new Date())  // → '23 Apr 2026'
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('uz-UZ', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format relative time (Uzbek)
 *
 * @example
 * formatRelativeTime(new Date(Date.now() - 60_000))  // → '1 daqiqa oldin'
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);

  if (seconds < 60) return 'Hozir';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} daq.`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} soat oldin`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} kun oldin`;
  return formatDate(d);
}

/**
 * Sleep helper
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate a short readable ID (for receipt numbers, etc.)
 */
export function shortId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

/**
 * Debounce function calls
 */
export function debounce<T extends (...args: never[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}
