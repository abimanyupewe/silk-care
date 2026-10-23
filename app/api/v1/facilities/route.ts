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
import { facilityListSelect, getFacilityRatings, publicFacilityWhere } from '@/lib/catalog';

const facilityTypes = [
  'HOSPITAL',
  'CLINIC',
  'LABORATORY',
  'PHARMACY',
  'PHYSIOTHERAPY',
  'RADIOLOGY',
  'FUNERAL_HOME',
  'WELLNESS'
] as const;

const facilitySorts = {
  newest: { createdAt: 'desc' },
  name: { name: 'asc' },
  city: { city: 'asc' }
} satisfies Record<string, Prisma.FacilityOrderByWithRelationInput>;

export async function GET(request: Request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const q = getString(searchParams, 'q');
    const city = getString(searchParams, 'city', 100);
    const typeParam = getString(searchParams, 'type', 30);
    const type = getEnum(searchParams, 'type', facilityTypes);
    const sort = getString(searchParams, 'sort', 30) as keyof typeof facilitySorts | undefined;

    if (typeParam && !type) {
      return jsonError('type fasilitas tidak valid.', 422);
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

    const pagination = getPagination(searchParams);
    const [items, total] = await Promise.all([
      prisma.facility.findMany({
        where,
        orderBy: sort && facilitySorts[sort] ? facilitySorts[sort] : facilitySorts.newest,
        skip: pagination.skip,
        take: pagination.limit,
        select: facilityListSelect
      }),
      prisma.facility.count({ where })
    ]);

    const ratings = await getFacilityRatings(items.map((item) => item.id));
    const data = items.map((item) => ({
      ...item,
      rating: ratings.get(item.id)?.rating ?? null,
      reviewCount: ratings.get(item.id)?.reviewCount ?? 0
    }));

    return jsonOk(data, paginationMeta(total, pagination));
  } catch (error) {
    return handleRouteError(error);
  }
}
