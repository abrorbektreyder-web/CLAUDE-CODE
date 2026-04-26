import { getSales } from '@/db/queries';
import { SalesList } from '@/components/dashboard/sales-list';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function SalesPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/login');
  }

  // Fetch real sales data
  const sales = await getSales(session.user.tenantId);

  // Ensure serializability
  const serializedSales = sales.map(s => ({
    ...s,
    total: s.total.toString(),
    receiptNumber: s.receiptNumber.toString(),
    // Debt enrichment — pass through (already string | null from Supabase decimal)
    debtStatus: s.debtStatus ?? null,
    debtRemaining: s.debtRemaining?.toString() ?? null,
    debtTotal: s.debtTotal?.toString() ?? null,
    debtPaid: s.debtPaid?.toString() ?? null,
  }));

  return <SalesList initialData={serializedSales} />;
}

