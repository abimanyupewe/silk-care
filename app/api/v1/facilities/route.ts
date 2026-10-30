import type { Prisma } from '@/lib/generated/prisma';
import { prisma } from '@/lib/db';
import {
  getEnum,
  getPagination,
  getString,
  handleRouteError,
  jsonError,
  jsonOk,
  paginationMeta
} from '@/lib/api';
import { facilityAvailabilityWhere, parseAvailabilityFilter } from '@/lib/availability';
import { facilityListSelect, publicFacilityWhere } from '@/lib/catalog';
import { formatDistanceKm, geoBoundingBox, haversineKm, parseGeoFilter } from '@/lib/geo';
import { facilityTypes } from '@/lib/facility-types';
import { formatRating, parseMinRating } from '@/lib/rating';

const facilitySorts = {
  newest: { createdAt: 'desc' },
  name: { name: 'asc' },
  city: { city: 'asc' },
  rating_desc: [{ ratingAverage: { sort: 'desc', nulls: 'last' } }, { reviewCount: 'desc' }],
  review_desc: [{ reviewCount: 'desc' }, { ratingAverage: { sort: 'desc', nulls: 'last' } }]
} satisfies Record<
  string,
  Prisma.FacilityOrderByWithRelationInput | Prisma.FacilityOrderByWithRelationInput[]
>;

const facilitySortKeys = [
  'newest',
  'name',
  'city',
  'rating_desc',
  'review_desc',
  'distance_asc'
] as const;

type FacilitySortKey = (typeof facilitySortKeys)[number];
type FacilityListItem = Prisma.FacilityGetPayload<{ select: typeof facilityListSelect }>;

function distanceForFacility(
  facility: FacilityListItem,
  origin: { latitude: number; longitude: number }
) {
  if (facility.latitude === null || facility.longitude === null) {
    return null;
  }

  return haversineKm(origin, {
    latitude: facility.latitude,
    longitude: facility.longitude
  });
}

function toFacilityResponse(facility: FacilityListItem) {
  const { ratingAverage, ...data } = facility;

  return {
    ...data,
    rating: formatRating(ratingAverage)
  };
}

function facilityOrderBy(sort: FacilitySortKey | undefined) {
  if (sort && sort !== 'distance_asc') {
    return facilitySorts[sort];
  }

  return facilitySorts.newest;
}

function sortFacilities(
  facilities: FacilityListItem[],
  sort: FacilitySortKey | undefined,
  distanceById: Map<string, number | null>
) {
  if (sort === 'distance_asc') {
    return facilities.sort((left, right) => {
      const leftDistance = distanceById.get(left.id) ?? Number.POSITIVE_INFINITY;
      const rightDistance = distanceById.get(right.id) ?? Number.POSITIVE_INFINITY;

      return leftDistance - rightDistance;
    });
  }

  if (sort === 'rating_desc') {
    return facilities.sort((left, right) => {
      const ratingDifference = (right.ratingAverage ?? -1) - (left.ratingAverage ?? -1);

      return ratingDifference !== 0 ? ratingDifference : right.reviewCount - left.reviewCount;
    });
  }

  if (sort === 'review_desc') {
    return facilities.sort((left, right) => {
      const reviewDifference = right.reviewCount - left.reviewCount;

      return reviewDifference !== 0
        ? reviewDifference
        : (right.ratingAverage ?? -1) - (left.ratingAverage ?? -1);
    });
  }

  if (sort === 'name') {
    return facilities.sort((left, right) => left.name.localeCompare(right.name));
  }

  if (sort === 'city') {
    return facilities.sort((left, right) => (left.city ?? '').localeCompare(right.city ?? ''));
  }

  return facilities.sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());
}

export async function GET(request: Request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const q = getString(searchParams, 'q');
    const city = getString(searchParams, 'city', 100);
    const typeParam = getString(searchParams, 'type', 30);
    const type = getEnum(searchParams, 'type', facilityTypes);
    const sort = getString(searchParams, 'sort', 30) as FacilitySortKey | undefined;
    const minRating = parseMinRating(searchParams);
    const geo = parseGeoFilter(searchParams);
    const availability = parseAvailabilityFilter(searchParams);

    if (typeParam && !type) {
      return jsonError('type fasilitas tidak valid.', 422);
    }

    if (sort && !facilitySortKeys.includes(sort)) {
      return jsonError('sort fasilitas tidak valid.', 422);
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

    if (sort === 'distance_asc' && !geo.filter) {
      return jsonError('sort distance_asc membutuhkan lat dan lng.', 422);
    }

    const where: Prisma.FacilityWhereInput = { ...publicFacilityWhere };

    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { city: { contains: q, mode: 'insensitive' } }
      ];
    }

    if (type) {
      where.type = type;
    }

    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }

    if (minRating.value !== undefined) {
      where.ratingAverage = { gte: minRating.value };
    }

    if (availability.filter) {
      where.operatingHours = facilityAvailabilityWhere(availability.filter);
    }

    const pagination = getPagination(searchParams);
    const geoFilter = geo.filter;
    const needsDistanceSort = sort === 'distance_asc';
    const needsPostFilter = Boolean(geoFilter?.radiusKm || needsDistanceSort);

    if (geoFilter?.radiusKm) {
      const box = geoBoundingBox({
        latitude: geoFilter.latitude,
        longitude: geoFilter.longitude,
        radiusKm: geoFilter.radiusKm
      });

      where.latitude = { gte: box.minLatitude, lte: box.maxLatitude };
      where.longitude = { gte: box.minLongitude, lte: box.maxLongitude };
    }

    if (needsPostFilter && geoFilter) {
      const candidates = await prisma.facility.findMany({
        where,
        orderBy: facilityOrderBy(sort),
        select: facilityListSelect
      });
      const distanceById = new Map(
        candidates.map((facility) => [facility.id, distanceForFacility(facility, geoFilter)])
      );
      const filtered = candidates.filter((facility) => {
        if (!geoFilter.radiusKm) {
          return true;
        }

        const distance = distanceById.get(facility.id);

        return distance !== null && distance !== undefined && distance <= geoFilter.radiusKm;
      });
      const sorted = sortFacilities(filtered, sort, distanceById);
      const items = sorted.slice(pagination.skip, pagination.skip + pagination.limit);

      return jsonOk(
        items.map((facility) => ({
          ...toFacilityResponse(facility),
          distanceKm: formatDistanceKm(distanceById.get(facility.id))
        })),
        paginationMeta(filtered.length, pagination)
      );
    }

    const [items, total] = await Promise.all([
      prisma.facility.findMany({
        where,
        orderBy: facilityOrderBy(sort),
        skip: pagination.skip,
        take: pagination.limit,
        select: facilityListSelect
      }),
      prisma.facility.count({ where })
    ]);

    return jsonOk(
      items.map((facility) => ({
        ...toFacilityResponse(facility),
        ...(geoFilter
          ? { distanceKm: formatDistanceKm(distanceForFacility(facility, geoFilter)) }
          : {})
      })),
      paginationMeta(total, pagination)
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
