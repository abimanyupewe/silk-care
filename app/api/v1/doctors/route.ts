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
import { doctorListSelect, getDoctorRatings, publicDoctorWhere } from '@/lib/catalog';

const doctorSorts = {
  newest: { createdAt: 'desc' },
  name: { user: { name: 'asc' } },
  fee_asc: { consultationFee: 'asc' },
  fee_desc: { consultationFee: 'desc' },
  experience_desc: { experienceYears: 'desc' }
} satisfies Record<string, Prisma.DoctorProfileOrderByWithRelationInput>;

export async function GET(request: Request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const q = getString(searchParams, 'q');
    const specialty = getString(searchParams, 'specialty', 100);
    const city = getString(searchParams, 'city', 100);
    const minFee = getInt(searchParams, 'minFee');
    const maxFee = getInt(searchParams, 'maxFee');
    const sort = getString(searchParams, 'sort', 30) as keyof typeof doctorSorts | undefined;

    if (minFee !== undefined && minFee < 0) {
      return jsonError('minFee tidak boleh negatif.', 422);
    }

    if (maxFee !== undefined && maxFee < 0) {
      return jsonError('maxFee tidak boleh negatif.', 422);
    }

    if (minFee !== undefined && maxFee !== undefined && minFee > maxFee) {
      return jsonError('minFee tidak boleh lebih besar dari maxFee.', 422);
    }

    const where: Prisma.DoctorProfileWhereInput = { ...publicDoctorWhere };

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

    const pagination = getPagination(searchParams);
    const [items, total] = await Promise.all([
      prisma.doctorProfile.findMany({
        where,
        orderBy: sort && doctorSorts[sort] ? doctorSorts[sort] : doctorSorts.newest,
        skip: pagination.skip,
        take: pagination.limit,
        select: doctorListSelect
      }),
      prisma.doctorProfile.count({ where })
    ]);

    const ratings = await getDoctorRatings(items.map((item) => item.id));
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
