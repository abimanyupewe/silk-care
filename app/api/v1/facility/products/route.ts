import { Prisma } from '@/lib/generated/prisma';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireFacility } from '@/lib/facility-guard';
import {
  getBoolean,
  getPagination,
  getString,
  handleRouteError,
  jsonCreated,
  jsonError,
  jsonOk,
  paginationMeta,
  parseJson
} from '@/lib/api';
import { createUniqueProductSlug, facilityProductSelect } from '@/lib/product';

const productSchema = z.object({
  name: z.string().trim().min(2).max(150),
  description: z.string().trim().max(2000).nullable().optional(),
  price: z.number().int().min(1).max(100_000_000),
  stock: z.number().int().min(0).max(1_000_000).default(0),
  image: z.string().trim().max(500).nullable().optional(),
  category: z.string().trim().max(100).nullable().optional(),
  active: z.boolean().default(true)
});

export async function GET(request: Request) {
  try {
    const auth = await requireFacility();

    if (!auth.ok) {
      return auth.error;
    }

    const searchParams = new URL(request.url).searchParams;
    const q = getString(searchParams, 'q', 100);
    const active = getBoolean(searchParams, 'active');
    const pagination = getPagination(searchParams, 20);

    const where: Prisma.ProductWhereInput = {
      facilityId: auth.facility.id,
      deletedAt: null
    };

    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { slug: { contains: q, mode: 'insensitive' } },
        { category: { contains: q, mode: 'insensitive' } }
      ];
    }

    if (active !== undefined) {
      where.active = active;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: {
          createdAt: 'desc'
        },
        skip: pagination.skip,
        take: pagination.limit,
        select: facilityProductSelect
      }),
      prisma.product.count({ where })
    ]);

    return jsonOk(products, {
      ...paginationMeta(total, pagination),
      facility: auth.facility
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireFacility();

    if (!auth.ok) {
      return auth.error;
    }

    const parsed = await parseJson(request, productSchema);

    if (parsed.error) {
      return parsed.error;
    }

    const slug = await createUniqueProductSlug(parsed.data.name);

    try {
      const product = await prisma.product.create({
        data: {
          ...parsed.data,
          slug,
          facilityId: auth.facility.id
        },
        select: facilityProductSelect
      });

      return jsonCreated(product);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return jsonError('Slug produk sudah digunakan. Coba nama lain.', 409);
      }

      throw error;
    }
  } catch (error) {
    return handleRouteError(error);
  }
}
