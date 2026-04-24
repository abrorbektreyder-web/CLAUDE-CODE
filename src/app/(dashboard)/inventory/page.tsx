import { getInventory } from '@/db/queries';
import { InventoryList } from '@/components/dashboard/inventory-list';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function InventoryPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/login');
  }

  // Fetch real inventory data
  const inventory = await getInventory(session.user.tenantId);

  // Convert decimal strings to numbers for the UI components
  // and ensure types match what InventoryList expects
  const serializedInventory = inventory.map(item => ({
    ...item,
    retailPrice: (item.retailPrice ?? 0).toString(),
  }));

  return <InventoryList initialData={serializedInventory as any} />;
}
