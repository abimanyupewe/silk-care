import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth-guard';
import { handleRouteError, jsonError, jsonOk, parseJson } from '@/lib/api';
import { adminFacilityDetailSelect } from '@/lib/admin';
import { auditActions, writeAuditLog } from '@/lib/audit';
import { facilityTypes } from '@/lib/facility';

const updateSchema = z
  .object({
    name: z.string().trim().min(2).max(150).optional(),
    type: z.enum(facilityTypes).optional(),
    description: z.string().trim().max(2000).nullable().optional(),
    address: z.string().trim().max(500).nullable().optional(),
    city: z.string().trim().max(100).nullable().optional(),
    phone: z.string().trim().min(8).max(20).nullable().optional(),
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
    const facility = await prisma.facility.findUnique({
      where: {
        id
      },
      select: adminFacilityDetailSelect
    });

    if (!facility) {
      return jsonError('Fasilitas tidak ditemukan.', 404);
    }

    return jsonOk(facility);
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
    const existing = await prisma.facility.findUnique({
      where: {
        id
      },
      select: {
        id: true,
        userId: true,
        type: true,
        user: {
          select: {
            role: true
          }
        }
      }
    });

    if (!existing) {
      return jsonError('Fasilitas tidak ditemukan.', 404);
    }

    const parsed = await parseJson(request, updateSchema);

    if (parsed.error) {
      return parsed.error;
    }

    const nextType = parsed.data.type;

    if (nextType && nextType !== existing.type) {
      if (existing.user.role === 'ADMIN') {
        return jsonError('Admin tidak dapat diubah menjadi role mitra.', 409);
      }

      const role = nextType === 'PHARMACY' ? 'PHARMACY' : 'FACILITY';
      const facility = await prisma.$transaction(async (tx) => {
        const updated = await tx.facility.update({
          where: {
            id: existing.id
          },
          data: parsed.data,
          select: adminFacilityDetailSelect
        });

        await tx.user.update({
          where: {
            id: existing.userId
          },
          data: {
            role
          }
        });

        await writeAuditLog(
          {
            actorId: auth.user.id,
            action: auditActions.facilityUpdate,
            targetType: 'FACILITY',
            targetId: existing.id,
            metadata: {
              fields: Object.keys(parsed.data),
              previousType: existing.type,
              type: nextType,
              ownerRole: role
            },
            request
          },
          tx
        );

        return updated;
      });

      return jsonOk(facility);
    }

    const facility = await prisma.$transaction(async (tx) => {
      const result = await tx.facility.update({
        where: {
          id: existing.id
        },
        data: parsed.data,
        select: adminFacilityDetailSelect
      });

      await writeAuditLog(
        {
          actorId: auth.user.id,
          action: auditActions.facilityUpdate,
          targetType: 'FACILITY',
          targetId: existing.id,
          metadata: {
            fields: Object.keys(parsed.data),
            previousType: existing.type,
            type: nextType ?? existing.type
          },
          request
        },
        tx
      );

      return result;
    });

    return jsonOk(facility);
  } catch (error) {
    return handleRouteError(error);
  }
}
