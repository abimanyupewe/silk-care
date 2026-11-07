// Tipe dan label pencarian publik; datanya dari GET /api/v1/search (bukan indeks statis lagi).
export type SearchItemType = 'doctor' | 'facility' | 'product' | 'article';

export type SearchItem = {
  type: SearchItemType;
  id: string;
  title: string;
  subtitle: string;
  href: string;
};

export const searchGroupOrder: SearchItemType[] = ['doctor', 'facility', 'product', 'article'];

export const searchGroupLabels: Record<SearchItemType, string> = {
  doctor: 'Dokter',
  facility: 'Fasilitas',
  product: 'Apotek',
  article: 'Artikel'
};

export const popularSearchQueries = ['Spesialis anak', 'Klinik', 'Apotek', 'Kesehatan mental'];
