import type { Metadata } from 'next';
import { FacilityDashboard } from '@/components/facility/FacilityDashboard';

export const metadata: Metadata = {
  title: 'Ringkasan — Panel Fasilitas SILK'
};

export default function FacilityDashboardPage() {
  return <FacilityDashboard />;
}
