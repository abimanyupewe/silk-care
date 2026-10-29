import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getActiveSession } from '@/lib/auth-guard';
import { AdminShell } from '@/components/admin/AdminShell';

export const metadata: Metadata = {
  title: 'Panel Admin — SILK',
  description: 'Panel operasional admin SILK.'
};

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await getActiveSession();

  if (!session) {
    redirect('/login?callbackUrl=/admin');
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/');
  }

  return (
    <AdminShell user={{ name: session.user.name, email: session.user.email }}>
      {children}
    </AdminShell>
  );
}
