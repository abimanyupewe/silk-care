import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireShopFacility } from '@/lib/facility-guard';
import { handleRouteError, jsonError, jsonOk, parseJson } from '@/lib/api';
import { facilityProductSelect } from '@/lib/product';

const updateSchema = z
  .object({
    name: z.string().trim().min(2).max(150).optional(),
    description: z.string().trim().max(2000).nullable().optional(),
    price: z.number().int().min(1).max(100_000_000).optional(),
    stock: z.number().int().min(0).max(1_000_000).optional(),
    image: z.string().trim().max(500).nullable().optional(),
    category: z.string().trim().max(100).nullable().optional(),
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

async function findProduct(id: string, facilityId: string) {
  return prisma.product.findFirst({
    where: {
      id,
      facilityId,
      deletedAt: null
    },
    select: facilityProductSelect
  });
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const auth = await requireShopFacility();

    if (!auth.ok) {
      return auth.error;
    }

    const { id } = await context.params;
    const product = await findProduct(id, auth.facility.id);

    if (!product) {
      return jsonError('Produk tidak ditemukan.', 404);
    }

    return jsonOk(product);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const auth = await requireShopFacility();

    if (!auth.ok) {
      return auth.error;
    }

    const { id } = await context.params;
    const existing = await findProduct(id, auth.facility.id);

    if (!existing) {
      return jsonError('Produk tidak ditemukan.', 404);
    }

    const parsed = await parseJson(request, updateSchema);

    if (parsed.error) {
      return parsed.error;
    }

    const product = await prisma.product.update({
      where: {
        id: existing.id
      },
      data: parsed.data,
      select: facilityProductSelect
    });

    return jsonOk(product);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const auth = await requireShopFacility();

    if (!auth.ok) {
      return auth.error;
    }

    const { id } = await context.params;
    const deletedAt = new Date();
    const deleted = await prisma.product.updateMany({
      where: {
        id,
        facilityId: auth.facility.id,
        deletedAt: null
      },
      data: {
        active: false,
        deletedAt
      }
    });

    if (deleted.count === 0) {
      return jsonError('Produk tidak ditemukan.', 404);
    }

    return jsonOk({
      id,
      deletedAt
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
