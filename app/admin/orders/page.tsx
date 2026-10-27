import type { Metadata } from 'next';
import { AdminOrders } from '@/components/admin/AdminOrders';
import { adminPage, adminParam, type AdminSearchParams } from '@/lib/admin-query';

export const metadata: Metadata = {
  title: 'Manajemen Pesanan — SILK Admin'
};

export default async function AdminOrdersPage({
  searchParams
}: {
  searchParams: Promise<AdminSearchParams>;
}) {
  const params = await searchParams;

  return (
    <AdminOrders
      filters={{
        status: adminParam(params, 'status'),
        paymentStatus: adminParam(params, 'paymentStatus'),
        page: adminPage(params)
      }}
    />
  );
}
