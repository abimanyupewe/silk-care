import type { Metadata } from 'next';
import { DoctorArticles } from '@/components/doctor/DoctorArticles';

export const metadata: Metadata = {
  title: 'Artikel — Panel Dokter SILK'
};

export default function DoctorArticlesPage() {
  return <DoctorArticles />;
}
