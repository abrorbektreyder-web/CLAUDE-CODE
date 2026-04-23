import type { Metadata, Viewport } from 'next';
import { Instrument_Serif, Manrope, JetBrains_Mono } from 'next/font/google';
import './globals.css';

// ════════════════════════════════════════════════════════════════════════════
// FONTS — Loaded at build time, self-hosted, no FOUT
// ────────────────────────────────────────────────────────────────────────────
// Each font sets a CSS variable on <html>, which globals.css picks up
// inside @theme to define --font-display, --font-sans, --font-mono.
// ════════════════════════════════════════════════════════════════════════════

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-instrument-serif',
  display: 'swap',
});

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-manrope',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

// ════════════════════════════════════════════════════════════════════════════
// METADATA
// ════════════════════════════════════════════════════════════════════════════

export const metadata: Metadata = {
  title: {
    default: 'Mobile POS — Telefon do\'koni uchun',
    template: '%s | Mobile POS',
  },
  description:
    'O\'zbekistondagi telefon va aksessuar do\'konlari uchun zamonaviy savdo tizimi',
  keywords: [
    'POS',
    'telefon do\'koni',
    'kassa tizimi',
    'savdo dasturi',
    'O\'zbekiston',
  ],
  authors: [{ name: 'Mobile POS' }],
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  ),
  openGraph: {
    type: 'website',
    locale: 'uz_UZ',
    siteName: 'Mobile POS',
  },
};

// Next.js 15 — themeColor metadata uchun alohida viewport export ishlatiladi
export const viewport: Viewport = {
  themeColor: '#08090A',
  colorScheme: 'dark',
};

// ════════════════════════════════════════════════════════════════════════════
// ROOT LAYOUT
// ════════════════════════════════════════════════════════════════════════════

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="uz"
      suppressHydrationWarning
      className={`${instrumentSerif.variable} ${manrope.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
