import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getActiveSession } from '@/lib/auth-guard';
import { panelHomeForRole } from '@/lib/roles';
import { PatientRegisterForm } from './patient-register-form';

export const metadata: Metadata = {
  title: 'Daftar sebagai pasien — SILK',
  description: 'Buat akun pasien SILK.'
};

export default async function PatientSignUpPage() {
  const session = await getActiveSession();

  if (session) {
    redirect(panelHomeForRole(session.user.role));
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-12">
      <div className="border border-border bg-white p-6 md:p-8">
        <p className="text-sm font-semibold text-primary-hover">SILK</p>
        <h1 className="mt-2 text-2xl font-bold text-ink">Daftar sebagai pasien</h1>
        <p className="mt-2 text-ink-muted">Buat akun untuk mengajukan konsultasi dan janji temu.</p>

        <div className="mt-6">
          <PatientRegisterForm />
        </div>

        <p className="mt-6 text-sm text-ink-muted">
          Sudah punya akun?{' '}
          <Link href="/login" className="font-semibold text-primary-hover underline">
            Masuk
          </Link>
          {' · '}
          <Link href="/daftar" className="font-semibold text-primary-hover underline">
            Pilih jenis akun lain
          </Link>
        </p>
      </div>
    </main>
  );
}
