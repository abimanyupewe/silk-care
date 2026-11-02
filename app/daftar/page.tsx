import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Stethoscope, User } from 'lucide-react';
import { facilityTypeIcons } from '@/components/shared/PartnerMenu';
import { getActiveSession } from '@/lib/auth-guard';
import { facilityTypeLabels, facilityTypes } from '@/lib/facility-types';
import { panelHomeForRole } from '@/lib/roles';

export const metadata: Metadata = {
  title: 'Daftar — SILK',
  description: 'Pilih jenis akun SILK yang ingin Anda buat.'
};

const tileClass =
  'flex min-h-11 items-center gap-3 border border-border bg-white px-4 py-3 hover:border-primary hover:bg-primary-tint';

// Dokter dulu, lalu fasilitas dengan urutan yang sama seperti menu mitra.
const partnerOptions = [
  { type: 'DOCTOR', label: 'Dokter', Icon: Stethoscope },
  ...facilityTypes.map((type) => ({
    type,
    label: facilityTypeLabels[type],
    Icon: facilityTypeIcons[type]
  }))
];

export default async function SignUpPage() {
  const session = await getActiveSession();

  if (session) {
    redirect(panelHomeForRole(session.user.role));
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center px-4 py-12">
      <div className="border border-border bg-white p-6 md:p-8">
        <p className="text-sm font-semibold text-primary-hover">SILK</p>
        <h1 className="mt-2 text-2xl font-bold text-ink">Daftar sebagai apa?</h1>
        <p className="mt-2 text-ink-muted">Pilih jenis akun yang sesuai dengan Anda.</p>

        <section aria-labelledby="daftar-pasien" className="mt-6">
          <h2 id="daftar-pasien" className="text-base font-bold text-ink">
            Pasien
          </h2>
          <Link href="/daftar/pasien" className={`${tileClass} mt-3 items-start`}>
            <User className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
            <span>
              <span className="block font-semibold text-ink">Daftar sebagai pasien</span>
              <span className="block text-sm text-ink-muted">
                Cari dokter dan fasilitas kesehatan, serta baca artikel kesehatan.
              </span>
            </span>
          </Link>
        </section>

        <section aria-labelledby="daftar-mitra" className="mt-8 border-t border-border pt-6">
          <h2 id="daftar-mitra" className="text-base font-bold text-ink">
            Mitra
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            Langsung tayang di katalog dengan masa gratis 6 bulan. Pilih jenis Anda.
          </p>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {partnerOptions.map(({ type, label, Icon }) => (
              <li key={type}>
                <Link href={`/mitra/daftar?type=${type}`} className={tileClass}>
                  <Icon className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                  <span className="font-semibold text-ink">{label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

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
