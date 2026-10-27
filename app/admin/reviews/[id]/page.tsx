import type { Metadata } from 'next';
import { AdminReviewDetail } from '@/components/admin/AdminReviewDetail';

export const metadata: Metadata = {
  title: 'Detail Ulasan — SILK Admin'
};

export default async function AdminReviewDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <AdminReviewDetail id={id} />;
}
