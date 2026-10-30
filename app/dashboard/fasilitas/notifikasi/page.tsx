import type { Metadata } from 'next';
import { DoctorNotifications } from '@/components/doctor/DoctorNotifications';

export const metadata: Metadata = {
  title: 'Notifikasi — Panel Fasilitas SILK'
};

export default function FacilityNotificationsPage() {
  return (
    <DoctorNotifications
      eyebrow="Panel fasilitas"
      description="Pesanan baru, perubahan pembayaran, dan ulasan untuk fasilitas Anda."
      links={{
        ORDER: { href: '/dashboard/fasilitas/pesanan', label: 'Lihat pesanan' },
        APPOINTMENT: { href: '/dashboard/fasilitas/janji-temu', label: 'Lihat janji temu' }
      }}
    />
  );
}
