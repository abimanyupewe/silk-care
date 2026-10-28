import type { Prisma } from '@/lib/generated/prisma';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth-guard';
import { getPagination, handleRouteError, jsonOk, paginationMeta } from '@/lib/api';
import { medicalRecordDetailSelect } from '@/lib/consultation';

export async function GET(request: Request) {
  try {
    const auth = await requireRole(['PATIENT']);

    if (!auth.ok) {
      return auth.error;
    }

    const pagination = getPagination(new URL(request.url).searchParams, 20);
    const where: Prisma.MedicalRecordWhereInput = {
      patientId: auth.user.id
    };
    const [records, total] = await Promise.all([
      prisma.medicalRecord.findMany({
        where,
        orderBy: {
          createdAt: 'desc'
        },
        skip: pagination.skip,
        take: pagination.limit,
        select: medicalRecordDetailSelect
      }),
      prisma.medicalRecord.count({ where })
    ]);

    return jsonOk(records, paginationMeta(total, pagination));
  } catch (error) {
    return handleRouteError(error);
  }
}
