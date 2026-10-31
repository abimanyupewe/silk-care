import type { Prisma } from '@/lib/generated/prisma';
import { prisma } from '@/lib/db';
import {
  getInt,
  getPagination,
  getString,
  handleRouteError,
  jsonError,
  jsonOk,
  paginationMeta
} from '@/lib/api';
import { doctorAvailabilityWhere, parseAvailabilityFilter } from '@/lib/availability';
import { doctorListSelect, publicDoctorWhereAt } from '@/lib/catalog';
import { formatDistanceKm, geoBoundingBox, haversineKm, parseGeoFilter } from '@/lib/geo';
import { formatRating, parseMinRating } from '@/lib/rating';

const doctorSorts = {
  newest: { createdAt: 'desc' },
  name: { user: { name: 'asc' } },
  fee_asc: { consultationFee: { sort: 'asc', nulls: 'last' } },
  fee_desc: { consultationFee: { sort: 'desc', nulls: 'last' } },
  experience_desc: { experienceYears: { sort: 'desc', nulls: 'last' } },
  rating_desc: [{ ratingAverage: { sort: 'desc', nulls: 'last' } }, { reviewCount: 'desc' }],
  review_desc: [{ reviewCount: 'desc' }, { ratingAverage: { sort: 'desc', nulls: 'last' } }]
} satisfies Record<
  string,
  Prisma.DoctorProfileOrderByWithRelationInput | Prisma.DoctorProfileOrderByWithRelationInput[]
>;

const doctorSortKeys = [
  'newest',
  'name',
  'fee_asc',
  'fee_desc',
  'experience_desc',
  'rating_desc',
  'review_desc',
  'distance_asc'
] as const;

type DoctorSortKey = (typeof doctorSortKeys)[number];
type DoctorListItem = Prisma.DoctorProfileGetPayload<{ select: typeof doctorListSelect }>;

function distanceForDoctor(
  doctor: DoctorListItem,
  origin: { latitude: number; longitude: number }
) {
  if (doctor.latitude === null || doctor.longitude === null) {
    return null;
  }

  return haversineKm(origin, {
    latitude: doctor.latitude,
    longitude: doctor.longitude
  });
}

function toDoctorResponse(doctor: DoctorListItem) {
  const { ratingAverage, ...data } = doctor;

  return {
    ...data,
    rating: formatRating(ratingAverage)
  };
}

function doctorOrderBy(sort: DoctorSortKey | undefined) {
  if (sort && sort !== 'distance_asc') {
    return doctorSorts[sort];
  }

  return doctorSorts.newest;
}

function sortDoctors(
  doctors: DoctorListItem[],
  sort: DoctorSortKey | undefined,
  distanceById: Map<string, number | null>
) {
  if (sort === 'distance_asc') {
    return doctors.sort((left, right) => {
      const leftDistance = distanceById.get(left.id) ?? Number.POSITIVE_INFINITY;
      const rightDistance = distanceById.get(right.id) ?? Number.POSITIVE_INFINITY;

      return leftDistance - rightDistance;
    });
  }

  if (sort === 'rating_desc') {
    return doctors.sort((left, right) => {
      const ratingDifference = (right.ratingAverage ?? -1) - (left.ratingAverage ?? -1);

      return ratingDifference !== 0 ? ratingDifference : right.reviewCount - left.reviewCount;
    });
  }

  if (sort === 'review_desc') {
    return doctors.sort((left, right) => {
      const reviewDifference = right.reviewCount - left.reviewCount;

      return reviewDifference !== 0
        ? reviewDifference
        : (right.ratingAverage ?? -1) - (left.ratingAverage ?? -1);
    });
  }

  if (sort === 'name') {
    return doctors.sort((left, right) => left.user.name.localeCompare(right.user.name));
  }

  if (sort === 'fee_asc') {
    return doctors.sort(
      (left, right) =>
        (left.consultationFee ?? Number.POSITIVE_INFINITY) -
        (right.consultationFee ?? Number.POSITIVE_INFINITY)
    );
  }

  if (sort === 'fee_desc') {
    return doctors.sort(
      (left, right) => (right.consultationFee ?? -1) - (left.consultationFee ?? -1)
    );
  }

  if (sort === 'experience_desc') {
    return doctors.sort(
      (left, right) => (right.experienceYears ?? -1) - (left.experienceYears ?? -1)
    );
  }

  return doctors.sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());
}

export async function GET(request: Request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const q = getString(searchParams, 'q');
    const specialty = getString(searchParams, 'specialty', 100);
    const city = getString(searchParams, 'city', 100);
    const minFee = getInt(searchParams, 'minFee');
    const maxFee = getInt(searchParams, 'maxFee');
    const sort = getString(searchParams, 'sort', 30) as DoctorSortKey | undefined;
    const minRating = parseMinRating(searchParams);
    const geo = parseGeoFilter(searchParams);
    const availability = parseAvailabilityFilter(searchParams);

    if (minFee !== undefined && minFee < 0) {
      return jsonError('minFee tidak boleh negatif.', 422);
    }

    if (maxFee !== undefined && maxFee < 0) {
      return jsonError('maxFee tidak boleh negatif.', 422);
    }

    if (minFee !== undefined && maxFee !== undefined && minFee > maxFee) {
      return jsonError('minFee tidak boleh lebih besar dari maxFee.', 422);
    }

    if (sort && !doctorSortKeys.includes(sort)) {
      return jsonError('sort dokter tidak valid.', 422);
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

    const where: Prisma.DoctorProfileWhereInput = { ...publicDoctorWhereAt(new Date()) };

    if (q) {
      where.OR = [
        { specialty: { contains: q, mode: 'insensitive' } },
        { bio: { contains: q, mode: 'insensitive' } },
        { user: { name: { contains: q, mode: 'insensitive' } } }
      ];
    }

    if (specialty) {
      where.specialty = { contains: specialty, mode: 'insensitive' };
    }

    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }

    if (minFee !== undefined || maxFee !== undefined) {
      where.consultationFee = { gte: minFee, lte: maxFee };
    }

    if (minRating.value !== undefined) {
      where.ratingAverage = { gte: minRating.value };
    }

    if (availability.filter) {
      where.schedules = doctorAvailabilityWhere(availability.filter);
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
      const candidates = await prisma.doctorProfile.findMany({
        where,
        orderBy: doctorOrderBy(sort),
        select: doctorListSelect
      });
      const distanceById = new Map(
        candidates.map((doctor) => [doctor.id, distanceForDoctor(doctor, geoFilter)])
      );
      const filtered = candidates.filter((doctor) => {
        if (!geoFilter.radiusKm) {
          return true;
        }

        const distance = distanceById.get(doctor.id);

        return distance !== null && distance !== undefined && distance <= geoFilter.radiusKm;
      });
      const sorted = sortDoctors(filtered, sort, distanceById);
      const items = sorted.slice(pagination.skip, pagination.skip + pagination.limit);

      return jsonOk(
        items.map((doctor) => ({
          ...toDoctorResponse(doctor),
          distanceKm: formatDistanceKm(distanceById.get(doctor.id))
        })),
        paginationMeta(filtered.length, pagination)
      );
    }

    const [items, total] = await Promise.all([
      prisma.doctorProfile.findMany({
        where,
        orderBy: doctorOrderBy(sort),
        skip: pagination.skip,
        take: pagination.limit,
        select: doctorListSelect
      }),
      prisma.doctorProfile.count({ where })
    ]);

    return jsonOk(
      items.map((doctor) => ({
        ...toDoctorResponse(doctor),
        ...(geoFilter ? { distanceKm: formatDistanceKm(distanceForDoctor(doctor, geoFilter)) } : {})
      })),
      paginationMeta(total, pagination)
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
