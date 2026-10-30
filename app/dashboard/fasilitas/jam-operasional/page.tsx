import type { Metadata } from 'next';
import { FacilityHours } from '@/components/facility/FacilityHours';

export const metadata: Metadata = {
  title: 'Jam operasional — Panel Fasilitas SILK'
};

export default function FacilityHoursPage() {
  return <FacilityHours />;
}
