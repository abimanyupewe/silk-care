// Tanpa impor server (db/prisma) supaya aman dipakai komponen klien maupun route API.
export const facilityTypes = [
  'HOSPITAL',
  'CLINIC',
  'LABORATORY',
  'PHARMACY',
  'PHYSIOTHERAPY',
  'RADIOLOGY',
  'FUNERAL_HOME',
  'WELLNESS',
  'MASSAGE',
  'AMBULANCE'
] as const;

export type FacilityTypeValue = (typeof facilityTypes)[number];

// Nilai di luar daftar (mis. dari query string) menghasilkan undefined, bukan error.
export function parseFacilityType(value: string | null | undefined) {
  return facilityTypes.find((type) => type === value);
}

// Hanya apotek yang berjualan produk dan menerima pesanan. PHARMACY juga nama role pemilik,
// jadi satu fungsi ini berlaku untuk tipe fasilitas maupun role.
export function isShopFacility(typeOrRole: string | null | undefined) {
  return typeOrRole === 'PHARMACY';
}

// Semua tipe/role fasilitas selain apotek: katalog layanan dan janji temu. Role FACILITY ikut.
export function isServiceFacility(typeOrRole: string | null | undefined) {
  return Boolean(typeOrRole) && !isShopFacility(typeOrRole);
}

// Record penuh: menambah tipe di atas tanpa label akan gagal typecheck.
export const facilityTypeLabels: Record<FacilityTypeValue, string> = {
  HOSPITAL: 'Rumah sakit',
  CLINIC: 'Klinik',
  LABORATORY: 'Laboratorium',
  PHARMACY: 'Apotek',
  PHYSIOTHERAPY: 'Fisioterapi',
  RADIOLOGY: 'Radiologi',
  FUNERAL_HOME: 'Rumah duka',
  WELLNESS: 'Wellness',
  MASSAGE: 'Pijat',
  AMBULANCE: 'Ambulans'
};
