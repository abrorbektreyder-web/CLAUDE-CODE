# 📱 Mobile POS — Loyiha Skeleton

Production-ready **Next.js 15** boilerplate, **Mobile Retail POS SaaS** uchun.

**Stack:** Next.js 15 • React 19 • TypeScript 5 • Drizzle ORM • Better Auth • Tailwind v4 • Premium Dark dizayn

---

## 🚀 Quick Start (10 daqiqada ishga tushirish)

### 1. Database setup (Supabase — tavsiya)

```bash
# 1. Yangi loyiha: https://supabase.com
# 2. SQL Editor'da ketma-ket ishga tushiring:
#    - 01-schema.sql      (jadvallar, indekslar, ENUM)
#    - 02-security.sql    (RLS, audit triggerlar)
#    - 03-seed.sql        (ixtiyoriy — test ma'lumot)
# 3. Connection string: Settings → Database → Connection Pooler (port 6543)
```

### 2. O'rnatish va sozlash

```bash
cd skeleton
pnpm install            # yoki npm install / yarn

cp .env.example .env.local

# .env.local ichida sozlang:
#   DATABASE_URL          → Supabase pooler URL
#   ENCRYPTION_KEY        → openssl rand -base64 32
#   BETTER_AUTH_SECRET    → openssl rand -hex 32
#   TELEGRAM_BOT_TOKEN    → @BotFather'dan olingan token
```

### 3. Ishga tushirish

```bash
pnpm dev
# → http://localhost:3000

# Yoki tenant subdomain bilan test qilish:
# → http://mobicenter.localhost:3000
```

---

## 📁 Loyiha tuzilmasi

```
skeleton/
├── src/
│   ├── app/                          ← Next.js App Router
│   │   ├── layout.tsx                ← Root layout (fonts, theme)
│   │   ├── globals.css               ← Premium Dark theme tokens
│   │   ├── page.tsx                  ← Landing page (marketing)
│   │   │
│   │   ├── (auth)/
│   │   │   └── login/page.tsx        ← Login page (Premium Dark form)
│   │   │
│   │   ├── (dashboard)/              ← Admin protected layout
│   │   │   ├── layout.tsx            ← Sidebar + Topbar shell
│   │   │   ├── page.tsx              ← Dashboard home (KPI cards)
│   │   │   ├── sales/                ← (placeholder)
│   │   │   └── inventory/            ← (placeholder)
│   │   │
│   │   ├── (cashier)/
│   │   │   └── pos/page.tsx          ← Kassir POS placeholder
│   │   │
│   │   └── api/
│   │       ├── auth/[...all]/        ← Better Auth handler
│   │       ├── health/               ← Health check
│   │       └── sales/                ← Sample API (createSale)
│   │
│   ├── components/
│   │   ├── auth/login-form.tsx       ← React Hook Form + Zod
│   │   ├── dashboard/sidebar.tsx     ← Mockup'dagi sidebar
│   │   ├── dashboard/topbar.tsx      ← Live indicator + actions
│   │   ├── cashier/                  ← (qo'shing)
│   │   └── ui/                       ← shadcn/ui (qo'shing)
│   │
│   ├── lib/
│   │   ├── utils.ts                  ← cn(), formatSum(), formatDate()
│   │   ├── tenant.ts                 ← Subdomain → tenant resolution
│   │   ├── auth.ts                   ← Better Auth config + Drizzle
│   │   ├── auth-client.ts            ← Client-side SDK
│   │   └── api-helpers.ts            ← createApiRoute() wrapper
│   │
│   ├── db/                           ← Drizzle ORM (oldindan tayyor)
│   │   ├── schema/                   ← 23 jadval, 14 enum
│   │   ├── lib/                      ← db connection, encryption
│   │   ├── queries.ts                ← 9 ta production query
│   │   └── migrations/               ← Drizzle Kit chiqishi
│   │
│   └── middleware.ts                 ← Tenant + auth gate
│
├── public/
├── package.json                      ← Barcha dependencies
├── next.config.ts                    ← Subdomain + security headers
├── tsconfig.json                     ← Path aliases (@/...)
├── tailwind.config (via globals.css) ← Tailwind v4 @theme
├── drizzle.config.ts                 ← Drizzle Kit config
├── components.json                   ← shadcn/ui config
└── .env.example
```

---

## 🎨 Dizayn tizimi (Premium Dark)

Barcha CSS tokenlar `src/app/globals.css` ichida `@theme` ostida:

```css
--color-background: #08090A
--color-foreground: #FAFAFA
--color-accent: #FF6B35       (brand orange)
--color-success: #30D158
--color-danger: #FF453A
--font-display: 'Instrument Serif' italic
--font-sans: 'Manrope'
--font-mono: 'JetBrains Mono'
```

Tailwind v4 sintaksisi:
```tsx
<div className="bg-background text-foreground border-border">
  <h1 className="font-display text-4xl">Sarlavha</h1>
  <p className="font-mono-tabular">12 500 000</p>
</div>
```

---

## 🔐 Auth tizimi

**Better Auth** + **Drizzle adapter** + **Argon2id**.

### Admin login (email + password)
```typescript
import { authClient } from '@/lib/auth-client';

const { data, error } = await authClient.signIn.email({
  email: 'admin@mobicenter.uz',
  password: '...',
  callbackURL: '/dashboard',
});
```

### Server Component'larda session olish
```typescript
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

const session = await auth.api.getSession({ headers: await headers() });
if (!session) redirect('/login');
```

### Kassir login (telefon + PIN)
**Custom flow** — `users.pin_hash` (bcrypt) bo'yicha tekshirish.
Loyihaga maxsus endpoint qo'shing: `app/api/cashier-auth/route.ts`.

---

## 🌐 Multi-tenant arxitektura

### Subdomain routing
- **Dev:** `mobicenter.localhost:3000`
- **Prod:** `mobicenter.poshub.uz`

### Har request:
1. **Middleware** subdomain'ni o'qiydi → header'ga qo'yadi
2. **Server Component** `getCurrentTenant()` chaqiradi (cached)
3. **API route** `createApiRoute()` ichida `withTenant()` ishlatadi
4. **PostgreSQL RLS** avtomatik filtrlaydi ma'lumotlarni

### API misol:
```typescript
// app/api/sales/route.ts
export const POST = createApiRoute({
  schema: createSaleSchema,           // Zod validation
  roles: ['cashier', 'admin'],         // RBAC
  handler: async ({ body, ctx }) => {
    // ctx.tenantId, ctx.userId, ctx.userRole — avtomatik
    // RLS aktiv — boshqa tenant'larni ko'rmaydi
    const sale = await createSale(body);
    return { sale };
  },
});
```

---

## 📦 Dependencies — nima va nega

| Paket | Versiya | Nega |
|---|---|---|
| `next` | 15.0.3 | App Router, Server Components, Turbopack |
| `react` | 19.0.0 | Latest stable |
| `drizzle-orm` | ^0.36 | Type-safe SQL, migrations |
| `postgres` | ^3.4 | PostgreSQL driver |
| `better-auth` | ^1.0.13 | Modern auth (NextAuth o'rniga) |
| `zod` | ^3.23 | Runtime validation |
| `react-hook-form` | ^7.53 | Forma boshqaruvi |
| `@tanstack/react-query` | ^5 | Server state caching |
| `zustand` | ^5 | Client state (yengil) |
| `tailwindcss` | ^4.0-beta | CSS framework (v4 @theme) |
| `framer-motion` | ^11 | Animatsiyalar |
| `lucide-react` | ^0.460 | Iconlar |
| `argon2` | ^0.41 | Admin parol hash |
| `bcrypt` | ^5.1 | Kassir PIN hash (cost 12) |

---

## 🔧 Common workflows

### Yangi sahifa qo'shish
```bash
# Admin sahifa:
mkdir -p src/app/\(dashboard\)/customers
touch src/app/\(dashboard\)/customers/page.tsx

# Faqat admin uchun — sidebar'ga link qo'shing:
# src/components/dashboard/sidebar.tsx → navigation array
```

### Yangi API endpoint
```typescript
// src/app/api/customers/route.ts
import { z } from 'zod';
import { createApiRoute } from '@/lib/api-helpers';

export const POST = createApiRoute({
  schema: z.object({ fullName: z.string(), phone: z.string() }),
  roles: ['admin', 'cashier'],
  handler: async ({ body }) => {
    // body — type-safe, validated
    // RLS aktiv
    return { ok: true };
  },
});
```

### Schema o'zgartirish
```bash
# 1. src/db/schema/*.ts ni tahrirlang
# 2. Migration yarating:
pnpm db:generate
# 3. Apply qiling:
pnpm db:push      # dev
pnpm db:migrate   # prod
```

### Drizzle Studio (visual DB)
```bash
pnpm db:studio    # → https://local.drizzle.studio
```

---

## ⚡ Production checklist

- [ ] `BETTER_AUTH_SECRET` — strong random (`openssl rand -hex 32`)
- [ ] `ENCRYPTION_KEY` — 32 char (`openssl rand -base64 32`), Supabase Vault'da saqlang
- [ ] `DATABASE_URL` — Supabase **Pooler** (port 6543), nicht Direct
- [ ] DNS — wildcard `*.poshub.uz` → Vercel
- [ ] SSL — Vercel auto + certificate har subdomain uchun
- [ ] Rate limiting — Upstash Redis
- [ ] Backups — Supabase auto + manual snapshots
- [ ] Sentry yoki LogTail — error tracking
- [ ] Cloudflare — DDoS protection, asset CDN

---

## 🐛 Troubleshooting

**"Module not found: @/db/lib/db"**
→ `tsconfig.json` ichida path aliases tekshiring (`@/*` → `./src/*`)

**"Cannot read property 'getSession' of undefined"**
→ `BETTER_AUTH_SECRET` env yo'q yoki noto'g'ri

**"permission denied for table sales" (RLS xatosi)**
→ `withTenant()` ichida emas. Avval `createApiRoute()` ishlating.

**Tailwind utilities ishlamayapti**
→ `globals.css` import qilinganmi `app/layout.tsx` da?

**Subdomain dev'da ishlamayapti**
→ `/etc/hosts` ga qo'shing: `127.0.0.1 mobicenter.localhost`

---

## 📚 Keyingi qadamlar

Hozir sizda:
- ✅ Auth tizimi
- ✅ Multi-tenant arxitektura
- ✅ Database schema (23 jadval, 31 RLS policy)
- ✅ Type-safe ORM (Drizzle)
- ✅ API helper pattern
- ✅ Premium Dark UI shell (sidebar, topbar, login)

Qo'shish kerak (Claude Code bilan oson):
- 🔲 Kashier POS to'liq komponent (mockup'dan port qiling)
- 🔲 Admin Dashboard real ma'lumot bilan
- 🔲 Customer / Inventory CRUD sahifalari
- 🔲 Telegram bot (`grammY` + `app/api/webhooks/telegram`)
- 🔲 Termo printer integration (`node-thermal-printer`)
- 🔲 Reports + chartlar (Recharts)
- 🔲 PDF chek generation
- 🔲 Excel export (XLSX)

---

## 📂 Bog'liq fayllar

Loyiha alohida deliverable'lar bilan birga keladi:

| Fayl | Tarkibi |
|---|---|
| `pos-database-v1.0.zip` | SQL schema + RLS + seed |
| `pos-drizzle-v1.0.zip` | Standalone Drizzle modul |
| `Loyiha-Ustavi-v1.0.docx` | 40 sahifalik loyiha rejasi |
| `variant-2-premium-dark.html` | Kassir POS mockup |
| `admin-dashboard-mockup.html` | Admin dashboard mockup |

---

**Loyiha © 2026** — Built with care for premium retail experience 🇺🇿
