// Isi footer sebagai data: menambah atau mengubah tautan tidak menyentuh markup Footer.
import { facilityTypeLabels, type FacilityTypeValue } from '@/lib/facility-types';

export type FooterLink = { label: string; href: string };

const facilityLink = (type: FacilityTypeValue): FooterLink => ({
  label: facilityTypeLabels[type],
  href: `/fasilitas?type=${type}`
});

const partnerLink = (type: FacilityTypeValue): FooterLink => ({
  label: `Daftar sebagai ${facilityTypeLabels[type].toLowerCase()}`,
  href: `/mitra/daftar?type=${type}`
});

export const exploreLinks: FooterLink[] = [
  { label: 'Dokter', href: '/doctor' },
  { label: 'Apotek', href: '/apotek' },
  { label: 'Artikel kesehatan', href: '/article' },
  { label: 'Semua fasilitas', href: '/fasilitas' },
  facilityLink('HOSPITAL'),
  facilityLink('CLINIC'),
  facilityLink('LABORATORY')
];

export const collaborationLinks: FooterLink[] = [
  { label: 'Daftar sebagai dokter', href: '/mitra/daftar?type=DOCTOR' },
  partnerLink('CLINIC'),
  partnerLink('PHARMACY'),
  { label: 'Daftar fasilitas lainnya', href: '/daftar' }
];

export const legalLinks: FooterLink[] = [
  { label: 'Kebijakan privasi', href: '/kebijakan-privasi' },
  { label: 'Syarat dan ketentuan', href: '/syarat-ketentuan' }
];

export const contact = {
  address: 'Malang, Jawa Timur',
  email: 'info@silkhealth.id',
  phone: '(0341) 1234-5678'
};
