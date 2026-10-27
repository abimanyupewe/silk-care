import type { Metadata } from 'next';
import { AdminFacilityDetail } from '@/components/admin/AdminFacilityDetail';

export const metadata: Metadata = {
  title: 'Detail Fasilitas — SILK Admin'
};

export default async function AdminFacilityDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <AdminFacilityDetail id={id} />;
}
