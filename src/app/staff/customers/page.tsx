import { getCustomers } from '@/db/queries';
import { CustomerList } from '@/components/dashboard/customer-list';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function StaffCustomersPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/cashier-login');
  }

  // Fetch real customer data
  const customers = await getCustomers(session.user.tenantId);

  // Ensure serializability
  const serializedCustomers = customers.map(c => ({
    ...c,
    totalSpent: c.totalSpent.toString(),
    totalDebts: c.totalDebts.toString(),
  }));

  return (
    <div className="space-y-6">
      <CustomerList initialData={serializedCustomers as any} />
    </div>
  );
}
