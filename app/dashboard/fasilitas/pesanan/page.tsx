import type { Metadata } from 'next';
import { FacilityOrders } from '@/components/facility/FacilityOrders';

export const metadata: Metadata = {
  title: 'Pesanan — Panel Fasilitas SILK'
};

export default function FacilityOrdersPage() {
  return <FacilityOrders />;
}
