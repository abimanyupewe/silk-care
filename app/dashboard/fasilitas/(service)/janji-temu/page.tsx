import type { Metadata } from 'next';
import { FacilityAppointments } from '@/components/facility/FacilityAppointments';

export const metadata: Metadata = {
  title: 'Janji temu — Panel Fasilitas SILK'
};

export default function FacilityAppointmentsPage() {
  return <FacilityAppointments />;
}
