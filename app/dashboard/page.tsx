import { redirect } from 'next/navigation';
import { getActiveSession } from '@/lib/auth-guard';
import { panelHomeForRole } from '@/lib/roles';

export default async function DashboardIndexPage() {
  const session = await getActiveSession();

  if (!session) {
    redirect('/login');
  }

  redirect(panelHomeForRole(session.user.role));
}
