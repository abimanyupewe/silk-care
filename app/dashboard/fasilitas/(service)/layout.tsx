import { redirect } from 'next/navigation';
import { getActiveSession } from '@/lib/auth-guard';
import { isServiceFacility } from '@/lib/facility-types';

// Layanan dan janji temu untuk semua fasilitas selain apotek; apotek kembali ke Ringkasan.
export default async function ServiceLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await getActiveSession();

  if (!isServiceFacility(session?.user.role)) {
    redirect('/dashboard/fasilitas');
  }

  return children;
}
