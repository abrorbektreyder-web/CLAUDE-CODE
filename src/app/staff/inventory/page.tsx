import { getInventory } from '@/db/queries';
import { InventoryList } from '@/components/dashboard/inventory-list';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function StaffInventoryPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/cashier-login');
  }

  // Fetch real inventory data
  const inventory = await getInventory(session.user.tenantId);

  // Convert decimal strings to numbers for the UI components
  const serializedInventory = inventory.map(item => ({
    ...item,
    retailPrice: (item.retailPrice ?? 0).toString(),
    costPrice: (item.costPrice ?? 0).toString(),
    wholesalePrice: item.wholesalePrice ? item.wholesalePrice.toString() : null,
  }));

  return (
    <div className="space-y-6">
      <InventoryList initialData={serializedInventory as any} role="cashier" />
    </div>
  );
}
