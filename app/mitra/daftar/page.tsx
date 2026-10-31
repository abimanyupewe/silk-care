import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { PartnerRegisterForm } from '@/components/partner/PartnerRegisterForm';
import { getActiveSession } from '@/lib/auth-guard';
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

  // Peran selain pasien sudah punya panel sendiri.
  if (session && session.user.role !== 'PATIENT') {
    redirect(panelHomeForRole(session.user.role));
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-4 py-12">
      <div className="border border-border bg-white p-6 md:p-8">
        <p className="text-sm font-semibold text-primary-hover">SILK</p>
        <h1 className="mt-2 text-2xl font-bold text-ink">Daftar sebagai mitra</h1>
        <p className="mt-2 text-ink-muted">
          {session ? 'Lengkapi data mitra Anda. ' : 'Buat akun dan lengkapi data mitra Anda. '}
          Langsung tayang di katalog dengan masa gratis 6 bulan.
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
