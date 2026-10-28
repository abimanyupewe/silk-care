import type { Metadata } from 'next';
import { AdminDoctors } from '@/components/admin/AdminDoctors';
import { adminPage, adminParam, type AdminSearchParams } from '@/lib/admin-query';

export const metadata: Metadata = {
  title: 'Verifikasi Dokter — SILK Admin'
};

export default async function AdminDoctorsPage({
  searchParams
}: {
  searchParams: Promise<AdminSearchParams>;
}) {
  const params = await searchParams;

  return (
    <AdminDoctors
      filters={{
        q: adminParam(params, 'q'),
        verificationStatus: adminParam(params, 'verificationStatus'),
        page: adminPage(params)
      }}
    />
  );
}
