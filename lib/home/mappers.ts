// Pemetaan baris database ke tipe tampilan beranda. Murni (tanpa Prisma/server) supaya mudah diuji.
import { getJakartaSchedulePosition } from '@/lib/consultation';
import { formatRating } from '@/lib/rating';
import type { FacilityTypeValue } from '@/lib/facility-types';
import type { HomeArticle, HomeDoctor, HomeFacility, HomeProduct, HomeReview } from './types';

type ScheduleRow = { dayOfWeek: number; startTime: string; endTime: string };

const clock = (value: string) => value.replace(':', '.');

// Jam praktik hari ini dalam zona Jakarta; null bila hari ini tidak ada jadwal.
export function todayScheduleLabel(schedules: ScheduleRow[], now = new Date()) {
  const today = getJakartaSchedulePosition(now).dayOfWeek;
  const ranges = schedules
    .filter((schedule) => schedule.dayOfWeek === today)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
    .map((schedule) => `${clock(schedule.startTime)} - ${clock(schedule.endTime)}`);

  return ranges.length > 0 ? ranges.join(', ') : null;
}

export function toHomeDoctor(
  row: {
    slug: string;
    specialty: string;
    photoUrl: string | null;
    ratingAverage: number | null;
    reviewCount: number;
    consultationFee: number | null;
    experienceYears: number | null;
    city: string | null;
    user: { name: string | null; image: string | null };
    schedules: ScheduleRow[];
  },
  now = new Date()
): HomeDoctor {
  return {
    slug: row.slug,
    name: row.user.name ?? 'Dokter SILK',
    specialty: row.specialty,
    photoUrl: row.photoUrl ?? row.user.image,
    rating: formatRating(row.ratingAverage),
    reviewCount: row.reviewCount,
    fee: row.consultationFee,
    experienceYears: row.experienceYears,
    city: row.city,
    todaySchedule: todayScheduleLabel(row.schedules, now)
  };
}

export function toHomeFacility(row: {
  slug: string;
  name: string;
  type: FacilityTypeValue;
  city: string | null;
  photoUrl: string | null;
  user: { image: string | null };
  ratingAverage: number | null;
  reviewCount: number;
}): HomeFacility {
  return {
    slug: row.slug,
    name: row.name,
    type: row.type,
    city: row.city,
    photoUrl: row.photoUrl ?? row.user.image,
    rating: formatRating(row.ratingAverage),
    reviewCount: row.reviewCount
  };
}

export function toHomeProduct(row: {
  slug: string;
  name: string;
  price: number;
  image: string | null;
  category: string | null;
  facility: { name: string };
}): HomeProduct {
  return {
    slug: row.slug,
    name: row.name,
    price: row.price,
    image: row.image,
    category: row.category,
    facilityName: row.facility.name
  };
}

export function toHomeArticle(row: {
  slug: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  createdAt: Date;
  author: { name: string | null };
}): HomeArticle {
  return {
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    coverImage: row.coverImage,
    publishedAt: row.createdAt.toISOString(),
    authorName: row.author.name
  };
}

export function toHomeReview(row: {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  author: { name: string | null };
  doctorProfile: { user: { name: string | null } } | null;
  facility: { name: string } | null;
  product: { name: string } | null;
}): HomeReview | null {
  // Ulasan tanpa komentar tidak berguna di beranda.
  if (!row.comment) return null;

  return {
    id: row.id,
    rating: row.rating,
    comment: row.comment,
    authorName: row.author.name ?? 'Pengguna SILK',
    targetName:
      row.doctorProfile?.user.name ?? row.facility?.name ?? row.product?.name ?? 'Layanan SILK',
    createdAt: row.createdAt.toISOString()
  };
}
