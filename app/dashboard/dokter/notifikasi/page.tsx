import type { Metadata } from 'next';
import { DoctorNotifications } from '@/components/doctor/DoctorNotifications';

export const metadata: Metadata = {
  title: 'Notifikasi — Panel Dokter SILK'
};

export default function DoctorNotificationsPage() {
  return <DoctorNotifications />;
}
