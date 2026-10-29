import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { DoctorShell } from '@/components/doctor/DoctorShell';
import { getActiveSession } from '@/lib/auth-guard';
import { panelHomeForRole } from '@/lib/roles';

export const metadata: Metadata = {
  title: 'Panel Dokter — SILK',
  description: 'Panel dokter SILK.'
};

export default async function DoctorLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await getActiveSession();

  if (!session) {
    redirect('/login?callbackUrl=/dashboard/dokter');
  }

  if (session.user.role !== 'DOCTOR') {
    redirect(panelHomeForRole(session.user.role));
  }

  return (
    <DoctorShell user={{ name: session.user.name, email: session.user.email }}>
      {children}
    </DoctorShell>
  );
}
