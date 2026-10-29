import type { Metadata } from 'next';
import { AdminSystem } from '@/components/admin/AdminSystem';

export const metadata: Metadata = {
  title: 'Status Sistem — SILK Admin'
};

export default function AdminSystemPage() {
  return <AdminSystem />;
}
