import type { Metadata } from 'next';
import { FacilityReviews } from '@/components/facility/FacilityReviews';

export const metadata: Metadata = {
  title: 'Ulasan — Panel Fasilitas SILK'
};

export default function FacilityReviewsPage() {
  return <FacilityReviews />;
}
