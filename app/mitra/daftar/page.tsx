import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Stethoscope } from 'lucide-react';
import { PartnerRegisterForm } from '@/components/partner/PartnerRegisterForm';
import { facilityTypeIcons } from '@/components/shared/PartnerMenu';
import { getActiveSession } from '@/lib/auth-guard';
import { facilityTypeLabels, facilityTypes } from '@/lib/facility-types';
import { isPartnerType } from '@/lib/partner-requirements/types';
import { panelHomeForRole } from '@/lib/roles';

export const metadata: Metadata = {
  title: 'Daftar mitra — SILK',
  description: 'Daftarkan dokter, apotek, klinik, atau fasilitas kesehatan Anda di SILK.'
};

export default async function PartnerSignUpPage({
  searchParams
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const session = await getActiveSession();
  const { type } = await searchParams;
  // Nilai di luar daftar tipe diabaikan; pengguna memilih sendiri di formulir.
  const lockedType = isPartnerType(type) ? type : undefined;
  const label = lockedType
    ? (lockedType === 'DOCTOR' ? 'Dokter' : facilityTypeLabels[lockedType]).toLowerCase()
    : null;

  // Peran selain pasien sudah punya panel sendiri.
  if (session && session.user.role !== 'PATIENT') {
    redirect(panelHomeForRole(session.user.role));
  }

  if (!lockedType) {
    const options = [
      { type: 'DOCTOR', label: 'Dokter', Icon: Stethoscope },
      ...facilityTypes.map((facilityType) => ({
        type: facilityType,
        label: facilityTypeLabels[facilityType],
        Icon: facilityTypeIcons[facilityType]
      }))
    ];

    return (
      <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col justify-center px-4 py-12">
        <div className="border border-border bg-white p-6 md:p-8">
          <p className="text-sm font-semibold text-primary-hover">SILK untuk mitra</p>
          <h1 className="mt-2 text-2xl font-bold text-ink md:text-[32px]">
            Daftarkan layanan Anda
          </h1>
          <p className="mt-2 max-w-2xl text-base text-ink-muted">
            Pilih jenis layanan terlebih dahulu. Mitra baru mendapat masa gratis 6 bulan tanpa kartu
            kredit.
          </p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {options.map(({ type, label: optionLabel, Icon }) => (
              <li key={type}>
                <Link
                  href={`/mitra/daftar?type=${type}`}
                  className="flex min-h-24 items-center gap-3 border border-border bg-white p-4 text-base font-semibold text-ink hover:border-primary hover:bg-primary-tint focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  <Icon className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                  {optionLabel}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-ink-muted">
            Sudah punya akun?{' '}
            <Link href="/login" className="font-semibold text-primary-hover underline">
              Masuk
            </Link>
            {' · '}
            <Link href="/mitra/harga" className="font-semibold text-primary-hover underline">
              Lihat harga langganan
            </Link>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-4 py-12">
      <div className="relative border border-border bg-white p-6 md:p-8">
        <p className="text-sm font-semibold text-primary-hover">SILK</p>
        <h1 className="mt-2 text-2xl font-bold text-ink">
          {label ? `Daftar sebagai mitra ${label}` : 'Daftar sebagai mitra'}
        </h1>
        <p className="mt-2 text-ink-muted">
          {session ? 'Lengkapi data mitra Anda. ' : 'Buat akun dan lengkapi data mitra Anda. '}
          Langsung tayang di katalog dengan masa gratis 6 bulan.
        </p>
        <p className="mt-2 text-sm text-ink-muted">
          Lihat{' '}
          <Link href="/mitra/harga" className="font-semibold text-primary-hover underline">
            paket dan harga langganan
          </Link>{' '}
          — perpanjangan setelah masa gratis via Duitku.
        </p>

        <div className="mt-6">
          <PartnerRegisterForm withAccount={!session} lockedType={lockedType} />
        </div>

        {session ? null : (
          <p className="mt-6 text-sm text-ink-muted">
            Sudah punya akun?{' '}
            <Link href="/login" className="font-semibold text-primary-hover underline">
              Masuk
            </Link>
          </p>
        )}
      </div>
    </main>
  );
}
