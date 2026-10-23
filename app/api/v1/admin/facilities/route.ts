import type { Prisma } from '@/lib/generated/prisma';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth-guard';
import {
  getEnum,
  getPagination,
  getString,
  handleRouteError,
  jsonOk,
  paginationMeta
} from '@/lib/api';
import { adminFacilitySelect, verificationStatuses } from '@/lib/admin';
import { facilityTypes } from '@/lib/facility';

export async function GET(request: Request) {
  try {
    const auth = await requireRole(['ADMIN']);

    if (!auth.ok) {
      return auth.error;
    }

    const searchParams = new URL(request.url).searchParams;
    const q = getString(searchParams, 'q', 100);
    const verificationStatus = getEnum(searchParams, 'verificationStatus', verificationStatuses);
    const type = getEnum(searchParams, 'type', facilityTypes);
    const pagination = getPagination(searchParams, 20);

    const where: Prisma.FacilityWhereInput = {};

    if (verificationStatus) {
      where.verificationStatus = verificationStatus;
    }

    if (type) {
      where.type = type;
    }

    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { city: { contains: q, mode: 'insensitive' } },
        { user: { email: { contains: q, mode: 'insensitive' } } }
      ];
    }

    const [facilities, total] = await Promise.all([
      prisma.facility.findMany({
        where,
        orderBy: {
          createdAt: 'desc'
        },
        skip: pagination.skip,
        take: pagination.limit,
        select: adminFacilitySelect
      }),
      prisma.facility.count({ where })
    ]);

    return jsonOk(facilities, paginationMeta(total, pagination));
  } catch (error) {
    return handleRouteError(error);
  }
}
