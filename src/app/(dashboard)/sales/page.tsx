import { ShoppingCart, Search, Filter, Plus, MoreHorizontal, Download, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

export default function SalesPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">Sotuvlar</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">Barcha amalga oshirilgan savdolar tarixi va boshqaruvi</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-2.5 text-sm font-semibold transition-all hover:bg-[var(--color-bg-hover)]">
            <Download size={18} />
            Eksport
          </button>
          <button className="flex items-center gap-2 rounded-xl bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[var(--color-accent)]/20 transition-all hover:bg-[var(--color-accent-hover)]">
            <Plus size={18} />
            Yangi savdo
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="premium-card rounded-2xl p-5">
          <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">Bugungi jami savdo</div>
          <div className="flex items-end gap-2">
            <div className="text-2xl font-bold">47,250,000</div>
            <div className="mb-1 text-xs text-[var(--color-text-tertiary)]">so'm</div>
            <div className="ml-auto flex items-center gap-1 rounded-md bg-[var(--color-success)]/10 px-1.5 py-0.5 text-[10px] font-bold text-[var(--color-success)]">
              <ArrowUpRight size={12} />
              12%
            </div>
          </div>
        </div>
        <div className="premium-card rounded-2xl p-5">
          <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">Sotilgan tovarlar</div>
          <div className="flex items-end gap-2">
            <div className="text-2xl font-bold">34</div>
            <div className="mb-1 text-xs text-[var(--color-text-tertiary)]">dona</div>
            <div className="ml-auto flex items-center gap-1 rounded-md bg-[var(--color-success)]/10 px-1.5 py-0.5 text-[10px] font-bold text-[var(--color-success)]">
              <ArrowUpRight size={12} />
              8 ta
            </div>
          </div>
        </div>
        <div className="premium-card rounded-2xl p-5">
          <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">O'rtacha chek</div>
          <div className="flex items-end gap-2">
            <div className="text-2xl font-bold">1,389,000</div>
            <div className="mb-1 text-xs text-[var(--color-text-tertiary)]">so'm</div>
            <div className="ml-auto flex items-center gap-1 rounded-md bg-[var(--color-danger)]/10 px-1.5 py-0.5 text-[10px] font-bold text-[var(--color-danger)]">
              <ArrowDownLeft size={12} />
              3%
            </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="premium-card overflow-hidden rounded-2xl">
        <div className="flex items-center gap-4 border-b border-[var(--color-border)] p-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]" size={18} />
            <input 
              type="text" 
              placeholder="Chek raqami, mijoz yoki telefon bo'yicha qidirish..." 
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)]/50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[var(--color-accent)] focus:ring-4 focus:ring-[var(--color-accent)]/10"
            />
          </div>
          <button className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] px-4 py-2.5 text-sm font-semibold transition-all hover:bg-[var(--color-bg-hover)]">
            <Filter size={18} />
            Filtr
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-elevated)]/30 text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                <th className="px-6 py-4">Chek №</th>
                <th className="px-6 py-4">Mijoz</th>
                <th className="px-6 py-4">Tovar</th>
                <th className="px-6 py-4">Summa</th>
                <th className="px-6 py-4">To'lov turi</th>
                <th className="px-6 py-4">Vaqt</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {mockSales.map((sale) => (
                <tr key={sale.id} className="group transition-colors hover:bg-[var(--color-bg-hover)]">
                  <td className="px-6 py-4 font-mono font-bold text-[var(--color-accent)]">#{sale.id}</td>
                  <td className="px-6 py-4">
                    <div className="font-semibold">{sale.customer}</div>
                    <div className="text-xs text-[var(--color-text-tertiary)]">{sale.phone}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium">{sale.product}</div>
                    <div className="text-xs text-[var(--color-text-tertiary)]">IMEI: {sale.imei}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold">{sale.amount}</div>
                    <div className="text-[10px] font-bold text-[var(--color-success)]">To'landi</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center rounded-md bg-[var(--color-bg-elevated)] px-2 py-0.5 text-[11px] font-bold border border-[var(--color-border)]">
                      {sale.paymentType}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[var(--color-text-secondary)]">{sale.time}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="rounded-lg p-2 text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-foreground)]">
                      <MoreHorizontal size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const mockSales = [
  {
    id: '8492',
    customer: 'Azizov Bekzod',
    phone: '+998 90 123 45 67',
    product: 'iPhone 15 Pro Max, 256GB',
    imei: '358291039284712',
    amount: '16,450,000',
    paymentType: 'Plastik',
    time: '14:20',
  },
  {
    id: '8491',
    customer: "G'ofurov Olim",
    phone: '+998 93 888 22 11',
    product: 'Samsung S24 Ultra',
    imei: '357712039200192',
    amount: '14,200,000',
    paymentType: 'Naqd',
    time: '12:05',
  },
  {
    id: '8490',
    customer: 'Xakimov Jalol',
    phone: '+998 94 555 66 77',
    product: 'AirPods Pro 2nd Gen',
    imei: 'A2698-00192',
    amount: '2,850,000',
    paymentType: 'Terminal',
    time: '10:45',
  },
];
