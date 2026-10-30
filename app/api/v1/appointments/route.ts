import { z } from 'zod';
import type { Prisma } from '@/lib/generated/prisma';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth-guard';
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
import {
  appointmentDetailSelect,
  appointmentListSelect,
  appointmentStatuses,
  formatAppointmentSchedule,
  isWithinOperatingHours
} from '@/lib/appointment';
import { publicFacilityServiceWhere, publicFacilityWhere } from '@/lib/catalog';
import { getJakartaSchedulePosition } from '@/lib/consultation';
import {
  completeIdempotencyRecord,
  createIdempotencyRecord,
  isIdempotencyUniqueError,
  replayIdempotency,
  resolveIdempotency,
  type IdempotencyContext
} from '@/lib/idempotency';
import { rateLimit } from '@/lib/rate-limit';
import { sendAppointmentRequestEmail } from '@/lib/transaction-email';

const createSchema = z.object({
  facilitySlug: z.string().trim().min(1).max(200),
  serviceId: z.string().trim().min(1).max(100).optional(),
  scheduledAt: z.coerce.date(),
  notes: z.string().trim().max(1000).nullable().optional()
});

const DEFAULT_DURATION_MINUTES = 30;

export async function GET(request: Request) {
  try {
    const auth = await requireUser();

    if (!auth.ok) {
      return auth.error;
    }

    const searchParams = new URL(request.url).searchParams;
    const status = getEnum(searchParams, 'status', appointmentStatuses);
    const pagination = getPagination(searchParams, 20);
    const where: Prisma.AppointmentWhereInput = { patientId: auth.user.id };

    if (status) {
      where.status = status;
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        orderBy: { scheduledAt: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
        select: appointmentListSelect
      }),
      prisma.appointment.count({ where })
    ]);

    return jsonOk(appointments, paginationMeta(total, pagination));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  let idempotency: (IdempotencyContext & { userId: string }) | null = null;

  try {
    const auth = await requireUser();

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
      'APPOINTMENT_CREATE',
      parsed.data
    );

    if (idempotencyResult.response) {
      return idempotencyResult.response;
    }

    idempotency = idempotencyResult.context
      ? { ...idempotencyResult.context, userId: auth.user.id }
      : null;

    const limit = await rateLimit(`appointments:create:${auth.user.id}`, 10, 10 * 60 * 1000);

    if (!limit.allowed) {
      return jsonTooManyRequests(limit.resetAt);
    }

    const { scheduledAt, notes } = parsed.data;

    if (Number.isNaN(scheduledAt.getTime())) {
      return jsonError('Jadwal janji temu tidak valid.', 422);
    }

    if (scheduledAt.getTime() < Date.now() + 15 * 60 * 1000) {
      return jsonError('Jadwal janji temu minimal 15 menit dari sekarang.', 422);
    }

    const facility = await prisma.facility.findFirst({
      where: { ...publicFacilityWhere, slug: parsed.data.facilitySlug },
      select: {
        id: true,
        userId: true,
        name: true,
        type: true,
        user: { select: { name: true, email: true } },
        operatingHours: {
          select: { dayOfWeek: true, openTime: true, closeTime: true, isClosed: true }
        }
      }
    });

    if (!facility) {
      return jsonError('Fasilitas tidak ditemukan.', 404);
    }

    if (facility.type === 'PHARMACY') {
      return jsonError('Apotek tidak menerima janji temu.', 422);
    }

    if (facility.userId === auth.user.id) {
      return jsonError('Anda tidak dapat mengajukan janji temu ke fasilitas sendiri.', 422);
    }

    const service = parsed.data.serviceId
      ? await prisma.facilityService.findFirst({
          where: {
            ...publicFacilityServiceWhere,
            id: parsed.data.serviceId,
            facilityId: facility.id
          },
          select: { name: true, priceMin: true, priceMax: true, durationMinutes: true }
        })
      : null;

    if (parsed.data.serviceId && !service) {
      return jsonError('Layanan tidak ditemukan atau tidak aktif.', 422);
    }

    const durationMinutes = service?.durationMinutes ?? DEFAULT_DURATION_MINUTES;

    if (facility.operatingHours.length === 0) {
      return jsonError('Fasilitas belum mengatur jam operasional.', 422);
    }

    const position = getJakartaSchedulePosition(scheduledAt);

    if (
      !isWithinOperatingHours({
        dayOfWeek: position.dayOfWeek,
        minutes: position.minutes,
        durationMinutes,
        hours: facility.operatingHours
      })
    ) {
      return jsonError('Jadwal yang dipilih berada di luar jam operasional fasilitas.', 422);
    }

    const endsAt = new Date(scheduledAt.getTime() + durationMinutes * 60_000);
    const conflict = await prisma.appointment.findFirst({
      where: {
        patientId: auth.user.id,
        status: { in: ['REQUESTED', 'CONFIRMED'] },
        scheduledAt: { lt: endsAt },
        endsAt: { gt: scheduledAt }
      },
      select: { id: true }
    });

    if (conflict) {
      return jsonError('Anda sudah punya janji temu pada waktu tersebut.', 409);
    }

    const serviceName = service?.name ?? 'Janji temu';
    const appointment = await prisma.$transaction(async (tx) => {
      let idempotencyRecordId: string | null = null;

      if (idempotency) {
        const record = await createIdempotencyRecord(tx, {
          userId: idempotency.userId,
          scope: 'APPOINTMENT_CREATE',
          context: idempotency
        });

        idempotencyRecordId = record.id;
      }

      const created = await tx.appointment.create({
        data: {
          patientId: auth.user.id,
          facilityId: facility.id,
          serviceId: parsed.data.serviceId,
          serviceName,
          price: service?.priceMin,
          priceMax: service?.priceMax,
          scheduledAt,
          endsAt,
          durationMinutes,
          notes: notes ?? null
        },
        select: appointmentDetailSelect
      });

      await tx.notification.create({
        data: {
          userId: facility.userId,
          type: 'APPOINTMENT',
          title: 'Permintaan janji temu baru',
          body: `${auth.user.name || 'Pasien'} mengajukan ${serviceName} pada ${formatAppointmentSchedule(scheduledAt)}.`,
          data: { appointmentId: created.id }
        }
      });

      if (idempotencyRecordId) {
        await completeIdempotencyRecord(tx, idempotencyRecordId, {
          status: 201,
          body: { data: created },
          resourceId: created.id
        });
      }

      return created;
    });

    if (facility.user.email) {
      await sendAppointmentRequestEmail({
        to: facility.user.email,
        name: facility.user.name ?? facility.name,
        patientName: auth.user.name || 'Pasien',
        serviceName,
        scheduledAt
      });
    }

    return jsonCreated(appointment);
  } catch (error) {
    if (idempotency && isIdempotencyUniqueError(error)) {
      return replayIdempotency(
        idempotency.userId,
        'APPOINTMENT_CREATE',
        idempotency.key,
        idempotency.requestHash
      );
    }

    return handleRouteError(error);
  }
}
