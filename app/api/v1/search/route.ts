import type { Prisma } from '@/lib/generated/prisma';
import { prisma } from '@/lib/db';
import { getEnum, getPagination, getString, handleRouteError, jsonError, jsonOk } from '@/lib/api';
import {
  doctorAvailabilityWhere,
  facilityAvailabilityWhere,
  parseAvailabilityFilter
} from '@/lib/availability';
import {
  publicArticleWhere,
  publicDoctorWhereAt,
  publicFacilityWhereAt,
  publicProductWhereAt
} from '@/lib/catalog';
import { formatDistanceKm, geoBoundingBox, haversineKm, parseGeoFilter } from '@/lib/geo';
import { transactionsEnabled } from '@/lib/features';
import { facilityTypeLabels } from '@/lib/facility-types';
import { formatRating, parseMinRating } from '@/lib/rating';

const searchTypes = ['DOCTOR', 'FACILITY', 'ARTICLE', 'PRODUCT'] as const;

function distanceForLocation(
  location: { latitude: number | null; longitude: number | null },
  origin: { latitude: number; longitude: number }
) {
  if (location.latitude === null || location.longitude === null) {
    return null;
  }

  return haversineKm(origin, {
    latitude: location.latitude,
    longitude: location.longitude
  });
}

export async function GET(request: Request) {
  try {
    const now = new Date();
    const searchParams = new URL(request.url).searchParams;
    const q = getString(searchParams, 'q', 100) ?? '';
    const typeParam = getString(searchParams, 'type', 20);
    const type = getEnum(searchParams, 'type', searchTypes);
    const limit = getPagination(searchParams, 5).limit;
    const minRating = parseMinRating(searchParams);
    const geo = parseGeoFilter(searchParams);
    const availability = parseAvailabilityFilter(searchParams);

    if (typeParam && !type) {
      return jsonError('type harus salah satu dari: doctor, facility, article, product.', 422);
    }

    if (minRating.error) {
      return jsonError(minRating.error, 422);
    }

    if (!geo.ok) {
      return jsonError(geo.error, 422);
    }

    if (!availability.ok) {
      return jsonError(availability.error, 422);
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
    const doctorWhere: Prisma.DoctorProfileWhereInput = {
      ...publicDoctorWhereAt(now),
      OR: [
        { specialty: { contains: q, mode: 'insensitive' } },
        { bio: { contains: q, mode: 'insensitive' } },
        { city: { contains: q, mode: 'insensitive' } },
        { user: { name: { contains: q, mode: 'insensitive' } } }
      ]
    };
    const facilityWhere: Prisma.FacilityWhereInput = {
      ...publicFacilityWhereAt(now),
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { city: { contains: q, mode: 'insensitive' } }
      ]
    };

    if (minRating.value !== undefined) {
      doctorWhere.ratingAverage = { gte: minRating.value };
      facilityWhere.ratingAverage = { gte: minRating.value };
    }

    if (availability.filter) {
      doctorWhere.schedules = doctorAvailabilityWhere(availability.filter);
      facilityWhere.operatingHours = facilityAvailabilityWhere(availability.filter);
    }

    const geoFilter = geo.filter;

    if (geoFilter?.radiusKm) {
      const box = geoBoundingBox({
        latitude: geoFilter.latitude,
        longitude: geoFilter.longitude,
        radiusKm: geoFilter.radiusKm
      });

      doctorWhere.latitude = { gte: box.minLatitude, lte: box.maxLatitude };
      doctorWhere.longitude = { gte: box.minLongitude, lte: box.maxLongitude };
      facilityWhere.latitude = { gte: box.minLatitude, lte: box.maxLatitude };
      facilityWhere.longitude = { gte: box.minLongitude, lte: box.maxLongitude };
    }

    const [doctorCandidates, facilityCandidates, articles, products] = await Promise.all([
      shouldSearch('DOCTOR')
        ? prisma.doctorProfile.findMany({
            where: doctorWhere,
            orderBy: { createdAt: 'desc' },
            ...(geoFilter?.radiusKm ? {} : { take: limit }),
            select: {
              id: true,
              slug: true,
              specialty: true,
              city: true,
              latitude: true,
              longitude: true,
              ratingAverage: true,
              reviewCount: true,
              details: true,
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
            where: facilityWhere,
            orderBy: { createdAt: 'desc' },
            ...(geoFilter?.radiusKm ? {} : { take: limit }),
            select: {
              id: true,
              slug: true,
              name: true,
              type: true,
              city: true,
              latitude: true,
              longitude: true,
              ratingAverage: true,
              reviewCount: true,
              details: true,
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
      transactionsEnabled && shouldSearch('PRODUCT')
        ? prisma.product.findMany({
            where: {
              ...publicProductWhereAt(now),
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

    const doctors = doctorCandidates
      .map((doctor) => ({
        ...doctor,
        distanceKm: geoFilter ? distanceForLocation(doctor, geoFilter) : null
      }))
      .filter(
        (doctor) =>
          !geoFilter?.radiusKm ||
          (doctor.distanceKm !== null && doctor.distanceKm <= geoFilter.radiusKm)
      )
      .slice(0, limit);
    const facilities = facilityCandidates
      .map((facility) => ({
        ...facility,
        distanceKm: geoFilter ? distanceForLocation(facility, geoFilter) : null
      }))
      .filter(
        (facility) =>
          !geoFilter?.radiusKm ||
          (facility.distanceKm !== null && facility.distanceKm <= geoFilter.radiusKm)
      )
      .slice(0, limit);

    const items = [
      ...doctors.map((doctor) => ({
        type: 'doctor' as const,
        id: doctor.id,
        slug: doctor.slug,
        title: doctor.user.name,
        subtitle: [doctor.specialty, doctor.city].filter(Boolean).join(' · '),
        href: `/doctor/${doctor.slug}`,
        image: doctor.user.image,
        rating: formatRating(doctor.ratingAverage),
        reviewCount: doctor.reviewCount,
        details: doctor.details,
        ...(geoFilter ? { distanceKm: formatDistanceKm(doctor.distanceKm) } : {})
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
        image: facility.user.image,
        rating: formatRating(facility.ratingAverage),
        reviewCount: facility.reviewCount,
        details: facility.details,
        ...(geoFilter ? { distanceKm: formatDistanceKm(facility.distanceKm) } : {})
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
