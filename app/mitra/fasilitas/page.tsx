import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getActiveSession } from '@/lib/auth-guard';
import { facilityTypeLabels, parseFacilityType } from '@/lib/facility-types';
import { panelHomeForRole } from '@/lib/roles';
import { FacilityRegisterForm } from './facility-register-form';

export const metadata: Metadata = {
  title: 'Daftar sebagai fasilitas — SILK',
  description: 'Daftarkan apotek, klinik, atau fasilitas kesehatan Anda di SILK.'
};

export default async function FacilityRegisterPage({
  searchParams
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const session = await getActiveSession();
  const type = parseFacilityType((await searchParams).type);
  const label = type ? facilityTypeLabels[type].toLowerCase() : null;

  if (!session) {
    // Jenis ikut ke login supaya pengguna kembali ke halaman pendaftaran jenis yang sama.
    const target = `/mitra/fasilitas${type ? `?type=${type}` : ''}`;

    redirect(`/login?callbackUrl=${encodeURIComponent(target)}`);
  }

  // Hanya pasien yang bisa mendaftar; peran lain sudah punya panel sendiri.
  if (session.user.role !== 'PATIENT') {
    redirect(panelHomeForRole(session.user.role));
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-4 py-12">
      <div className="border border-border bg-white p-6 md:p-8">
        <p className="text-sm font-semibold text-primary-hover">SILK</p>
        <h1 className="mt-2 text-2xl font-bold text-ink">
          {label ? `Daftar sebagai mitra ${label}` : 'Daftar sebagai fasilitas'}
        </h1>
        <p className="mt-2 text-ink-muted">
          Profil Anda akan diverifikasi admin sebelum tampil di katalog publik.
        </p>

        <div className="mt-6">
          <FacilityRegisterForm lockedType={type} />
        </div>
      </div>
    </main>
  );
}
