import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getActiveSession } from '@/lib/auth-guard';
import { panelHomeForRole } from '@/lib/roles';
import { FacilityRegisterForm } from '../fasilitas/facility-register-form';

export const metadata: Metadata = {
  title: 'Daftar mitra fasilitas — SILK',
  description: 'Buat akun dan daftarkan apotek, klinik, atau fasilitas kesehatan Anda di SILK.'
};

export default async function PartnerSignUpPage() {
  const session = await getActiveSession();

  if (session) {
    // Pasien melanjutkan lewat formulir fasilitas; peran lain sudah punya panel sendiri.
    redirect(
      session.user.role === 'PATIENT' ? '/mitra/fasilitas' : panelHomeForRole(session.user.role)
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-4 py-12">
      <div className="border border-border bg-white p-6 md:p-8">
        <p className="text-sm font-semibold text-primary-hover">SILK</p>
        <h1 className="mt-2 text-2xl font-bold text-ink">Daftar sebagai mitra fasilitas</h1>
        <p className="mt-2 text-ink-muted">
          Buat akun dan daftarkan fasilitas Anda. Profil akan diverifikasi admin sebelum tampil di
          katalog publik.
        </p>

        <div className="mt-6">
          <FacilityRegisterForm withAccount />
        </div>

        <p className="mt-6 text-sm text-ink-muted">
          Sudah punya akun?{' '}
          <Link href="/login" className="font-semibold text-primary-hover underline">
            Masuk
          </Link>
        </p>
      </div>
    </main>
  );
}
