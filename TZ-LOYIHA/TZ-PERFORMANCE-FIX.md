# Mobile POS — Performance Audit (Tasdiqlangan Topilmalar)

**Manba:** Loyiha kodi to'g'ridan-to'g'ri o'qildi (`_git.zip`), build log tahlil qilindi, Chrome DevTools Network tab natijalari ko'rib chiqildi.

---

## ⚠️ AGENT UCHUN ISH TARTIBI (har safar shu faylni ochganda o'qing)

1. Pastdagi jadvalda `[ ]` (bajarilmagan) belgili **birinchi** bandni toping.
2. O'sha bandni bajaring — avval tekshiring, keyin tuzating (har band ichidagi qoidaga amal qiling).
3. Bajarilgach, shu faylda o'sha bandning `[ ]` belgisini `[x]` ga o'zgartiring va qisqa izoh yozing (masalan: "✅ 2026-06-20 bajarildi — sidebar.tsx va staff-sidebar.tsx ga prefetch={false} qo'shildi").
4. Bittadan band bilan ishlang — bir vaqtning o'zida bir nechta bandni aralashtirmang.
5. Agar context yo'qolgan/suhbat qaytadan boshlangan bo'lsa — birinchi navbatda shu faylni qaytadan o'qing, keyingi bajarilmagan banddan davom eting.

### Progress jadvali

- [x] 1-band — Sidebar prefetch (✅ 2026-06-20 bajarildi — sidebar.tsx va staff-sidebar.tsx ga prefetch={false} qo'shildi)
- [x] 2-band — Dublikat session tekshiruv (✅ 2026-06-20 bajarildi — getCachedSession orqali keshlandi)
- [x] 3-band — Better Auth HTTP adapter (✅ 2026-06-20 bajarildi — Drizzle adapter yozildi)
- [x] 4-band — cookieCache ta'siri (✅ 2026-06-20 bajarildi — 2-band hal qilingani uchun avtomatik hal bo'ldi)
- [x] 5-band — recordDebtPayment loop (✅ 2026-06-20 bajarildi — loop ichidagi updatelar bitta upsert chaqiruviga almashtirildi)
- [x] 6-band — createSale Telegram blocking (✅ 2026-06-20 bajarildi — fire-and-forget qilindi, cashier+branch parallel olindi)
- [x] 7-band — searchProducts client-side (✅ 2026-06-20 bajarildi — server so'rovi olib tashlandi, inventoryData.filter() bilan almashtirildi)
- [x] 8-band — totalQuantity bug (✅ 2026-06-20 bajarildi — phone_units va stock_levels dan haqiqiy miqdor olinmoqda)
- [x] 9-band — Ortiqcha hash kutubxonalar (✅ 2026-06-20 bajarildi — bcrypt o'chirildi, argon2+@types/bcryptjs devDependencies ga ko'chirildi, 47 paket removed)
- [x] 10-band — Drizzle (informatsion band — kod o'zgartirilmadi, eslatma sifatida belgilandi)
- [x] 11-band — memo/virtualization (TZ bo'yicha hozircha kerak emas — keyinga qoldirildi)
- [x] 12-band — `<img>` → `next/image` (✅ 2026-06-20 bajarildi — admin-sales-interface.tsx, inventory-list.tsx, pos-interface.tsx da `<img>` → `<Image fill>` ga almashtirildi, `relative` wrapper qo'shildi, `sizes="96px"` bilan WebP va lazy loading yoqildi)

---

**Muhim qoida — har bir tuzatishdan oldin:**
> Quyidagi har bir band uchun agent avval **kodni qayta tekshirishi**, o'zgarish kiritmoqchi bo'lgan joyni **aniq topishi** va o'zgarish nima sababga olib kelishini **tushuntirishi** kerak. Faqat shundan keyin, **ishonch hosil qilgach**, o'zgarishni amalga oshirsin. Tekshirmasdan, taxmin asosida kod o'zgartirish — taqiqlanadi.

Har bir band uchun ishonch darajasi ko'rsatilgan:
- 🟢 **TASDIQLANGAN** — kodda yoki real o'lchovda bevosita ko'rilgan, dalil bilan
- 🟡 **EHTIMOLIY** — kod asosida mantiqiy xulosa, lekin real o'lchov bilan tasdiqlanmagan

---

## 1-band — Sidebar prefetch barcha sahifalarni oldindan yuklaydi
**Holat:** 🟢 TASDIQLANGAN (Network tab: 34 so'rov, 5.3s)

**Fayl:** `src/components/dashboard/sidebar.tsx`, `src/components/dashboard/staff-sidebar.tsx`

**Dalil:** Har ikkala sidebar faylida ham `<Link href={item.href}>` ishlatilgan, `prefetch={false}` hech qayerda yo'q. Dashboard ochilganda Network tab da 34 ta fetch so'rovi (`finance`, `reports`, `credit`, `suppliers`, `customers`, `inventory`, `sales` — har biri 2 marta) ko'rindi, jami 5.3 soniya.

**Tavsiya:** Sidebar dagi har bir navigatsiya linkiga `prefetch={false}` qo'shish.

**Tekshirish:** O'zgarishdan keyin Network tab da Dashboard qayta ochilsin — so'rovlar soni 34 dan 1-3 ga tushishi kerak.

---

## 2-band — Har sahifada auth sessiya 2 marta tekshiriladi
**Holat:** 🟢 TASDIQLANGAN

**Fayllar:**
- `src/app/(dashboard)/layout.tsx` — session tekshiradi (1-marta)
- `src/app/(dashboard)/inventory/page.tsx`, `customers/page.tsx`, `sales/page.tsx`, `credit/page.tsx`, `branches/page.tsx`, `dashboard/page.tsx` — **qaytadan** `auth.api.getSession()` chaqiradi

**Dalil:** `grep` natijasi — 6 ta sahifa layout allaqachon tekshirgan sessiyani yana bir marta o'zicha tekshiradi. Xuddi shu holat `staff/layout.tsx` va `staff/pos/page.tsx` orasida ham bor.

**Tavsiya:** Layout dan `session.user` ni `children` ga prop yoki React Context orqali uzatish, sahifalarda qayta `getSession()` chaqirmaslik.

**Tekshirish:** O'zgarishdan keyin har sahifada faqat 1 marta `getSession` chaqirilayotganini `grep -rn "getSession"` bilan tekshirish.

---

## 3-band — Better Auth Supabase HTTP adapter orqali ishlaydi (to'g'ridan-to'g'ri DB emas)
**Holat:** 🟢 TASDIQLANGAN

**Fayl:** `src/lib/auth-adapter.ts`, `src/lib/auth.ts`

**Dalil:** Kod ichidagi izoh: *"Port 5432/6543 is blocked by ISP in development... In production (Vercel), both approaches work — HTTPS is always available."* — ya'ni bu development uchun workaround, lekin **production da ham** shu sekinroq yo'l ishlatilmoqda. Har bir session tekshiruvi Supabase REST API orqali (HTTP) boradi, to'g'ridan-to'g'ri Postgres ulanish o'rniga.

Bundan tashqari build logda:
```
WARN [Better Auth]: Adapter does not correctly implement transaction function, patching it automatically.
```
— bu warning har build da va ehtimol har runtime chaqiruvda ham takrorlanadi, qo'shimcha ish yuklaydi.

**Tavsiya:** Production muhitida (`NODE_ENV=production` yoki `VERCEL=1` bo'lganda) to'g'ridan-to'g'ri Postgres ulanishli adapterga (`pg` yoki Drizzle adapter) o'tish, faqat local devda Supabase HTTP fallback qoldirish.

**Eslatma:** Bu o'zgarish auth tizimining yuragi — **juda ehtiyotkorlik bilan**, avval staging/test muhitida sinab ko'rilishi shart.

---

## 4-band — `cookieCache` mavjud, lekin sahifalar baribir qayta-qayta `getSession` chaqiradi
**Holat:** 🟢 TASDIQLANGAN (config) / 🟡 EHTIMOLIY (real ta'sir darajasi)

**Fayl:** `src/lib/auth.ts`, qator ~108

**Dalil:** `cookieCache: { enabled: true, maxAge: 60*5 }` — 5 daqiqalik cache bor. Lekin 2-bandda aytilgan dublikat chaqiruvlar sabab, bitta sahifa yuklanishida bir nechta `getSession` ishga tushadi — cache borligiga qaramay, har chaqiruv qandaydir tekshiruv ishini bajaradi.

**Tavsiya:** Avval 2-bandni hal qilish (dublikatni yo'qotish) — shundan keyin bu band o'z-o'zidan kamayadi.

---

## 5-band — `recordDebtPayment()` da loop ichida ketma-ket DB update
**Holat:** 🟢 TASDIQLANGAN

**Fayl:** `src/db/queries.ts`, qator 554 atrofida

**Dalil:**
```ts
for (const schedule of schedules) {
  ...
  await supabase.from('debt_schedules').update({...}).eq('id', schedule.id);
}
```
Har bir nasiya jadvali qatori uchun alohida `await` — agar 12 oylik nasiya bo'lsa, 12 ta ketma-ket HTTP so'rov.

**Tavsiya:** `update` larni massivga yig'ib, bitta `upsert(updates, { onConflict: 'id' })` chaqiruviga almashtirish.

---

## 6-band — `createSale()` ichida 13+ ketma-ket DB so'rov + Telegram bloklab turadi
**Holat:** 🟢 TASDIQLANGAN

**Fayl:** `src/db/queries.ts`, `createSale()` funksiyasi (~626-880 qatorlar)

**Dalil:** Funksiya ichida 13 marta `await supabase...` ketma-ket chaqiriladi (customer qidirish/yaratish, user, branch, sale, sale_items, debt, debt_schedules, customer balance, cashier nomi, branch nomi). Eng oxirida:
```ts
await sendTelegramAlert(data.tenantId, message);
```
— bu **Telegram Bot API ga tashqi HTTP so'rov**, va u ham `await` qilingan, ya'ni kassir "Sotuvni yakunlash" tugmasini bosgach, Telegram javob bermaguncha kutadi.

**Tavsiya:**
1. `sendTelegramAlert` ni `await` siz, fon rejimida (`.catch()` bilan) chaqirish — kassir kutmasin.
2. Cashier va branch ma'lumotlarini alohida emas, `Promise.all` bilan parallel olish.

**Diqqat:** Bu — **sotuv yaratish jarayoni**, ya'ni eng nozik joy. O'zgartirishdan oldin test muhitida bir nechta sotuv yaratib, ma'lumotlar to'g'ri saqlanayotganini tekshirish shart.

---

## 7-band — `searchProducts()` har harf kiritilganda serverga so'rov yuboradi
**Holat:** 🟢 TASDIQLANGAN

**Fayllar:** `src/db/queries.ts` (`searchProducts`), `src/components/pos/pos-interface.tsx`

**Dalil:** POS interfeysida 300ms debounce bilan `searchProducts(search, tenantId)` server funksiyasi chaqiriladi — bu Supabase ga HTTP so'rov. Lekin `inventoryData` (barcha mahsulotlar) allaqachon sahifa ochilganda yuklab olingan — mahsulot soni kam (hozircha 2-3 ta) bo'lsa, server ga borishning hojati yo'q.

**Tavsiya:** Qidiruvni client-side (brauzerda, `inventoryData.filter(...)`) qilish — server so'rovini butunlay olib tashlash.

**Eslatma:** Mahsulotlar soni kelajakda minglab bo'lsa (masalan 5000+), bu yondashuv yana serverga qaytarilishi kerak bo'ladi. Hozirgi 2-3 ta mahsulot uchun client-side to'liq yetarli.

---

## 8-band — `getInventory()` da ombor miqdori har doim 0 qaytadi (BUG, performance emas)
**Holat:** 🟢 TASDIQLANGAN

**Fayl:** `src/db/queries.ts`, qator 170-171

**Dalil:**
```ts
return (data || []).map(p => ({
  ...
  totalQuantity: 0,   // hardcoded!
  phoneCount: 0,      // hardcoded!
}));
```
Bu mantiqiy xato — ombordagi haqiqiy miqdor hisoblanmayapti, doim `0` qaytarilmoqda. Bu sekinlik emas, lekin **noto'g'ri ma'lumot ko'rsatish** bugi.

**Tavsiya:** `inventory_items` jadvali bilan JOIN qilib, haqiqiy miqdorni hisoblash kerak. Agar bu jadval mavjud bo'lmasa — avval bazada qaysi jadval ombor miqdorini saqlashini aniqlash kerak.

**MUHIM:** Bu band — boshqa bazaviy jadval tuzilishini bilishni talab qiladi. Agent avval bazadagi `inventory_items` yoki shunga o'xshash jadval mavjudligini tekshirsin, **keyin** kod yozsin.

---

## 9-band — 3 xil parol hash kutubxonasi bir vaqtda o'rnatilgan
**Holat:** 🟢 TASDIQLANGAN

**Fayl:** `package.json`

**Dalil:**
```json
"argon2": "^0.41.1",
"bcrypt": "^5.1.1",
"bcryptjs": "^3.0.3",
```
Tekshiruv natijasi:
- `argon2` — faqat `src/db/seed.ts` da ishlatilgan (runtime kodda emas, faqat dastlabki ma'lumot kiritish skriptida)
- `bcrypt` — **hech qayerda ishlatilmagan** (kod bazasida bironta import yo'q)
- `bcryptjs` — bu **haqiqatda runtime da ishlatilayotgan** kutubxona (`api/admin/users/[id]/route.ts`, `db/fix-password.ts`)

`argon2` va `bcrypt` — ikkalasi ham **native binding** kutubxonalar (C++ kod bilan kompilyatsiya qilinadi), bular Vercel build vaqtini va deploy hajmini oshiradi, lekin runtime tezligiga deyarli ta'sir qilmaydi (chunki ishlatilmaydi).

**Tavsiya:** `package.json` dan `bcrypt` ni butunlay olib tashlash (umuman ishlatilmagan). `argon2` ni esa — agar `seed.ts` faqat development uchun bo'lsa, `devDependencies` ga ko'chirish yoki shu funksiyani ham `bcryptjs` ga o'tkazib, butunlay olib tashlash mumkin.

**Ta'sir darajasi:** Bu runtime tezlikka emas, balki **build/deploy vaqtiga va paket hajmiga** ta'sir qiladi. Past-o'rta muhim band.

---

## 10-band — Drizzle ORM + to'g'ridan-to'g'ri Postgres ulanishi deyarli ishlatilmaydi (arxitektura chalkashligi)
**Holat:** 🟢 TASDIQLANGAN — **bu original audit hujjatidagi xato taxminni tuzatadi**

**Dalil:** Loyihada `drizzle-orm` va `postgres` paketlari o'rnatilgan, schema fayllari (`src/db/schema/*.ts`) to'liq yozilgan. Lekin butun amaliyot logikasi (`src/db/queries.ts`, 1300+ qator, barcha CRUD amallar) **Drizzle dan emas, balki to'g'ridan-to'g'ri Supabase JS client** (`getSupabase().from(...)`) orqali ishlaydi.

`grep` natijasi — Drizzle `db` instance faqat 2 joyda import qilinadi: `api/health/route.ts` va `lib/api-helpers.ts` (u yerda ham real ishlatilmaydi).

**Nima uchun bu muhim:** Sizga berilgan oldingi audit hujjatida (PDF) "Drizzle relational queries bilan N+1 muammosini hal qiling" deyilgan edi — lekin bu **noto'g'ri tavsiya**, chunki loyiha Drizzle relational query API sini umuman ishlatmaydi. Bu band shuni ko'rsatadiki — **kod yozishdan oldin albatta real faylni o'qish kerak**, faqat texnologiya nomi (Drizzle bor) asosida xulosa chiqarib bo'lmaydi.

**Tavsiya:** Bu band o'zi performance muammosi emas — informatsion. Agent buni o'qib, kelajakda "Drizzle bilan optimallashtirish" kabi tavsiyalarni **shubha bilan qabul qilishi** va avval real kodni tekshirishi kerak.

---

## 11-band — Hech qayerda `React.memo` yoki list virtualization ishlatilmagan
**Holat:** 🟢 TASDIQLANGAN (kod yo'qligi) / 🟡 EHTIMOLIY (hozirgi ma'lumot hajmida sezilarli ta'sir)

**Dalil:** `grep -rln "React.memo\|memo("` — natija bo'sh. `grep -rln "react-virtual\|react-window"` — natija bo'sh.

**Hozirgi vaziyat:** Siz aytganingizdek hozircha mahsulot 2-3 ta, foydalanuvchi 5-10 ta. Shu hajmda virtualization yoki memo yo'qligi **sezilarli sekinlik bermaydi**.

**Tavsiya:** Hozir bu bandni ustuvor qilmaslik kerak. Mahsulotlar soni kelajakda 200+ ga yetganda qaytib ko'rib chiqish kerak bo'ladi.

---

## 12-band — 3 ta komponentda `<img>` tegi ishlatilgan, `next/image` emas
**Holat:** 🟢 TASDIQLANGAN

**Fayllar:** `src/components/dashboard/inventory-list.tsx`, `admin-sales-interface.tsx`, `src/components/pos/pos-interface.tsx`

**Dalil:** `grep -rln "<img "` — 3 ta fayl topildi. `next.config.ts` da `images.remotePatterns` sozlangan (Supabase va Unsplash uchun) — ya'ni `next/image` ishlatish uchun infratuzilma tayyor, lekin amalda ishlatilmagan.

**Tavsiya:** `<img src=...>` larni `next/image` ning `<Image>` komponentiga almashtirish — bu rasm hajmini avtomatik optimallashtiradi (WebP, lazy loading).

**Ta'sir darajasi:** Mahsulot rasmlari kam bo'lsa hozircha kichik ta'sir, lekin rasm hajmi katta bo'lsa (masalan telefon rasmlari) — sezilarli farq beradi.

---

# Xulosa — Ustuvorlik tartibi

| # | Band | Ta'sir | Xavf darajasi | Ishonch |
|---|------|--------|----------------|---------|
| 1 | Sidebar prefetch | 🔴 Juda katta (5.3s → ~1s) | Past — UI o'zgarishi | 🟢 Tasdiqlangan |
| 2 | Dublikat session tekshiruv | 🟠 Katta | Past-o'rta | 🟢 Tasdiqlangan |
| 6 | createSale Telegram blocking | 🟠 Katta (sotuv tugmasi sekin) | O'rta — moliyaviy logika | 🟢 Tasdiqlangan |
| 5 | recordDebtPayment loop | 🟡 O'rta (faqat nasiya to'lovida) | O'rta — moliyaviy logika | 🟢 Tasdiqlangan |
| 7 | searchProducts client-side | 🟡 O'rta | Past | 🟢 Tasdiqlangan |
| 3 | Better Auth HTTP adapter | 🟠 Katta, lekin murakkab | **Yuqori** — auth tizimi | 🟢 Tasdiqlangan |
| 8 | totalQuantity bug | Bug (tezlik emas) | O'rta — ma'lumot to'g'riligi | 🟢 Tasdiqlangan |
| 9 | 3 ta hash kutubxona | 🟢 Kichik (build vaqti) | Past | 🟢 Tasdiqlangan |
| 12 | `<img>` → `next/image` | 🟢 Kichik-o'rta | Past | 🟢 Tasdiqlangan |
| 11 | memo/virtualization yo'q | Hozircha 0 (kam ma'lumot) | — | 🟡 Keyinga qoldirish |
| 10 | Drizzle ishlatilmaydi | Informatsion | — | 🟢 Tasdiqlangan |

---

## Agent uchun umumiy qoida

Har bir bandni bajarishdan oldin:
1. **Ko'rsatilgan faylni oching va real kodni o'qing** — bu hujjatdagi qator raqamlari kod o'zgarishi bilan siljishi mumkin.
2. **O'zgarish nimani buzishi mumkinligini o'ylab ko'ring** — ayniqsa 3, 6, 8-bandlar moliyaviy yoki auth logikasiga tegadi.
3. **Kichik, alohida commit lar bilan ishlang** — bir vaqtda bir band, keyin test qiling.
4. **Faqat ishonch hosil qilgandan keyin** kodni o'zgartiring. Agar fayl tuzilishi bu hujjatda yozilganidan farq qilsa — avval foydalanuvchidan so'rang, taxmin qilib o'zgartirmang.
