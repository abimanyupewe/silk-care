import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { FacilityShell } from '@/components/facility/FacilityShell';
import { getActiveSession } from '@/lib/auth-guard';
import { panelHomeForRole } from '@/lib/roles';

export const metadata: Metadata = {
  title: 'Panel Fasilitas — SILK',
  description: 'Panel fasilitas dan apotek SILK.'
};

export default async function FacilityLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getActiveSession();

  if (!session) {
    redirect('/login?callbackUrl=/dashboard/fasilitas');
  }

  if (session.user.role !== 'FACILITY' && session.user.role !== 'PHARMACY') {
    redirect(panelHomeForRole(session.user.role));
  }

  return (
    <FacilityShell user={{ name: session.user.name, email: session.user.email }}>
      {children}
    </FacilityShell>
  );
}
