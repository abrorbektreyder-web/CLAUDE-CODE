import { PosInterface } from '@/components/pos/pos-interface';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getInventory, getCustomers, getDebts, getSales } from '@/db/queries';

export const metadata = {
  title: 'Yangi Savdo | Admin Panel',
};

export default async function AdminNewSalePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Agar sessiya bo'lmasa, Admin login sahifasiga qaytarish (kassirga emas!)
  if (!session) {
    redirect('/login?callback=/sales/new');
  }

  // Agar kassir admin paneliga kirmoqchi bo'lsa, uni o'zini POS oynasiga qaytarish
  if (session.user.role === 'cashier') {
    redirect('/staff/pos');
  }

  const tenantId = session.user.tenantId;

  // Fetch barcha kerakli ma'lumotlar
  const [inventoryRaw, customersRaw, debtsRaw, salesRaw] = await Promise.all([
    getInventory(tenantId),
    getCustomers(tenantId),
    getDebts(tenantId),
    getSales(tenantId),
  ]);

  // Ma'lumotlarni komponentga moslashtirish
  const inventoryData = inventoryRaw.map(item => ({
    ...item,
    retailPrice: (item.retailPrice ?? 0).toString(),
    costPrice: (item.costPrice ?? 0).toString(),
    wholesalePrice: item.wholesalePrice ? item.wholesalePrice.toString() : null,
  }));

  const customersData = customersRaw.map(c => ({
    ...c,
    totalSpent: (c.totalSpent ?? 0).toString(),
    totalDebts: (c.totalDebts ?? 0).toString(),
    lastPurchaseAt: c.lastPurchaseAt ? new Date(c.lastPurchaseAt) : null,
    createdAt: new Date(c.createdAt),
  }));

  const debtsData = debtsRaw.map(d => ({
    ...d,
    totalAmount: (d.totalAmount ?? 0).toString(),
    remainingAmount: (d.remainingAmount ?? 0).toString(),
    monthlyPayment: (d.monthlyPayment ?? 0).toString(),
    createdAt: new Date(d.createdAt),
  }));

  const salesData = salesRaw.map(s => ({
    ...s,
    total: s.total.toString(),
    receiptNumber: s.receiptNumber.toString(),
    debtStatus: s.debtStatus ?? null,
    debtRemaining: s.debtRemaining?.toString() ?? null,
    debtTotal: s.debtTotal?.toString() ?? null,
    debtPaid: s.debtPaid?.toString() ?? null,
  }));

  return (
    <div className="h-[calc(100vh-140px)] -m-4 md:-m-6 lg:-m-8">
      <PosInterface 
        inventoryData={inventoryData}
        customersData={customersData}
        debtsData={debtsData}
        salesData={salesData}
        hideSidebar={true} 
      />
    </div>
  );
}
