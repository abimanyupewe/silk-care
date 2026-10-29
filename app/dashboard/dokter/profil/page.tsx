import type { Metadata } from 'next';
import { DoctorProfileForm } from '@/components/doctor/DoctorProfileForm';

export const metadata: Metadata = {
  title: 'Profil — Panel Dokter SILK'
};

export default function Page() {
  return <DoctorProfileForm />;
}
