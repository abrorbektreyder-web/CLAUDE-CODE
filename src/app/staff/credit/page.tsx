import { getCachedSession } from '@/lib/get-session';
import { getDebts } from '@/db/queries';
import { DebtList } from '@/components/dashboard/debt-list';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function StaffCreditPage() {
  const session = await getCachedSession();

  if (!session) {
    redirect('/cashier-login');
  }

  // Fetch real debt data
  const debts = await getDebts(session.user.tenantId);

  // Ensure serializability
  const serializedDebts = debts.map(d => ({
    ...d,
    totalAmount: d.totalAmount.toString(),
    remainingAmount: d.remainingAmount.toString(),
    monthlyPayment: d.monthlyPayment.toString(),
  }));

  return (
    <div className="space-y-6">
      <DebtList initialData={serializedDebts as any} />
    </div>
  );
}
