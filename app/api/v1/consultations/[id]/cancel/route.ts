import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth-guard';
import { handleRouteError, jsonError, jsonOk, parseJson } from '@/lib/api';
import { consultationDetailSelect } from '@/lib/consultation';
import { sendConsultationCancelledToDoctorEmail } from '@/lib/transaction-email';

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
    const auth = await requireRole(['PATIENT']);

    if (!auth.ok) {
      return auth.error;
    }

    const { id } = await context.params;
    const existing = await prisma.consultation.findFirst({
      where: {
        id,
        patientId: auth.user.id
      },
      select: {
        id: true,
        status: true,
        scheduledAt: true,
        doctorProfile: {
          select: {
            userId: true,
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!existing) {
      return jsonError('Konsultasi tidak ditemukan.', 404);
    }

    if (existing.status !== 'REQUESTED' && existing.status !== 'CONFIRMED') {
      return jsonError('Konsultasi ini tidak dapat dibatalkan.', 409);
    }

    const parsed = await parseJson(request, cancelSchema);

    if (parsed.error) {
      return parsed.error;
    }

    const reason = parsed.data.reason?.trim() || null;
    const consultation = await prisma.$transaction(async (tx) => {
      const updated = await tx.consultation.update({
        where: {
          id: existing.id
        },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancelReason: reason
        },
        select: consultationDetailSelect
      });

      await tx.notification.create({
        data: {
          userId: existing.doctorProfile.userId,
          type: 'CONSULTATION',
          title: 'Konsultasi dibatalkan',
          body:
            reason ||
            `Pasien membatalkan konsultasi yang dijadwalkan pada ${new Intl.DateTimeFormat(
              'id-ID',
              {
                dateStyle: 'medium',
                timeStyle: 'short',
                timeZone: 'Asia/Jakarta'
              }
            ).format(existing.scheduledAt)}.`,
          data: {
            consultationId: existing.id
          }
        }
      });

      return updated;
    });

    if (existing.doctorProfile.user.email) {
      await sendConsultationCancelledToDoctorEmail({
        to: existing.doctorProfile.user.email,
        name: existing.doctorProfile.user.name,
        patientName: auth.user.name || 'Pasien',
        scheduledAt: existing.scheduledAt,
        reason
      });
    }

    return jsonOk(consultation);
  } catch (error) {
    return handleRouteError(error);
  }
}
