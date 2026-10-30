import { z } from 'zod';
import type { Prisma } from '@/lib/generated/prisma';
import { prisma } from '@/lib/db';
import { requireServiceFacility } from '@/lib/facility-guard';
import {
  getBoolean,
  getPagination,
  getString,
  handleRouteError,
  jsonCreated,
  jsonOk,
  paginationMeta,
  parseJson
} from '@/lib/api';
import { createUniqueFacilityServiceSlug, facilityServiceSelect } from '@/lib/facility-service';

const serviceSchema = z
  .object({
    name: z.string().trim().min(2).max(150),
    description: z.string().trim().max(2000).nullable().optional(),
    priceMin: z.number().int().min(0).max(100_000_000),
    priceMax: z.number().int().min(0).max(100_000_000).nullable().optional(),
    durationMinutes: z.number().int().min(5).max(480).default(30),
    active: z.boolean().default(true)
  })
  .refine((data) => data.priceMax == null || data.priceMax >= data.priceMin, {
    message: 'priceMax tidak boleh lebih kecil dari priceMin.',
    path: ['priceMax']
  });

export async function GET(request: Request) {
  try {
    const auth = await requireServiceFacility();

    if (!auth.ok) {
      return auth.error;
    }

    const searchParams = new URL(request.url).searchParams;
    const q = getString(searchParams, 'q', 100);
    const active = getBoolean(searchParams, 'active');
    const pagination = getPagination(searchParams, 20);
    const where: Prisma.FacilityServiceWhereInput = {
      facilityId: auth.facility.id,
      deletedAt: null
    };

    if (q) {
      where.name = { contains: q, mode: 'insensitive' };
    }

    if (active !== undefined) {
      where.active = active;
    }

    const [services, total] = await Promise.all([
      prisma.facilityService.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
        select: facilityServiceSelect
      }),
      prisma.facilityService.count({ where })
    ]);

    return jsonOk(services, paginationMeta(total, pagination));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireServiceFacility();

    if (!auth.ok) {
      return auth.error;
    }

    const parsed = await parseJson(request, serviceSchema);

    if (parsed.error) {
      return parsed.error;
    }

    const slug = await createUniqueFacilityServiceSlug(parsed.data.name);
    const service = await prisma.facilityService.create({
      data: { ...parsed.data, slug, facilityId: auth.facility.id },
      select: facilityServiceSelect
    });

    return jsonCreated(service);
  } catch (error) {
    return handleRouteError(error);
  }
}
