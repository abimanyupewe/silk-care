import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireDoctorProfile } from '@/lib/doctor-guard';
import { handleRouteError, jsonError, jsonOk, parseJson } from '@/lib/api';
import { consultationDetailSelect } from '@/lib/consultation';
import { sendConsultationStatusEmail } from '@/lib/transaction-email';

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
    const auth = await requireDoctorProfile();

    if (!auth.ok) {
      return auth.error;
    }

    const { id } = await context.params;
    const existing = await prisma.consultation.findFirst({
      where: {
        id,
        doctorProfileId: auth.doctor.id
      },
      select: {
        id: true,
        status: true,
        patientId: true,
        scheduledAt: true,
        patient: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    if (!existing) {
      return jsonError('Konsultasi tidak ditemukan.', 404);
    }

    const parsed = await parseJson(request, statusSchema);

    if (parsed.error) {
      return parsed.error;
    }

    const target = parsed.data.status;

    if (target === 'CONFIRMED' && existing.status !== 'REQUESTED') {
      return jsonError('Hanya konsultasi yang menunggu konfirmasi yang dapat dikonfirmasi.', 409);
    }

    if (target === 'COMPLETED' && existing.status !== 'CONFIRMED') {
      return jsonError('Hanya konsultasi yang sudah dikonfirmasi yang dapat diselesaikan.', 409);
    }

    if (
      target === 'CANCELLED' &&
      existing.status !== 'REQUESTED' &&
      existing.status !== 'CONFIRMED'
    ) {
      return jsonError('Konsultasi ini tidak dapat dibatalkan.', 409);
    }

    const now = new Date();
    const reason = parsed.data.reason?.trim() || null;
    const data = {
      status: target,
      ...(target === 'CONFIRMED' ? { confirmedAt: now } : {}),
      ...(target === 'COMPLETED' ? { completedAt: now } : {}),
      ...(target === 'CANCELLED' ? { cancelledAt: now, cancelReason: reason } : {})
    };
    const notification = {
      CONFIRMED: {
        title: 'Konsultasi dikonfirmasi',
        body: `Dokter mengonfirmasi konsultasi Anda pada ${new Intl.DateTimeFormat('id-ID', {
          dateStyle: 'medium',
          timeStyle: 'short',
          timeZone: 'Asia/Jakarta'
        }).format(existing.scheduledAt)}.`
      },
      COMPLETED: {
        title: 'Konsultasi selesai',
        body: 'Konsultasi telah selesai. Rekam medis akan tersedia setelah diisi oleh dokter.'
      },
      CANCELLED: {
        title: 'Konsultasi dibatalkan dokter',
        body: reason || 'Dokter membatalkan jadwal konsultasi Anda.'
      }
    }[target];

    const consultation = await prisma.$transaction(async (tx) => {
      const updated = await tx.consultation.update({
        where: {
          id: existing.id
        },
        data,
        select: consultationDetailSelect
      });

      await tx.notification.create({
        data: {
          userId: existing.patientId,
          type: 'CONSULTATION',
          title: notification.title,
          body: notification.body,
          data: {
            consultationId: existing.id
          }
        }
      });

      return updated;
    });

    if (existing.patient.email) {
      await sendConsultationStatusEmail({
        to: existing.patient.email,
        name: existing.patient.name,
        doctorName: auth.user.name || 'Dokter',
        scheduledAt: existing.scheduledAt,
        status: target,
        note: target === 'CANCELLED' ? reason : null
      });
    }

    return jsonOk(consultation);
  } catch (error) {
    return handleRouteError(error);
  }
}
