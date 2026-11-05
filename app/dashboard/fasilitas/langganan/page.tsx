import type { Metadata } from 'next';
import { LanggananPanel } from '@/components/panel/LanggananPanel';

export const metadata: Metadata = {
  title: 'Langganan — Panel Fasilitas SILK'
};

export default function FacilityLanggananPage() {
  return <LanggananPanel eyebrow="Panel fasilitas" />;
}
