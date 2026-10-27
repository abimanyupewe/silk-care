import type { Metadata } from 'next';
import { AdminUsers } from '@/components/admin/AdminUsers';
import { adminPage, adminParam, type AdminSearchParams } from '@/lib/admin-query';

export const metadata: Metadata = {
  title: 'Manajemen Pengguna — SILK Admin'
};

export default async function AdminUsersPage({
  searchParams
}: {
  searchParams: Promise<AdminSearchParams>;
}) {
  const params = await searchParams;

  return (
    <AdminUsers
      filters={{
        q: adminParam(params, 'q'),
        role: adminParam(params, 'role'),
        status: adminParam(params, 'status'),
        page: adminPage(params)
      }}
    />
  );
}
