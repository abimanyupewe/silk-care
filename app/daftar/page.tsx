import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Building2, Stethoscope, User } from 'lucide-react';
import { getActiveSession } from '@/lib/auth-guard';
import { panelHomeForRole } from '@/lib/roles';

export const metadata: Metadata = {
  title: 'Daftar — SILK',
  description: 'Pilih jenis akun SILK yang ingin Anda buat.'
};

const cardClass = 'flex min-h-11 items-start gap-4 border border-border bg-white p-4';

export default async function SignUpPage() {
  const session = await getActiveSession();

  if (session) {
    redirect(panelHomeForRole(session.user.role));
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-4 py-12">
      <div className="border border-border bg-white p-6 md:p-8">
        <p className="text-sm font-semibold text-primary-hover">SILK</p>
        <h1 className="mt-2 text-2xl font-bold text-ink">Daftar sebagai apa?</h1>
        <p className="mt-2 text-ink-muted">Pilih jenis akun yang sesuai dengan Anda.</p>

        <ul className="mt-6 space-y-3">
          <li>
            <Link
              href="/daftar/pasien"
              className={`${cardClass} hover:border-primary hover:bg-primary-tint`}
            >
              <User className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              <span>
                <span className="block font-semibold text-ink">Pasien</span>
                <span className="block text-sm text-ink-muted">
                  Cari dokter dan fasilitas, ajukan konsultasi atau janji temu.
                </span>
              </span>
            </Link>
          </li>
          <li>
            <Link
              href="/mitra/daftar"
              className={`${cardClass} hover:border-primary hover:bg-primary-tint`}
            >
              <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              <span>
                <span className="block font-semibold text-ink">Fasilitas kesehatan</span>
                <span className="block text-sm text-ink-muted">
                  Rumah sakit, klinik, laboratorium, ambulans, apotek, rumah duka, dan lainnya.
                </span>
              </span>
            </Link>
          </li>
          <li>
            <div aria-disabled="true" className={`${cardClass} bg-surface`}>
              <Stethoscope className="mt-0.5 h-5 w-5 shrink-0 text-ink-faint" aria-hidden="true" />
              <span>
                <span className="block font-semibold text-ink">Dokter</span>
                <span className="block text-sm text-ink-muted">
                  Segera hadir. Pendaftaran dokter belum tersedia.
                </span>
              </span>
            </div>
          </li>
        </ul>

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
