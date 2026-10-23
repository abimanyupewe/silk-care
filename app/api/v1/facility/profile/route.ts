import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireFacility } from '@/lib/facility-guard';
import { facilityProfileSelect, facilityTypes } from '@/lib/facility';
import { handleRouteError, jsonError, jsonOk, parseJson } from '@/lib/api';

const profileSchema = z
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

export async function GET() {
  try {
    const auth = await requireFacility();

    if (!auth.ok) {
      return auth.error;
    }

    const facility = await prisma.facility.findUnique({
      where: {
        id: auth.facility.id
      },
      select: facilityProfileSelect
    });

    if (!facility) {
      return jsonError('Profil fasilitas tidak ditemukan.', 404);
    }

    return jsonOk(facility);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireFacility();

    if (!auth.ok) {
      return auth.error;
    }

    const parsed = await parseJson(request, profileSchema);

    if (parsed.error) {
      return parsed.error;
    }

    const facility = await prisma.facility.update({
      where: {
        id: auth.facility.id
      },
      data: parsed.data,
      select: facilityProfileSelect
    });

    return jsonOk(facility);
  } catch (error) {
    return handleRouteError(error);
  }
}
