import type { Metadata } from 'next';
import { AdminBroadcast } from '@/components/admin/AdminBroadcast';

export const metadata: Metadata = {
  title: 'Broadcast Notifikasi — SILK Admin'
};

export default function AdminBroadcastPage() {
  return <AdminBroadcast />;
}
