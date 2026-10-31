import type { Metadata } from 'next';
import { FacilityDirectory } from '@/components/features/fasilitas/FacilityDirectory';
import { FacilityTypeChips } from '@/components/features/fasilitas/FacilityTypeChips';
import { Footer } from '@/components/shared/Footer';
import { Navbar } from '@/components/shared/Navbar';
import { facilityTypes } from '@/lib/facility-types';

export const metadata: Metadata = {
  title: 'Fasilitas kesehatan — SILK',
  description: 'Temukan apotek, klinik, laboratorium, dan fasilitas kesehatan mitra SILK.'
};

export default async function FacilitiesPage({
  searchParams
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  // Nilai type yang tidak dikenal diabaikan (tampil semua), bukan error.
  const active = facilityTypes.find((value) => value === type);

  return (
    <div>
      <Navbar />
      <main className="container mx-auto max-w-7xl px-4 py-10">
        <h1 className="text-3xl font-bold text-ink">Fasilitas kesehatan</h1>
        <p className="mt-2 text-ink-muted">
          Fasilitas kesehatan mitra SILK. Pilih jenis untuk menyaring.
        </p>
        <div className="mt-6">
          <FacilityTypeChips active={active} />
        </div>
        <div className="mt-6">
          <FacilityDirectory key={active ?? 'all'} type={active} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
