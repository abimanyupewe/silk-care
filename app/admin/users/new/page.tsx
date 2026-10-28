import type { Metadata } from 'next';
import { AdminUserCreate } from '@/components/admin/AdminUserCreate';

export const metadata: Metadata = { title: 'Buat Pengguna — SILK Admin' };

export default function AdminUserCreatePage() {
  return <AdminUserCreate />;
}
