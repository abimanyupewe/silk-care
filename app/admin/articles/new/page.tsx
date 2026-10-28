import type { Metadata } from 'next';
import { AdminArticleCreate } from '@/components/admin/AdminArticleCreate';

export const metadata: Metadata = { title: 'Buat Artikel — SILK Admin' };

export default function AdminArticleCreatePage() {
  return <AdminArticleCreate />;
}
