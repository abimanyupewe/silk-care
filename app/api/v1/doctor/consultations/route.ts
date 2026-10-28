import type { Prisma } from '@/lib/generated/prisma';
import { prisma } from '@/lib/db';
import { requireDoctorProfile } from '@/lib/doctor-guard';
import {
  getEnum,
  getPagination,
  getString,
  handleRouteError,
  jsonOk,
  paginationMeta
} from '@/lib/api';
import { consultationListSelect, consultationStatuses } from '@/lib/consultation';

export async function GET(request: Request) {
  try {
    const auth = await requireDoctorProfile();

    if (!auth.ok) {
      return auth.error;
    }

    const searchParams = new URL(request.url).searchParams;
    const q = getString(searchParams, 'q', 100);
    const status = getEnum(searchParams, 'status', consultationStatuses);
    const pagination = getPagination(searchParams, 20);
    const where: Prisma.ConsultationWhereInput = {
      doctorProfileId: auth.doctor.id
    };

    if (status) {
      where.status = status;
    }

    if (q) {
      where.OR = [
        { complaint: { contains: q, mode: 'insensitive' } },
        { patient: { name: { contains: q, mode: 'insensitive' } } },
        { patient: { email: { contains: q, mode: 'insensitive' } } }
      ];
    }

    const [consultations, total] = await Promise.all([
      prisma.consultation.findMany({
        where,
        orderBy: {
          scheduledAt: 'desc'
        },
        skip: pagination.skip,
        take: pagination.limit,
        select: consultationListSelect
      }),
      prisma.consultation.count({ where })
    ]);

    return jsonOk(consultations, paginationMeta(total, pagination));
  } catch (error) {
    return handleRouteError(error);
  }
}
