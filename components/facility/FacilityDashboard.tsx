'use client';

import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminDetailSkeleton } from '@/components/admin/AdminSkeleton';
import { AdminErrorState } from '@/components/admin/AdminState';
import { VerificationBanner } from '@/components/panel/VerificationBanner';
import { useApiQuery } from '@/lib/api-swr';

type FacilityProfile = {
  name: string;
  type: string;
  city: string | null;
  verificationStatus: string;
};

export function FacilityDashboard() {
  const {
    data: facility,
    loading,
    error,
    reload
  } = useApiQuery<FacilityProfile>('/facility/profile', 60000);

  if (loading && !facility) return <AdminDetailSkeleton />;
  if (error) return <AdminErrorState message={error} onRetry={reload} />;
  if (!facility) return null;

  return (
    <div>
      <AdminPageHeader
        eyebrow="Panel fasilitas"
        title={facility.name}
        description="Ringkasan fasilitas Anda. Fitur pengelolaan produk dan pesanan menyusul."
      />
      <div className="mt-6">
        <VerificationBanner status={facility.verificationStatus} />
      </div>
    </div>
  );
}
