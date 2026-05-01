# Kassir Ish Muhiti (Staff Dashboard) - Texnik Topshiriq

## 📊 Ishlar holati (Status)
- [x] **Auth**: Kassir login sahifasi yaratildi (`/cashier-login`)
- [x] **API**: Kassir uchun maxsus login API yaratildi (`/api/cashier/login`)
- [/] **Sidebar**: Kassir uchun alohida `StaffSidebar` (Jarayonda...)
- [ ] **Layout**: Kassir uchun alohida Dashboard Layout yaratish
- [ ] **Middleware Guard**: Kassirni Admin paneldan cheklash
- [ ] **Staff Inventory**: Omborning kassir uchun cheklangan versiyasi
- [ ] **Staff Sales**: Savdolar tarixi va chek chiqarish
- [ ] **Staff Credit**: Nasiya to'lovlarini qabul qilish
- [ ] **Telegram Alerts**: Owner-ga har bir sotuv haqida botdan xabar borishi

## 1. Arxitektura va Yo'nalishlar (Routing)
... (qolgan qismlar o'zgarishsiz qoladi)
Admin paneli (`/inventory`, `/sales`) ga mutloq tegmasdan, kassir uchun alohida route group yaratiladi.
*   **Base URL**: `/staff/*`
*   **Auth**: Kassir faqat `/cashier-login` orqali kiradi va uning sessiyasi `role: 'cashier'` deb belgilanadi.
*   **Middleware**: Agar kassir `/dashboard` yoki `/inventory` kabi admin yo'llariga kirmoqchi bo'lsa, avtomatik `/staff/pos` ga yo'naltiriladi.

## 2. Kassir Dashboard (Ko'rinish)
Kassir uchun alohida `StaffSidebar` va `StaffLayout` yaratiladi.
*   **Menyu tarkibi**:
    1.  🛒 **Kassa (POS)** — Asosiy sotuv oynasi.
    2.  📦 **Ombor (Zaxira)** — Faqat mahsulotlar qoldig'ini ko'rish va yangi mahsulot qo'shish.
    3.  🧾 **Savdolar tarixi** — Bugungi qilingan savdolar va cheklarni qayta chiqarish.
    4.  🤝 **Nasiyalar** — Mijozlar qarzi va to'lovlarni qabul qilish.

## 3. Funksional Cheklovlar (Security & Permissions)
Kassirda **O'chirish (Delete)** va **Global tahrirlash** huquqi bo'lmaydi.

### A. Ombor boshqaruvi:
*   ✅ Yangi mahsulot qo'shish.
*   ✅ Mahsulot qoldig'ini (miqdorini) yangilash.
*   ❌ Mahsulotni o'chirish (Delete button olib tashlanadi).
*   ❌ Tannarxni (Cost Price) ko'rish (Kassir uchun yashiriladi).

### B. Savdolar va Moliyaviy qism:
*   ✅ Sotuv qilish va chek chiqarish.
*   ✅ Nasiya to'lovini qabul qilish ("To'ladi" tugmasi).
*   ❌ Sotilgan narsani o'chirish (Faqat Admin tasdig'i bilan "Vozvrat" qilish mumkin).
*   ❌ Umumiy do'kon foydasini (Profit) ko'rish (Kassir faqat jami tushumni ko'radi).

## 4. Xabarnomalar tizimi (Owner Alerts)
Kassirning har bir "muhim" harakati Admin (Owner) ning Telegram botiga yuboriladi:
1.  **Yangi Sotuv**: Kimga, qancha va qanday usulda (naqd/nasiya) sotilgani haqida darhol xabar.
2.  **Nasiya to'lovi**: Mijoz qarzini to'laganda Owner-ga bildirishnoma.
3.  **Xato harakat**: Agar kassir ruxsat etilmagan joyga kirmoqchi bo'lsa, ogohlantirish.

## 5. UI/UX Dizayn Standartlari
*   **Mobile-First**: Kassir asosan telefon yoki planshetda ishlashini hisobga olib, barcha jadval va tugmalar yirik va qulay bo'ladi.
*   **Komsakt Sidebar**: Admin Sidebar-iga o'xshash, lekin faqat 4 ta menyudan iborat bo'lgan yengil sidebar.
*   **Action-Oriented**: Har bir sahifada "Tezkor sotuv" yoki "Mijoz qidirish" kabi asosiy tugmalar ajralib turadi.

---
**Tasdiqlash**: Ushbu reja bo'yicha ishlash Admin tizimining barqarorligini 100% kafolatlaydi, chunki barcha yangi kodlar alohida `/staff` papkasida yoziladi.
