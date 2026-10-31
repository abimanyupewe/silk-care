import { redirect } from 'next/navigation';
import { isPartnerType } from '@/lib/partner-requirements/types';

// Tautan lama; pendaftaran mitra sekarang satu form di /mitra/daftar.
export default async function FacilityRegisterPage({
  searchParams
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;

  redirect('/mitra/daftar' + (isPartnerType(type) ? `?type=${type}` : ''));
}
