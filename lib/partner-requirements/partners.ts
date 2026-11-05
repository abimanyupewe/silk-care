// DRAF: dicek silang dengan client; bukan syarat resmi.
import { facilityContactFields, locationStep, whatsappField } from './blocks';
import type { PartnerRequirement, PartnerType, RequirementField } from './types';

const bool = (key: string, label: string): RequirementField => ({
  key,
  label,
  kind: 'boolean',
  filterable: true,
  target: 'details'
});
const list = (key: string, label: string, helpText?: string): RequirementField => ({
  key,
  label,
  kind: 'list',
  helpText,
  target: 'details'
});
const choice = (
  key: string,
  label: string,
  kind: 'select' | 'multiselect',
  options: [string, string][]
): RequirementField => ({
  key,
  label,
  kind,
  options: options.map(([value, text]) => ({ value, label: text })),
  filterable: true,
  target: 'details'
});
const count = (key: string, label: string): RequirementField => ({
  key,
  label,
  kind: 'number',
  target: 'details'
});
const text = (key: string, label: string): RequirementField => ({
  key,
  label,
  kind: 'text',
  target: 'details'
});

const facility = (typeFields: RequirementField[]): PartnerRequirement => ({
  draft: true,
  steps: [
    {
      id: 'basic',
      title: 'Data dasar',
      fields: [
        { key: 'name', label: 'Nama', kind: 'text', required: true, target: 'column' },
        { key: 'description', label: 'Deskripsi', kind: 'textarea', target: 'column' },
        ...facilityContactFields
      ]
    },
    { id: 'details', title: 'Detail layanan', fields: typeFields },
    locationStep
  ]
});

export const partnerRequirements: Record<PartnerType, PartnerRequirement> = {
  HOSPITAL: facility([
    choice('hospitalClass', 'Kelas RS', 'select', [
      ['A', 'Kelas A'],
      ['B', 'Kelas B'],
      ['C', 'Kelas C'],
      ['D', 'Kelas D']
    ]),
    bool('emergency24h', 'IGD 24 jam'),
    bool('acceptsBpjs', 'Terima BPJS'),
    list('polyclinics', 'Poli tersedia'),
    count('bedCount', 'Jumlah tempat tidur')
  ]),
  CLINIC: facility([
    choice('clinicKind', 'Jenis klinik', 'select', [
      ['GENERAL', 'Klinik umum'],
      ['SPECIALIST', 'Klinik spesialis'],
      ['DENTAL', 'Klinik gigi'],
      ['BEAUTY', 'Klinik kecantikan']
    ]),
    list('mainServices', 'Layanan utama'),
    bool('acceptsBpjs', 'Terima BPJS'),
    bool('inpatient', 'Rawat inap')
  ]),
  LABORATORY: facility([
    list('examTypes', 'Jenis pemeriksaan'),
    bool('referralRequired', 'Perlu rujukan'),
    bool('homeService', 'Layanan ke rumah'),
    text('resultEstimate', 'Estimasi hasil')
  ]),
  PHARMACY: facility([
    bool('open24h', 'Buka 24 jam'),
    bool('acceptsPrescription', 'Layani resep'),
    bool('delivery', 'Layanan antar'),
    {
      key: 'pharmacistName',
      label: 'Nama apoteker penanggung jawab',
      kind: 'text',
      target: 'internal'
    }
  ]),
  PHYSIOTHERAPY: facility([
    list('therapyAreas', 'Bidang terapi'),
    bool('homeVisit', 'Kunjungan ke rumah'),
    bool('referralRequired', 'Perlu rujukan')
  ]),
  RADIOLOGY: facility([
    choice('modalities', 'Modalitas', 'multiselect', [
      ['XRAY', 'Rontgen'],
      ['ULTRASOUND', 'USG'],
      ['CT_SCAN', 'CT scan'],
      ['MRI', 'MRI'],
      ['MAMMOGRAPHY', 'Mammografi']
    ]),
    bool('referralRequired', 'Perlu rujukan'),
    text('resultEstimate', 'Estimasi hasil')
  ]),
  FUNERAL_HOME: facility([
    choice('funeralServices', 'Layanan', 'multiselect', [
      ['EMBALMING', 'Pemulasaraan'],
      ['COFFIN', 'Peti'],
      ['TRANSPORT', 'Transportasi jenazah'],
      ['CREMATION', 'Kremasi']
    ]),
    bool('open24h', 'Layanan 24 jam'),
    count('roomCapacity', 'Kapasitas ruang')
  ]),
  WELLNESS: facility([
    list('serviceCategories', 'Kategori layanan'),
    bool('reservationRequired', 'Wajib reservasi')
  ]),
  MASSAGE: facility([
    list('massageTypes', 'Jenis pijat'),
    choice('therapistGender', 'Terapis tersedia', 'multiselect', [
      ['MALE', 'Pria'],
      ['FEMALE', 'Wanita']
    ]),
    bool('homeService', 'Layanan ke rumah'),
    bool('reservationRequired', 'Wajib reservasi')
  ]),
  AMBULANCE: facility([
    choice('fleetTypes', 'Jenis armada', 'multiselect', [
      ['TRANSPORT', 'Transport'],
      ['EMERGENCY', 'Gawat darurat'],
      ['MORTUARY', 'Jenazah']
    ]),
    bool('open24h', 'Layanan 24 jam'),
    { key: 'emergencyPhone', label: 'Nomor darurat', kind: 'phone', target: 'details' },
    list('serviceAreas', 'Area layanan'),
    count('fleetSize', 'Jumlah armada')
  ]),
  DOCTOR: {
    draft: true,
    steps: [
      {
        id: 'basic',
        title: 'Data dasar',
        fields: [
          {
            key: 'specialty',
            label: 'Spesialisasi',
            kind: 'text',
            required: true,
            target: 'column'
          },
          { key: 'bio', label: 'Bio', kind: 'textarea', target: 'column' },
          {
            key: 'experienceYears',
            label: 'Lama pengalaman (tahun)',
            kind: 'number',
            target: 'column'
          },
          { key: 'phone', label: 'Telepon', kind: 'phone', target: 'details' },
          whatsappField
        ]
      },
      {
        id: 'details',
        title: 'Detail dokter',
        fields: [
          text('title', 'Gelar'),
          list('practicePlaces', 'Tempat praktik'),
          list('education', 'Pendidikan'),
          list('languages', 'Bahasa'),
          {
            key: 'strNumber',
            label: 'Nomor STR',
            kind: 'text',
            helpText: 'Hanya dilihat admin, tidak ditampilkan ke publik.',
            target: 'internal'
          }
        ]
      },
      locationStep
    ]
  }
};
