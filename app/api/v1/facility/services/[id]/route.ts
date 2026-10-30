import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireServiceFacility } from '@/lib/facility-guard';
import { handleRouteError, jsonError, jsonOk, parseJson } from '@/lib/api';
import { facilityServiceSelect } from '@/lib/facility-service';

const updateSchema = z
  .object({
    name: z.string().trim().min(2).max(150).optional(),
    description: z.string().trim().max(2000).nullable().optional(),
    priceMin: z.number().int().min(0).max(100_000_000).optional(),
    priceMax: z.number().int().min(0).max(100_000_000).nullable().optional(),
    durationMinutes: z.number().int().min(5).max(480).optional(),
    active: z.boolean().optional()
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Minimal satu field harus diisi.'
  });

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

async function findService(id: string, facilityId: string) {
  return prisma.facilityService.findFirst({
    where: { id, facilityId, deletedAt: null },
    select: facilityServiceSelect
  });
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const auth = await requireServiceFacility();

    if (!auth.ok) {
      return auth.error;
    }

    const { id } = await context.params;
    const service = await findService(id, auth.facility.id);

    if (!service) {
      return jsonError('Layanan tidak ditemukan.', 404);
    }

    return jsonOk(service);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const auth = await requireServiceFacility();

    if (!auth.ok) {
      return auth.error;
    }

    const { id } = await context.params;
    const existing = await findService(id, auth.facility.id);

    if (!existing) {
      return jsonError('Layanan tidak ditemukan.', 404);
    }

    const parsed = await parseJson(request, updateSchema);

    if (parsed.error) {
      return parsed.error;
    }

    const priceMin = parsed.data.priceMin ?? existing.priceMin;
    const priceMax = parsed.data.priceMax === undefined ? existing.priceMax : parsed.data.priceMax;

    if (priceMax != null && priceMax < priceMin) {
      return jsonError('priceMax tidak boleh lebih kecil dari priceMin.', 422);
    }

    const service = await prisma.facilityService.update({
      where: { id: existing.id },
      data: parsed.data,
      select: facilityServiceSelect
    });

    return jsonOk(service);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const auth = await requireServiceFacility();

    if (!auth.ok) {
      return auth.error;
    }

    const { id } = await context.params;
    const deletedAt = new Date();
    const deleted = await prisma.facilityService.updateMany({
      where: { id, facilityId: auth.facility.id, deletedAt: null },
      data: { active: false, deletedAt }
    });

    if (deleted.count === 0) {
      return jsonError('Layanan tidak ditemukan.', 404);
    }

    return jsonOk({ id, deletedAt });
  } catch (error) {
    return handleRouteError(error);
  }
}
