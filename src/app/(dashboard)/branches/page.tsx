import { getBranches } from '@/db/queries';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import BranchesList from '@/components/dashboard/branches-list';

export default async function BranchesPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/login');
  }

  const branches = await getBranches(session.user.tenantId);

  return <BranchesList initialData={branches as any} />;
}
