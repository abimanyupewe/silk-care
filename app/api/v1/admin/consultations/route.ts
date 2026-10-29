import type { Prisma } from '@/lib/generated/prisma';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth-guard';
import {
  getBoolean,
  getEnum,
  getPagination,
  getString,
  handleRouteError,
  jsonOk,
  paginationMeta
} from '@/lib/api';
import { consultationStatuses } from '@/lib/consultation';

// Hanya metadata operasional. Keluhan, alasan batal, dan rekam medis sengaja tidak
// diekspos ke admin: data kesehatan pasien hanya untuk pasien dan dokter terkait.
const adminConsultationSelect = {
  id: true,
  status: true,
  type: true,
  scheduledAt: true,
  endsAt: true,
  durationMinutes: true,
  fee: true,
  createdAt: true,
  patient: {
    select: {
      id: true,
      name: true,
      email: true
    }
  },
  doctorProfile: {
    select: {
      id: true,
      slug: true,
      specialty: true,
      user: {
        select: {
          name: true
        }
      }
    }
  }
} satisfies Prisma.ConsultationSelect;

export async function GET(request: Request) {
  try {
    const auth = await requireRole(['ADMIN']);

    if (!auth.ok) {
      return auth.error;
    }

    const searchParams = new URL(request.url).searchParams;
    const status = getEnum(searchParams, 'status', consultationStatuses);
    const stale = getBoolean(searchParams, 'stale');
    const q = getString(searchParams, 'q', 100);
    const pagination = getPagination(searchParams, 10);

    const where: Prisma.ConsultationWhereInput = {};

    if (status) {
      where.status = status;
    }

    // stale=true: permintaan yang belum dikonfirmasi dokter lebih dari 24 jam (menimpa status).
    if (stale) {
      where.status = 'REQUESTED';
      where.createdAt = {
        lt: new Date(Date.now() - 24 * 60 * 60 * 1000)
      };
    }

    if (q) {
      where.OR = [
        { patient: { name: { contains: q, mode: 'insensitive' } } },
        { patient: { email: { contains: q, mode: 'insensitive' } } },
        { doctorProfile: { user: { name: { contains: q, mode: 'insensitive' } } } },
        { doctorProfile: { specialty: { contains: q, mode: 'insensitive' } } }
      ];
    }

    const [consultations, total] = await Promise.all([
      prisma.consultation.findMany({
        where,
        orderBy: {
          createdAt: 'desc'
        },
        skip: pagination.skip,
        take: pagination.limit,
        select: adminConsultationSelect
      }),
      prisma.consultation.count({ where })
    ]);

    return jsonOk(consultations, paginationMeta(total, pagination));
  } catch (error) {
    return handleRouteError(error);
  }
}
