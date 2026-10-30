import type { Prisma } from '@/lib/generated/prisma';
import { prisma } from '@/lib/db';
import { requireServiceFacility } from '@/lib/facility-guard';
import {
  getEnum,
  getPagination,
  handleRouteError,
  jsonError,
  jsonOk,
  paginationMeta
} from '@/lib/api';
import { appointmentListSelect, appointmentStatuses, parseScheduledRange } from '@/lib/appointment';

export async function GET(request: Request) {
  try {
    const auth = await requireServiceFacility();

    if (!auth.ok) {
      return auth.error;
    }

    const searchParams = new URL(request.url).searchParams;
    const status = getEnum(searchParams, 'status', appointmentStatuses);
    const pagination = getPagination(searchParams, 10);
    const { range, error } = parseScheduledRange(searchParams);

    if (error) {
      return jsonError(error, 422);
    }

    const where: Prisma.AppointmentWhereInput = { facilityId: auth.facility.id };

    if (status) {
      where.status = status;
    }

    if (range) {
      where.scheduledAt = range;
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        orderBy: { scheduledAt: 'asc' },
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
