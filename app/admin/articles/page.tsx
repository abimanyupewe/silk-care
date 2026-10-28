import type { Metadata } from 'next';
import { AdminArticles } from '@/components/admin/AdminArticles';
import { adminPage, adminParam, type AdminSearchParams } from '@/lib/admin-query';

export const metadata: Metadata = {
  title: 'Manajemen Artikel — SILK Admin'
};

export default async function AdminArticlesPage({
  searchParams
}: {
  searchParams: Promise<AdminSearchParams>;
}) {
  const params = await searchParams;

  return (
    <AdminArticles
      filters={{
        q: adminParam(params, 'q'),
        status: adminParam(params, 'status'),
        deleted: adminParam(params, 'deleted'),
        page: adminPage(params)
      }}
    />
  );
}
