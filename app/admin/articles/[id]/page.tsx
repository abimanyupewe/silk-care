import type { Metadata } from 'next';
import { AdminArticleDetail } from '@/components/admin/AdminArticleDetail';

export const metadata: Metadata = {
  title: 'Detail Artikel — SILK Admin'
};

export default async function AdminArticleDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <AdminArticleDetail id={id} />;
}
