import { prisma } from '@/lib/db';
import { getEnum, getPagination, getString, handleRouteError, jsonError, jsonOk } from '@/lib/api';
import {
  publicArticleWhere,
  publicDoctorWhere,
  publicFacilityWhere,
  publicProductWhere
} from '@/lib/catalog';

const searchTypes = ['DOCTOR', 'FACILITY', 'ARTICLE', 'PRODUCT'] as const;

const facilityTypeLabels: Record<string, string> = {
  HOSPITAL: 'Rumah sakit',
  CLINIC: 'Klinik',
  LABORATORY: 'Laboratorium',
  PHARMACY: 'Apotek',
  PHYSIOTHERAPY: 'Fisioterapi',
  RADIOLOGY: 'Radiologi',
  FUNERAL_HOME: 'Rumah duka',
  WELLNESS: 'Wellness'
};

export async function GET(request: Request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const q = getString(searchParams, 'q', 100) ?? '';
    const typeParam = getString(searchParams, 'type', 20);
    const type = getEnum(searchParams, 'type', searchTypes);
    const limit = getPagination(searchParams, 5).limit;

    if (typeParam && !type) {
      return jsonError('type harus salah satu dari: doctor, facility, article, product.', 422);
    }

    if (q.length < 2) {
      return jsonOk([], {
        query: q,
        total: 0,
        limitPerType: limit,
        counts: { doctors: 0, facilities: 0, articles: 0, products: 0 }
      });
    }

    const shouldSearch = (value: (typeof searchTypes)[number]) => !type || type === value;

    const [doctors, facilities, articles, products] = await Promise.all([
      shouldSearch('DOCTOR')
        ? prisma.doctorProfile.findMany({
            where: {
              ...publicDoctorWhere,
              OR: [
                { specialty: { contains: q, mode: 'insensitive' } },
                { bio: { contains: q, mode: 'insensitive' } },
                { city: { contains: q, mode: 'insensitive' } },
                { user: { name: { contains: q, mode: 'insensitive' } } }
              ]
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            select: {
              id: true,
              slug: true,
              specialty: true,
              city: true,
              user: {
                select: {
                  name: true,
                  image: true
                }
              }
            }
          })
        : Promise.resolve([]),
      shouldSearch('FACILITY')
        ? prisma.facility.findMany({
            where: {
              ...publicFacilityWhere,
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } },
                { city: { contains: q, mode: 'insensitive' } }
              ]
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            select: {
              id: true,
              slug: true,
              name: true,
              type: true,
              city: true,
              user: {
                select: {
                  image: true
                }
              }
            }
          })
        : Promise.resolve([]),
      shouldSearch('ARTICLE')
        ? prisma.article.findMany({
            where: {
              ...publicArticleWhere,
              OR: [
                { title: { contains: q, mode: 'insensitive' } },
                { excerpt: { contains: q, mode: 'insensitive' } }
              ]
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            select: {
              id: true,
              slug: true,
              title: true,
              excerpt: true,
              coverImage: true
            }
          })
        : Promise.resolve([]),
      shouldSearch('PRODUCT')
        ? prisma.product.findMany({
            where: {
              ...publicProductWhere,
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } },
                { category: { contains: q, mode: 'insensitive' } }
              ]
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            select: {
              id: true,
              slug: true,
              name: true,
              image: true,
              facility: {
                select: {
                  name: true
                }
              }
            }
          })
        : Promise.resolve([])
    ]);

    const items = [
      ...doctors.map((doctor) => ({
        type: 'doctor' as const,
        id: doctor.id,
        slug: doctor.slug,
        title: doctor.user.name,
        subtitle: [doctor.specialty, doctor.city].filter(Boolean).join(' · '),
        href: `/doctor/${doctor.slug}`,
        image: doctor.user.image
      })),
      ...facilities.map((facility) => ({
        type: 'facility' as const,
        id: facility.id,
        slug: facility.slug,
        title: facility.name,
        subtitle: [facilityTypeLabels[facility.type] ?? facility.type, facility.city]
          .filter(Boolean)
          .join(' · '),
        href: '/#cari-layanan',
        image: facility.user.image
      })),
      ...articles.map((article) => ({
        type: 'article' as const,
        id: article.id,
        slug: article.slug,
        title: article.title,
        subtitle: article.excerpt ?? 'Artikel kesehatan',
        href: `/article/${article.slug}`,
        image: article.coverImage
      })),
      ...products.map((product) => ({
        type: 'product' as const,
        id: product.id,
        slug: product.slug,
        title: product.name,
        subtitle: product.facility.name,
        href: `/apotek/${product.slug}`,
        image: product.image
      }))
    ];

    return jsonOk(items, {
      query: q,
      total: items.length,
      limitPerType: limit,
      counts: {
        doctors: doctors.length,
        facilities: facilities.length,
        articles: articles.length,
        products: products.length
      }
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
