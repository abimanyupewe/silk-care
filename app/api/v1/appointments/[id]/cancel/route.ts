import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth-guard';
import { handleRouteError, jsonError, jsonOk, parseJson } from '@/lib/api';
import { appointmentDetailSelect, formatAppointmentSchedule } from '@/lib/appointment';
import { sendAppointmentCancelledToFacilityEmail } from '@/lib/transaction-email';

const cancelSchema = z.object({
  reason: z.string().trim().max(500).nullable().optional()
});

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const auth = await requireUser();

    if (!auth.ok) {
      return auth.error;
    }

    const { id } = await context.params;
    const existing = await prisma.appointment.findFirst({
      where: { id, patientId: auth.user.id },
      select: {
        id: true,
        status: true,
        scheduledAt: true,
        facility: {
          select: { name: true, userId: true, user: { select: { name: true, email: true } } }
        }
      }
    });

    if (!existing) {
      return jsonError('Janji temu tidak ditemukan.', 404);
    }

    if (existing.status !== 'REQUESTED' && existing.status !== 'CONFIRMED') {
      return jsonError('Janji temu ini tidak dapat dibatalkan.', 409);
    }

    const parsed = await parseJson(request, cancelSchema);

    if (parsed.error) {
      return parsed.error;
    }

    const reason = parsed.data.reason?.trim() || null;
    const appointment = await prisma.$transaction(async (tx) => {
      // updateMany menjaga status: pembatalan ganda bersamaan tidak menulis dua notifikasi.
      const changed = await tx.appointment.updateMany({
        where: { id: existing.id, status: { in: ['REQUESTED', 'CONFIRMED'] } },
        data: { status: 'CANCELLED', cancelledAt: new Date(), cancelReason: reason }
      });

      if (changed.count === 0) {
        return null;
      }

      await tx.notification.create({
        data: {
          userId: existing.facility.userId,
          type: 'APPOINTMENT',
          title: 'Janji temu dibatalkan',
          body:
            reason ||
            `Pasien membatalkan janji temu pada ${formatAppointmentSchedule(existing.scheduledAt)}.`,
          data: { appointmentId: existing.id }
        }
      });

      return tx.appointment.findUniqueOrThrow({
        where: { id: existing.id },
        select: appointmentDetailSelect
      });
    });

    if (!appointment) {
      return jsonError('Janji temu ini tidak dapat dibatalkan.', 409);
    }

    if (existing.facility.user.email) {
      await sendAppointmentCancelledToFacilityEmail({
        to: existing.facility.user.email,
        name: existing.facility.user.name ?? existing.facility.name,
        patientName: auth.user.name || 'Pasien',
        scheduledAt: existing.scheduledAt,
        reason
      });
    }

    return jsonOk(appointment);
  } catch (error) {
    return handleRouteError(error);
  }
}
