import type { RequirementField, RequirementStep } from './types';

// Akun (nama, email, password) bukan bagian registry: form pendaftaran yang memilikinya.
export const whatsappField: RequirementField = {
  key: 'whatsapp',
  label: 'WhatsApp',
  kind: 'phone',
  target: 'details'
};

export const facilityContactFields: RequirementField[] = [
  { key: 'phone', label: 'Telepon', kind: 'phone', target: 'column' },
  whatsappField,
  { key: 'website', label: 'Website', kind: 'url', target: 'details' },
  {
    key: 'licenseNumber',
    label: 'Nomor izin usaha',
    kind: 'text',
    helpText: 'Hanya dilihat admin, tidak ditampilkan ke publik.',
    target: 'internal'
  }
];

export const locationStep: RequirementStep = {
  id: 'location',
  title: 'Lokasi',
  fields: [
    { key: 'city', label: 'Kota', kind: 'text', required: true, target: 'column' },
    { key: 'address', label: 'Alamat', kind: 'textarea', required: true, target: 'column' },
    { key: 'latitude', label: 'Lintang', kind: 'number', required: true, target: 'column' },
    { key: 'longitude', label: 'Bujur', kind: 'number', required: true, target: 'column' }
  ]
};
