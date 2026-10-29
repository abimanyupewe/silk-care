import type { Metadata } from 'next';
import { DoctorDashboard } from '@/components/doctor/DoctorDashboard';

export const metadata: Metadata = {
  title: 'Ringkasan — Panel Dokter SILK'
};

export default function DoctorDashboardPage() {
  return <DoctorDashboard />;
}
