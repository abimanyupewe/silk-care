import type { Metadata } from 'next';
import { DoctorConsultations } from '@/components/doctor/DoctorConsultations';

export const metadata: Metadata = {
  title: 'Konsultasi — Panel Dokter SILK'
};

export default function DoctorConsultationsPage() {
  return <DoctorConsultations />;
}
