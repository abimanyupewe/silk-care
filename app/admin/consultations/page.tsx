import type { Metadata } from 'next';
import { AdminConsultations } from '@/components/admin/AdminConsultations';
import { adminPage, adminParam, type AdminSearchParams } from '@/lib/admin-query';

export const metadata: Metadata = {
  title: 'Konsultasi — SILK Admin'
};

export default async function AdminConsultationsPage({
  searchParams
}: {
  searchParams: Promise<AdminSearchParams>;
}) {
  const params = await searchParams;

  return (
    <AdminConsultations
      filters={{
        q: adminParam(params, 'q'),
        status: adminParam(params, 'status'),
        stale: adminParam(params, 'stale'),
        page: adminPage(params)
      }}
    />
  );
}
