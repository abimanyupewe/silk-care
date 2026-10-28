import type { Metadata } from 'next';
import { AdminUserDetail } from '@/components/admin/AdminUserDetail';

export const metadata: Metadata = {
  title: 'Detail Pengguna — SILK Admin'
};

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <AdminUserDetail id={id} />;
}
