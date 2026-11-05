import type { Metadata } from 'next';
import { LanggananPanel } from '@/components/panel/LanggananPanel';

export const metadata: Metadata = {
  title: 'Langganan — Panel Dokter SILK'
};

export default function DoctorLanggananPage() {
  return <LanggananPanel eyebrow="Panel dokter" />;
}
