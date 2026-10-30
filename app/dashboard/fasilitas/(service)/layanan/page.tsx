import type { Metadata } from 'next';
import { FacilityServices } from '@/components/facility/FacilityServices';

export const metadata: Metadata = {
  title: 'Layanan — Panel Fasilitas SILK'
};

export default function FacilityServicesPage() {
  return <FacilityServices />;
}
