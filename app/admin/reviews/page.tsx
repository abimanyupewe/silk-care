import type { Metadata } from 'next';
import { AdminReviews } from '@/components/admin/AdminReviews';
import { adminPage, adminParam, type AdminSearchParams } from '@/lib/admin-query';

export const metadata: Metadata = {
  title: 'Moderasi Ulasan — SILK Admin'
};

export default async function AdminReviewsPage({
  searchParams
}: {
  searchParams: Promise<AdminSearchParams>;
}) {
  const params = await searchParams;

  return (
    <AdminReviews
      filters={{
        q: adminParam(params, 'q'),
        status: adminParam(params, 'status'),
        targetType: adminParam(params, 'targetType'),
        rating: adminParam(params, 'rating'),
        isNegative: adminParam(params, 'isNegative'),
        page: adminPage(params)
      }}
    />
  );
}
