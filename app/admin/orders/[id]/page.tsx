import type { Metadata } from 'next';
import { AdminOrderDetail } from '@/components/admin/AdminOrderDetail';

export const metadata: Metadata = {
  title: 'Detail Pesanan — SILK Admin'
};

export default async function AdminOrderDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <AdminOrderDetail id={id} />;
}
