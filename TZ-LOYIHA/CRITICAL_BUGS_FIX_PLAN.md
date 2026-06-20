# Tizim Xatoliklarini Tuzatish Rejasi va Checklist

Ushbu hujjat tizimda aniqlangan eng muhim (kritik va muhim darajadagi) xavfsizlik va mantiqiy xatoliklarni tuzatish uchun mo'ljallangan. 

Har bir bandni bajargach belgilab boramiz:
- `[ ]` Bajarilmagan
- `[/]` Jarayonda
- `[x]` Bajarilgan

## 🔴 Kritik Muammolar (Xavfsizlik va Role)
- `[x]` **`api-helpers.ts` Role tekshiruvi:** `userRole: TenantContext['userRole'] = 'tenant_owner';` ni olib tashlab, haqiqiy foydalanuvchi rolini o'qish (Hardcode olib tashlanadi).
- `[x]` **`/admin/users` POST (Xodim yaratish):** Parol bcrypt tezligini cost 12 dan 10 ga tushirish va account jadvaliga qo'shishda xato bo'lsa rollback (users jadvalidan ham o'chirish) qilinishini qo'shish.
- `[x]` **`/admin/users/[id]` PUT (Xodimni tahrirlash):** Faqat `admin` va `tenant_owner` lar foydalanuvchilarni tahrirlay olishi uchun role tekshiruvi qo'shish.

## 🟠 Muhim Muammolar (Ma'lumotlar bazasi va SQL xatolar)
- `[x]` **`openShift` (queries.ts):** Smena ochishda `tenant_id` filtri qo'shish (cross-tenant leak oldini olish uchun).
- `[x]` **`recordDebtPayment` (queries.ts):** Mijoz qarzi va umumiy qarzini yangilashda (update) albatta `tenant_id` filtri bilan tekshirish.
- `[x]` **`getDashboardKpis` & `getChartData`:** Xatolik (error) paydo bo'lganda shunchaki jim yutib yubormay, tepaga `throw error` qilish.
- `[x]` **`api/sales` POST (Sotuv):** Sotuv yaratishda `productName: 'Product'` va `costPrice: item.unitPrice * 0.7` soxta ma'lumotlarini olib tashlab, bazadan haqiqiy mahsulot (name va cost_price) ni olib kelib yozish.

## 🟢 O'rta Muammolar (UI va Fake Datani o'zgartirish)
- `[x]` Hisobotlar (`reports/page.tsx`) statistikasini real API dan olish.
- `[x]` Audit log (`audit/page.tsx`) ma'lumotlarini qotib qolgan json o'rniga haqiqiy audit bazasidan olish.
- `[x]` Sozlamalar (`settings/page.tsx`) da saqlash tugmasini API ga ulash.
