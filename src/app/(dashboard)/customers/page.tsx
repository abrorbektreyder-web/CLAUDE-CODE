import { getCustomers } from '@/db/queries';
import { CustomerList } from '@/components/dashboard/customer-list';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function CustomersPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/login');
  }

  // Fetch real customers data
  const customers = await getCustomers(session.user.tenantId);

  // Ensure serializability for the client component
  const serializedCustomers = customers.map(c => ({
    ...c,
    totalSpent: (c.totalSpent ?? 0).toString(),
    totalDebts: (c.totalDebts ?? 0).toString(),
    lastPurchaseAt: c.lastPurchaseAt ? new Date(c.lastPurchaseAt) : null,
    createdAt: new Date(c.createdAt),
  }));

  return <CustomerList initialData={serializedCustomers as any} />;
}
