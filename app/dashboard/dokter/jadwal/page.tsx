import type { Metadata } from 'next';
import { DoctorSchedule } from '@/components/doctor/DoctorSchedule';

export const metadata: Metadata = {
  title: 'Jadwal praktik — Panel Dokter SILK'
};

export default function Page() {
  return <DoctorSchedule />;
}
