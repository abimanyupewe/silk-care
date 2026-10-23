export type SearchItemType = 'doctor' | 'service' | 'product' | 'article';

export type SearchItem = {
  type: SearchItemType;
  title: string;
  subtitle: string;
  href: string;
  keywords?: string[];
};

export const searchIndex: SearchItem[] = [
  {
    type: 'doctor',
    title: 'dr. Clara Anindita',
    subtitle: 'Dokter umum',
    href: '/doctor',
    keywords: ['umum', 'clara', 'jadwal']
  },
  {
    type: 'doctor',
    title: 'dr. Klarisa Putri',
    subtitle: 'Spesialis kulit',
    href: '/doctor',
    keywords: ['kulit', 'dermatologi']
  },
  {
    type: 'doctor',
    title: 'dr. Thomas Wijaya',
    subtitle: 'Spesialis penyakit dalam',
    href: '/doctor',
    keywords: ['penyakit dalam', 'internis']
  },
  {
    type: 'doctor',
    title: 'dr. Santika Dewi',
    subtitle: 'Spesialis anak',
    href: '/doctor',
    keywords: ['anak', 'pediatri']
  },
  {
    type: 'doctor',
    title: 'dr. Ambri Nugraha',
    subtitle: 'Spesialis mata',
    href: '/doctor',
    keywords: ['mata', 'oftalmologi']
  },
  {
    type: 'doctor',
    title: 'dr. Angline Sari',
    subtitle: 'Spesialis kandungan',
    href: '/doctor',
    keywords: ['kandungan', 'obgyn']
  },
  {
    type: 'service',
    title: 'Klinik & rumah sakit',
    subtitle: 'Bandingkan fasilitas dan jadwal layanan',
    href: '/#cari-layanan',
    keywords: ['klinik', 'rumah sakit', 'fasilitas']
  },
  {
    type: 'service',
    title: 'Laboratorium',
    subtitle: 'Temukan pemeriksaan penunjang terdekat',
    href: '/#cari-layanan',
    keywords: ['lab', 'tes darah', 'pemeriksaan']
  },
  {
    type: 'service',
    title: 'Konsultasi spesialis',
    subtitle: 'Pilih bidang konsultasi sesuai kebutuhan',
    href: '/#cari-layanan',
    keywords: ['konsultasi', 'spesialis', 'dokter']
  },
  {
    type: 'service',
    title: 'Layanan kesehatan lain',
    subtitle: 'Cari layanan kesehatan di sekitar Anda',
    href: '/#cari-layanan',
    keywords: ['fisioterapi', 'homecare', 'layanan']
  },
  {
    type: 'product',
    title: 'Vitamin harian untuk keluarga',
    subtitle: 'Aposilk',
    href: '/apotek',
    keywords: ['vitamin', 'suplemen']
  },
  {
    type: 'product',
    title: 'Susu nutrisi ibu dan anak',
    subtitle: 'Aposilk',
    href: '/apotek',
    keywords: ['susu', 'nutrisi', 'ibu', 'anak']
  },
  {
    type: 'product',
    title: 'Perawatan kulit sensitif',
    subtitle: 'Aposilk',
    href: '/apotek',
    keywords: ['kulit', 'perawatan', 'sensitif']
  },
  {
    type: 'product',
    title: 'Tensimeter digital',
    subtitle: 'SilkShop',
    href: '/apotek',
    keywords: ['tensi', 'darah', 'alkes']
  },
  {
    type: 'product',
    title: 'Termometer digital',
    subtitle: 'SilkShop',
    href: '/apotek',
    keywords: ['termometer', 'suhu', 'demam']
  },
  {
    type: 'article',
    title: 'Kelelahan Berlebihan Meski Sudah Tidur',
    subtitle: 'Artikel kesehatan',
    href: '/article',
    keywords: ['lelah', 'tidur', 'energi']
  },
  {
    type: 'article',
    title: 'Tips Menjaga Kesehatan Mental di Era Digital',
    subtitle: 'Artikel kesehatan',
    href: '/article',
    keywords: ['mental', 'stres', 'digital']
  },
  {
    type: 'article',
    title: 'Pentingnya Sarapan Pagi untuk Produktivitas',
    subtitle: 'Artikel kesehatan',
    href: '/article',
    keywords: ['sarapan', 'makan', 'produktivitas']
  }
];

export function searchItems(query: string): SearchItem[] {
  const normalized = query.trim().toLowerCase();

  if (normalized.length < 2) return [];

  return searchIndex
    .map((item) => {
      const title = item.title.toLowerCase();
      const haystack = [item.title, item.subtitle, ...(item.keywords ?? [])]
        .join(' ')
        .toLowerCase();
      const score = title.startsWith(normalized)
        ? 2
        : title.includes(normalized)
          ? 1
          : haystack.includes(normalized)
            ? 0
            : -1;

      return { item, score };
    })
    .filter(({ score }) => score >= 0)
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item);
}
