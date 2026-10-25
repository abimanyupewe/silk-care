import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth-guard';
import { handleRouteError, jsonError, jsonOk, parseJson } from '@/lib/api';
import { adminFacilitySelect, verificationStatuses } from '@/lib/admin';
import { auditActions, writeAuditLog } from '@/lib/audit';
import { sendPartnerVerificationEmail } from '@/lib/transaction-email';

const verificationSchema = z.object({
  status: z.enum(verificationStatuses),
  note: z.string().trim().max(500).nullable().optional()
});

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const titles = {
  PENDING: 'Verifikasi fasilitas menunggu peninjauan',
  VERIFIED: 'Fasilitas diverifikasi',
  REJECTED: 'Pendaftaran fasilitas ditolak'
} as const;

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const auth = await requireRole(['ADMIN']);

    if (!auth.ok) {
      return auth.error;
    }

    const { id } = await context.params;
    const facility = await prisma.facility.findUnique({
      where: {
        id
      },
      select: {
        id: true,
        userId: true,
        verificationStatus: true,
        user: {
          select: {
            name: true,
            email: true,
            deletedAt: true
          }
        }
      }
    });

    if (!facility) {
      return jsonError('Fasilitas tidak ditemukan.', 404);
    }

    if (facility.user.deletedAt) {
      return jsonError('Akun fasilitas tidak aktif.', 409);
    }

    const parsed = await parseJson(request, verificationSchema);

    if (parsed.error) {
      return parsed.error;
    }

    const changed = facility.verificationStatus !== parsed.data.status;
    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.facility.update({
        where: {
          id: facility.id
        },
        data: {
          verificationStatus: parsed.data.status
        },
        select: adminFacilitySelect
      });

      if (changed) {
        await tx.notification.create({
          data: {
            userId: facility.userId,
            type: 'ACCOUNT',
            title: titles[parsed.data.status],
            body:
              parsed.data.note?.trim() ||
              'Status verifikasi profil fasilitas Anda telah diperbarui.',
            data: {
              facilityId: facility.id
            }
          }
        });

        await writeAuditLog(
          {
            actorId: auth.user.id,
            action: auditActions.facilityVerification,
            targetType: 'FACILITY',
            targetId: facility.id,
            metadata: {
              from: facility.verificationStatus,
              to: parsed.data.status,
              note: parsed.data.note?.trim() || null
            },
            request
          },
          tx
        );
      }

      return result;
    });

    if (changed && facility.user.email) {
      await sendPartnerVerificationEmail({
        to: facility.user.email,
        name: facility.user.name,
        partnerType: 'FASILITAS',
        status: parsed.data.status,
        note: parsed.data.note
      });
    }

    return jsonOk(updated);
  } catch (error) {
    return handleRouteError(error);
  }
}
