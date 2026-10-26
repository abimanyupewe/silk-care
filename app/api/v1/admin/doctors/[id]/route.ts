import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth-guard';
import { handleRouteError, jsonError, jsonOk, parseJson } from '@/lib/api';
import { adminDoctorDetailSelect } from '@/lib/admin';
import { auditActions, writeAuditLog } from '@/lib/audit';

const updateSchema = z
  .object({
    specialty: z.string().trim().min(2).max(100).optional(),
    bio: z.string().trim().max(2000).nullable().optional(),
    experienceYears: z.number().int().min(0).max(80).nullable().optional(),
    consultationFee: z.number().int().min(0).max(100_000_000).nullable().optional(),
    city: z.string().trim().max(100).nullable().optional(),
    address: z.string().trim().max(500).nullable().optional(),
    latitude: z.number().min(-90).max(90).nullable().optional(),
    longitude: z.number().min(-180).max(180).nullable().optional()
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Minimal satu field harus diisi.'
  });

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
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
      select: adminDoctorDetailSelect
    });

    if (!doctor) {
      return jsonError('Dokter tidak ditemukan.', 404);
    }

    return jsonOk(doctor);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const auth = await requireRole(['ADMIN']);

    if (!auth.ok) {
      return auth.error;
    }

    const { id } = await context.params;
    const existing = await prisma.doctorProfile.findUnique({
      where: {
        id
      },
      select: {
        id: true
      }
    });

    if (!existing) {
      return jsonError('Dokter tidak ditemukan.', 404);
    }

    const parsed = await parseJson(request, updateSchema);

    if (parsed.error) {
      return parsed.error;
    }

    const doctor = await prisma.$transaction(async (tx) => {
      const result = await tx.doctorProfile.update({
        where: {
          id: existing.id
        },
        data: parsed.data,
        select: adminDoctorDetailSelect
      });

      await writeAuditLog(
        {
          actorId: auth.user.id,
          action: auditActions.doctorUpdate,
          targetType: 'DOCTOR',
          targetId: existing.id,
          metadata: {
            fields: Object.keys(parsed.data)
          },
          request
        },
        tx
      );

      return result;
    });

    return jsonOk(doctor);
  } catch (error) {
    return handleRouteError(error);
  }
}
