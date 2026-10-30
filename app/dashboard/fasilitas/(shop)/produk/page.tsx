import type { Metadata } from 'next';
import { FacilityProducts } from '@/components/facility/FacilityProducts';

export const metadata: Metadata = {
  title: 'Produk — Panel Fasilitas SILK'
};

export default function FacilityProductsPage() {
  return <FacilityProducts />;
}
