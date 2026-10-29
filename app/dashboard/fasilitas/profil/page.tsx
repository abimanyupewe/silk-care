import type { Metadata } from 'next';
import { FacilityProfileForm } from '@/components/facility/FacilityProfileForm';

export const metadata: Metadata = {
  title: 'Profil — Panel Fasilitas SILK'
};

export default function FacilityProfilePage() {
  return <FacilityProfileForm />;
}
