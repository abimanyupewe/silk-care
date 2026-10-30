import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireServiceFacility } from '@/lib/facility-guard';
import { handleRouteError, jsonError, jsonOk, parseJson } from '@/lib/api';
import { appointmentDetailSelect, formatAppointmentSchedule } from '@/lib/appointment';
import { sendAppointmentStatusEmail } from '@/lib/transaction-email';

const statusSchema = z.object({
  status: z.enum(['CONFIRMED', 'COMPLETED', 'CANCELLED']),
  reason: z.string().trim().max(500).nullable().optional()
});

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const auth = await requireServiceFacility();

    if (!auth.ok) {
      return auth.error;
    }

    const { id } = await context.params;
    const existing = await prisma.appointment.findFirst({
      where: { id, facilityId: auth.facility.id },
      select: {
        id: true,
        status: true,
        patientId: true,
        scheduledAt: true,
        patient: { select: { name: true, email: true } }
      }
    });

    if (!existing) {
      return jsonError('Janji temu tidak ditemukan.', 404);
    }

    const parsed = await parseJson(request, statusSchema);

    if (parsed.error) {
      return parsed.error;
    }

    const target = parsed.data.status;
    const reason = parsed.data.reason?.trim() || null;

    if (target === 'CONFIRMED' && existing.status !== 'REQUESTED') {
      return jsonError('Hanya janji temu yang menunggu konfirmasi yang dapat dikonfirmasi.', 409);
    }

    if (target === 'COMPLETED') {
      if (existing.status !== 'CONFIRMED') {
        return jsonError('Hanya janji temu yang sudah dikonfirmasi yang dapat diselesaikan.', 409);
      }

      if (existing.scheduledAt.getTime() > Date.now()) {
        return jsonError('Janji temu belum dapat diselesaikan sebelum waktunya.', 409);
      }
    }

    if (target === 'CANCELLED') {
      if (existing.status !== 'REQUESTED' && existing.status !== 'CONFIRMED') {
        return jsonError('Janji temu ini tidak dapat dibatalkan.', 409);
      }

      if (!reason) {
        return jsonError('Alasan pembatalan wajib diisi.', 422);
      }
    }

    const now = new Date();
    const data = {
      status: target,
      ...(target === 'CONFIRMED' ? { confirmedAt: now } : {}),
      ...(target === 'COMPLETED' ? { completedAt: now } : {}),
      ...(target === 'CANCELLED' ? { cancelledAt: now, cancelReason: reason } : {})
    };
    const notification = {
      CONFIRMED: {
        title: 'Janji temu dikonfirmasi',
        body: `${auth.facility.name} mengonfirmasi janji temu Anda pada ${formatAppointmentSchedule(existing.scheduledAt)}.`
      },
      COMPLETED: {
        title: 'Janji temu selesai',
        body: `Janji temu Anda di ${auth.facility.name} telah selesai.`
      },
      CANCELLED: {
        title: 'Janji temu dibatalkan fasilitas',
        body: reason ?? `${auth.facility.name} membatalkan janji temu Anda.`
      }
    }[target];

    const appointment = await prisma.$transaction(async (tx) => {
      // Status asal ikut di where: dua permintaan bersamaan tidak menimpa satu sama lain.
      const changed = await tx.appointment.updateMany({
        where: { id: existing.id, status: existing.status },
        data
      });

      if (changed.count === 0) {
        return null;
      }

      await tx.notification.create({
        data: {
          userId: existing.patientId,
          type: 'APPOINTMENT',
          title: notification.title,
          body: notification.body,
          data: { appointmentId: existing.id }
        }
      });

      return tx.appointment.findUniqueOrThrow({
        where: { id: existing.id },
        select: appointmentDetailSelect
      });
    });

    if (!appointment) {
      return jsonError('Status janji temu sudah berubah. Muat ulang lalu coba lagi.', 409);
    }

    if (existing.patient.email) {
      await sendAppointmentStatusEmail({
        to: existing.patient.email,
        name: existing.patient.name ?? 'Pasien',
        facilityName: auth.facility.name,
        scheduledAt: existing.scheduledAt,
        status: target,
        note: target === 'CANCELLED' ? reason : null
      });
    }

    return jsonOk(appointment);
  } catch (error) {
    return handleRouteError(error);
  }
}
