// Kueri data beranda (server). Memakai filter dan select bersama di lib/catalog.ts, jadi aturan
// "hanya yang terverifikasi/terbit/disetujui" tidak ditulis ulang. Kegagalan database tidak boleh
// merusak beranda: bagian yang gagal mengembalikan daftar kosong dan dicatat di log.
import { prisma } from '@/lib/db';
import {
  articleListSelect,
  doctorListSelect,
  facilityListSelect,
  productSelect,
  publicArticleWhere,
  publicDoctorWhereAt,
  publicFacilityWhereAt,
  publicProductWhereAt
} from '@/lib/catalog';
import { facilityTypeLabels } from '@/lib/facility-types';
import { logError } from '@/lib/logger';
import { formatRating } from '@/lib/rating';
import { doctorScheduleSelect } from '@/lib/schedule';
import {
  toHomeArticle,
  toHomeDoctor,
  toHomeFacility,
  toHomeProduct,
  toHomeReview
} from './mappers';
import type {
  HomeArticle,
  HomeDoctor,
  HomeFacility,
  HomeProduct,
  HomeReview,
  HomeReviewSummary,
  MapPoint
} from './types';

async function safely<T>(label: string, query: () => Promise<T[]>): Promise<T[]> {
  try {
    return await query();
  } catch (error) {
    logError(`home.${label}_failed`, error);

    return [];
  }
}

// Rating tertinggi dulu; yang belum punya ulasan menyusul di belakang.
const topRated = [
  { ratingAverage: { sort: 'desc', nulls: 'last' } },
  { reviewCount: 'desc' },
  { createdAt: 'desc' }
] as const;

export function getFeaturedDoctors(limit = 6): Promise<HomeDoctor[]> {
  return safely('doctors', async () => {
    const now = new Date();
    const rows = await prisma.doctorProfile.findMany({
      where: publicDoctorWhereAt(now),
      orderBy: [...topRated],
      take: limit,
      select: {
        ...doctorListSelect,
        schedules: {
          where: { isActive: true },
          select: doctorScheduleSelect
        }
      }
    });

    return rows.map((row) => toHomeDoctor(row, now));
  });
}

export function getFeaturedFacilities(limit = 6): Promise<HomeFacility[]> {
  return safely('facilities', async () => {
    const rows = await prisma.facility.findMany({
      // Apotek punya bagian sendiri (produk), jadi tidak ikut daftar rekomendasi fasilitas.
      where: { ...publicFacilityWhereAt(new Date()), type: { not: 'PHARMACY' } },
      orderBy: [...topRated],
      take: limit,
      select: facilityListSelect
    });

    return rows.map(toHomeFacility);
  });
}

export function getFeaturedProducts(limit = 8): Promise<HomeProduct[]> {
  return safely('products', async () => {
    const rows = await prisma.product.findMany({
      where: { ...publicProductWhereAt(new Date()), stock: { gt: 0 } },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: productSelect
    });

    return rows.map(toHomeProduct);
  });
}

export function getLatestArticles(limit = 3): Promise<HomeArticle[]> {
  return safely('articles', async () => {
    const rows = await prisma.article.findMany({
      where: publicArticleWhere,
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: articleListSelect
    });

    return rows.map(toHomeArticle);
  });
}

export function getLatestReviews(limit = 6): Promise<HomeReview[]> {
  return safely('reviews', async () => {
    const rows = await prisma.review.findMany({
      where: { status: 'APPROVED', comment: { not: null } },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        author: { select: { name: true } },
        doctorProfile: { select: { user: { select: { name: true } } } },
        facility: { select: { name: true } },
        product: { select: { name: true } }
      }
    });

    return rows.flatMap((row) => {
      const review = toHomeReview(row);

      return review ? [review] : [];
    });
  });
}

// Titik-titik peta untuk beranda: dokter dan semua fasilitas (termasuk apotek) yang
// punya koordinat. Gagal = tanpa bagian peta, bukan beranda rusak.
export function getMapPoints(): Promise<MapPoint[]> {
  return safely('map_points', async () => {
    const now = new Date();
    const doctorWhere = { ...publicDoctorWhereAt(now), latitude: { not: null } };
    const facilityWhere = { ...publicFacilityWhereAt(now), latitude: { not: null } };

    const [doctors, facilities] = await Promise.all([
      prisma.doctorProfile.findMany({
        where: doctorWhere,
        orderBy: [...topRated],
        take: 30,
        select: { latitude: true, longitude: true, user: { select: { name: true } } }
      }),
      prisma.facility.findMany({
        where: facilityWhere,
        orderBy: [...topRated],
        take: 60,
        select: { latitude: true, longitude: true, name: true, type: true }
      })
    ]);

    const points: MapPoint[] = [];

    for (const row of doctors) {
      if (row.latitude != null && row.longitude != null) {
        points.push({
          lat: row.latitude,
          lng: row.longitude,
          title: row.user.name ?? 'Dokter SILK',
          kind: 'Dokter'
        });
      }
    }

    for (const row of facilities) {
      if (row.latitude != null && row.longitude != null) {
        points.push({
          lat: row.latitude,
          lng: row.longitude,
          title: row.name,
          kind: facilityTypeLabels[row.type]
        });
      }
    }

    return points;
  });
}

// Ringkasan semua ulasan yang sudah disetujui. Gagal = tanpa ringkasan, bukan angka palsu.
export async function getReviewSummary(): Promise<HomeReviewSummary> {
  try {
    const result = await prisma.review.aggregate({
      where: { status: 'APPROVED' },
      _avg: { rating: true },
      _count: { _all: true }
    });

    return { average: formatRating(result._avg.rating), count: result._count._all };
  } catch (error) {
    logError('home.review_summary_failed', error);

    return { average: null, count: 0 };
  }
}
