import type { Metadata } from 'next';
import { AdminFacilities } from '@/components/admin/AdminFacilities';
import { adminPage, adminParam, type AdminSearchParams } from '@/lib/admin-query';

export const metadata: Metadata = {
  title: 'Verifikasi Fasilitas — SILK Admin'
};

export default async function AdminFacilitiesPage({
  searchParams
}: {
  searchParams: Promise<AdminSearchParams>;
}) {
  const params = await searchParams;

  return (
    <AdminFacilities
      filters={{
        q: adminParam(params, 'q'),
        verificationStatus: adminParam(params, 'verificationStatus'),
        type: adminParam(params, 'type'),
        page: adminPage(params)
      }}
    />
  );
}
