// Bentuk data khusus tampilan beranda. Komponen beranda hanya tahu tipe ini, bukan Prisma atau API,
// jadi sumber datanya bisa diganti tanpa menyentuh komponen.
import type { FacilityTypeValue } from '@/lib/facility-types';

export type HomeDoctor = {
  slug: string;
  name: string;
  specialty: string;
  photoUrl: string | null;
  rating: number | null;
  reviewCount: number;
  fee: number | null;
  experienceYears: number | null;
  city: string | null;
  // Rentang jam praktik hari ini (zona Jakarta), mis. "09.00 - 12.00, 13.00 - 17.00"; null = libur.
  todaySchedule: string | null;
};

export type HomeFacility = {
  slug: string;
  name: string;
  type: FacilityTypeValue;
  city: string | null;
  photoUrl: string | null;
  rating: number | null;
  reviewCount: number;
};

export type HomeProduct = {
  slug: string;
  name: string;
  price: number;
  image: string | null;
  category: string | null;
  facilityName: string;
};

export type HomeArticle = {
  slug: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  publishedAt: string;
  authorName: string | null;
};

export type HomeReview = {
  id: string;
  rating: number;
  comment: string;
  authorName: string;
  // Yang diulas: nama dokter, fasilitas, atau produk.
  targetName: string;
  createdAt: string;
};

export type HomeReviewSummary = {
  average: number | null;
  count: number;
};
