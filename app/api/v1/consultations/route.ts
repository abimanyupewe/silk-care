import type { Prisma } from '@/lib/generated/prisma';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth-guard';
import {
  getEnum,
  getPagination,
  handleRouteError,
  jsonCreated,
  jsonError,
  jsonOk,
  jsonTooManyRequests,
  paginationMeta,
  parseJson
} from '@/lib/api';
import { publicDoctorWhere } from '@/lib/catalog';
import {
  consultationDetailSelect,
  consultationListSelect,
  consultationStatuses,
  consultationTypes,
  getJakartaSchedulePosition,
  isWithinDoctorSchedule
} from '@/lib/consultation';
import {
  completeIdempotencyRecord,
  createIdempotencyRecord,
  isIdempotencyUniqueError,
  replayIdempotency,
  resolveIdempotency,
  type IdempotencyContext
} from '@/lib/idempotency';
import { rateLimit } from '@/lib/rate-limit';
import { sendConsultationRequestEmail } from '@/lib/transaction-email';

const createSchema = z.object({
  doctorSlug: z.string().trim().min(1).max(200),
  scheduledAt: z.coerce.date(),
  type: z.enum(consultationTypes).default('ONLINE'),
  durationMinutes: z.number().int().min(15).max(120).default(30),
  complaint: z.string().trim().min(10).max(2000)
});

function formatSchedule(date: Date) {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta'
  }).format(date);
}

export async function GET(request: Request) {
  try {
    const auth = await requireRole(['PATIENT']);

    if (!auth.ok) {
      return auth.error;
    }

    const searchParams = new URL(request.url).searchParams;
    const status = getEnum(searchParams, 'status', consultationStatuses);
    const pagination = getPagination(searchParams, 20);
    const where: Prisma.ConsultationWhereInput = {
      patientId: auth.user.id
    };

    if (status) {
      where.status = status;
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

export async function POST(request: Request) {
  let idempotency: (IdempotencyContext & { userId: string }) | null = null;

  try {
    const auth = await requireRole(['PATIENT']);

    if (!auth.ok) {
      return auth.error;
    }

    const parsed = await parseJson(request, createSchema);

    if (parsed.error) {
      return parsed.error;
    }

    const idempotencyResult = await resolveIdempotency(
      request,
      auth.user.id,
      'CONSULTATION_CREATE',
      parsed.data
    );

    if (idempotencyResult.response) {
      return idempotencyResult.response;
    }

    idempotency = idempotencyResult.context
      ? {
          ...idempotencyResult.context,
          userId: auth.user.id
        }
      : null;

    const limit = await rateLimit(`consultations:create:${auth.user.id}`, 10, 10 * 60 * 1000);

    if (!limit.allowed) {
      return jsonTooManyRequests(limit.resetAt);
    }

    if (Number.isNaN(parsed.data.scheduledAt.getTime())) {
      return jsonError('Jadwal konsultasi tidak valid.', 422);
    }

    if (parsed.data.scheduledAt.getTime() < Date.now() + 15 * 60 * 1000) {
      return jsonError('Jadwal konsultasi minimal 15 menit dari sekarang.', 422);
    }

    const doctor = await prisma.doctorProfile.findFirst({
      where: {
        ...publicDoctorWhere,
        slug: parsed.data.doctorSlug
      },
      select: {
        id: true,
        userId: true,
        consultationFee: true,
        user: {
          select: {
            name: true,
            email: true
          }
        },
        schedules: {
          where: {
            isActive: true
          },
          select: {
            dayOfWeek: true,
            startTime: true,
            endTime: true,
            isActive: true
          }
        }
      }
    });

    if (!doctor) {
      return jsonError('Dokter tidak ditemukan.', 404);
    }

    const position = getJakartaSchedulePosition(parsed.data.scheduledAt);

    if (
      !isWithinDoctorSchedule({
        dayOfWeek: position.dayOfWeek,
        minutes: position.minutes,
        durationMinutes: parsed.data.durationMinutes,
        schedules: doctor.schedules
      })
    ) {
      return jsonError('Jadwal yang dipilih berada di luar jam praktik dokter.', 422);
    }

    const endsAt = new Date(
      parsed.data.scheduledAt.getTime() + parsed.data.durationMinutes * 60_000
    );
    const conflict = await prisma.consultation.findFirst({
      where: {
        status: {
          in: ['REQUESTED', 'CONFIRMED']
        },
        scheduledAt: {
          lt: endsAt
        },
        endsAt: {
          gt: parsed.data.scheduledAt
        },
        OR: [{ doctorProfileId: doctor.id }, { patientId: auth.user.id }]
      },
      select: {
        id: true
      }
    });

    if (conflict) {
      return jsonError('Jadwal konsultasi sudah terpakai.', 409);
    }

    const consultation = await prisma.$transaction(async (tx) => {
      let idempotencyRecordId: string | null = null;

      if (idempotency) {
        const record = await createIdempotencyRecord(tx, {
          userId: idempotency.userId,
          scope: 'CONSULTATION_CREATE',
          context: idempotency
        });

        idempotencyRecordId = record.id;
      }

      const created = await tx.consultation.create({
        data: {
          patientId: auth.user.id,
          doctorProfileId: doctor.id,
          type: parsed.data.type,
          scheduledAt: parsed.data.scheduledAt,
          endsAt,
          durationMinutes: parsed.data.durationMinutes,
          fee: doctor.consultationFee,
          complaint: parsed.data.complaint
        },
        select: consultationDetailSelect
      });

      await tx.notification.create({
        data: {
          userId: doctor.userId,
          type: 'CONSULTATION',
          title: 'Permintaan konsultasi baru',
          body: `${auth.user.name || 'Pasien'} mengajukan konsultasi pada ${formatSchedule(parsed.data.scheduledAt)}.`,
          data: {
            consultationId: created.id
          }
        }
      });

      if (idempotencyRecordId) {
        await completeIdempotencyRecord(tx, idempotencyRecordId, {
          status: 201,
          body: {
            data: created
          },
          resourceId: created.id
        });
      }

      return created;
    });

    if (doctor.user.email) {
      await sendConsultationRequestEmail({
        to: doctor.user.email,
        name: doctor.user.name,
        patientName: auth.user.name || 'Pasien',
        scheduledAt: consultation.scheduledAt,
        complaint: consultation.complaint
      });
    }

    return jsonCreated(consultation);
  } catch (error) {
    if (idempotency && isIdempotencyUniqueError(error)) {
      return replayIdempotency(
        idempotency.userId,
        'CONSULTATION_CREATE',
        idempotency.key,
        idempotency.requestHash
      );
    }

    return handleRouteError(error);
  }
}
