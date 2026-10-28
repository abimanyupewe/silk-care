import type { Metadata } from 'next';
import { AdminDoctorDetail } from '@/components/admin/AdminDoctorDetail';

export const metadata: Metadata = {
  title: 'Detail Dokter — SILK Admin'
};

export default async function AdminDoctorDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <AdminDoctorDetail id={id} />;
}
