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
import { adminDoctorSelect, verificationStatuses } from '@/lib/admin';

export async function GET(request: Request) {
  try {
    const auth = await requireRole(['ADMIN']);

    if (!auth.ok) {
      return auth.error;
    }

    const searchParams = new URL(request.url).searchParams;
    const q = getString(searchParams, 'q', 100);
    const verificationStatus = getEnum(searchParams, 'verificationStatus', verificationStatuses);
    const pagination = getPagination(searchParams, 20);

    const where: Prisma.DoctorProfileWhereInput = {};

    if (verificationStatus) {
      where.verificationStatus = verificationStatus;
    }

    if (q) {
      where.OR = [
        { specialty: { contains: q, mode: 'insensitive' } },
        { city: { contains: q, mode: 'insensitive' } },
        { user: { name: { contains: q, mode: 'insensitive' } } },
        { user: { email: { contains: q, mode: 'insensitive' } } }
      ];
    }

    const [doctors, total] = await Promise.all([
      prisma.doctorProfile.findMany({
        where,
        orderBy: {
          createdAt: 'desc'
        },
        skip: pagination.skip,
        take: pagination.limit,
        select: adminDoctorSelect
      }),
      prisma.doctorProfile.count({ where })
    ]);

    return jsonOk(doctors, paginationMeta(total, pagination));
  } catch (error) {
    return handleRouteError(error);
  }
}
