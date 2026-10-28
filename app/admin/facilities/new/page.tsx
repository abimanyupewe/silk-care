import type { Metadata } from 'next';
import { AdminFacilityCreate } from '@/components/admin/AdminFacilityCreate';

export const metadata: Metadata = { title: 'Buat Fasilitas — SILK Admin' };

export default function AdminFacilityCreatePage() {
  return <AdminFacilityCreate />;
}
