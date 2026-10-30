import type { Metadata } from 'next';
import { AdminAnnouncements } from '@/components/admin/AdminAnnouncements';

export const metadata: Metadata = {
  title: 'Banner Informasi — SILK Admin'
};

export default function AdminAnnouncementsPage() {
  return <AdminAnnouncements />;
}
