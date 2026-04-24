import { getDebts } from '@/db/queries';
import { DebtList } from '@/components/dashboard/debt-list';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function CreditPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/login');
  }

  // Fetch real debts data
  const debtsData = await getDebts(session.user.tenantId);

  // Ensure serializability
  const serializedDebts = debtsData.map(d => ({
    ...d,
    totalAmount: (d.totalAmount ?? 0).toString(),
    remainingAmount: (d.remainingAmount ?? 0).toString(),
    monthlyPayment: (d.monthlyPayment ?? 0).toString(),
    createdAt: new Date(d.createdAt),
  }));

  return <DebtList initialData={serializedDebts as any} />;
}
