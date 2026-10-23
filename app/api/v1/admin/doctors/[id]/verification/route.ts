import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth-guard';
import { handleRouteError, jsonError, jsonOk, parseJson } from '@/lib/api';
import { adminDoctorSelect, verificationStatuses } from '@/lib/admin';

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
  PENDING: 'Verifikasi dokter menunggu peninjauan',
  VERIFIED: 'Pendaftaran dokter diverifikasi',
  REJECTED: 'Pendaftaran dokter ditolak'
} as const;

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const auth = await requireRole(['ADMIN']);

    if (!auth.ok) {
      return auth.error;
    }

    const { id } = await context.params;
    const doctor = await prisma.doctorProfile.findUnique({
      where: {
        id
      },
      select: {
        id: true,
        verificationStatus: true,
        userId: true,
        user: {
          select: {
            deletedAt: true
          }
        }
      }
    });

    if (!doctor) {
      return jsonError('Dokter tidak ditemukan.', 404);
    }

    if (doctor.user.deletedAt) {
      return jsonError('Akun dokter tidak aktif.', 409);
    }

    const parsed = await parseJson(request, verificationSchema);

    if (parsed.error) {
      return parsed.error;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.doctorProfile.update({
        where: {
          id: doctor.id
        },
        data: {
          verificationStatus: parsed.data.status
        },
        select: adminDoctorSelect
      });

      if (doctor.verificationStatus !== parsed.data.status) {
        await tx.notification.create({
          data: {
            userId: doctor.userId,
            type: 'ACCOUNT',
            title: titles[parsed.data.status],
            body:
              parsed.data.note?.trim() || 'Status verifikasi profil dokter Anda telah diperbarui.',
            data: {
              doctorProfileId: doctor.id
            }
          }
        });
      }

      return result;
    });

    return jsonOk(updated);
  } catch (error) {
    return handleRouteError(error);
  }
}
