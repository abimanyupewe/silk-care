import type { Prisma } from '@/lib/generated/prisma';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth-guard';
import {
  getEnum,
  getPagination,
  getString,
  handleRouteError,
  jsonError,
  jsonOk,
  paginationMeta
} from '@/lib/api';
import { appointmentStatuses, parseScheduledRange } from '@/lib/appointment';

// Hanya metadata operasional. Catatan pasien dan alasan batal sengaja tidak diekspos ke admin,
// sama seperti konsultasi.
const adminAppointmentSelect = {
  id: true,
  status: true,
  scheduledAt: true,
  endsAt: true,
  durationMinutes: true,
  serviceName: true,
  price: true,
  priceMax: true,
  createdAt: true,
  patient: { select: { id: true, name: true, email: true } },
  facility: { select: { id: true, slug: true, name: true, type: true } }
} satisfies Prisma.AppointmentSelect;

export async function GET(request: Request) {
  try {
    const auth = await requireRole(['ADMIN']);

    if (!auth.ok) {
      return auth.error;
    }

    const searchParams = new URL(request.url).searchParams;
    const status = getEnum(searchParams, 'status', appointmentStatuses);
    const facilityId = getString(searchParams, 'facilityId', 100);
    const pagination = getPagination(searchParams, 10);
    const { range, error } = parseScheduledRange(searchParams);

    if (error) {
      return jsonError(error, 422);
    }

    const where: Prisma.AppointmentWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (facilityId) {
      where.facilityId = facilityId;
    }

    if (range) {
      where.scheduledAt = range;
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
        select: adminAppointmentSelect
      }),
      prisma.appointment.count({ where })
    ]);

    return jsonOk(appointments, paginationMeta(total, pagination));
  } catch (error) {
    return handleRouteError(error);
  }
}
