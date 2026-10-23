import type { Prisma } from '@/lib/generated/prisma';
import { prisma } from '@/lib/db';
import {
  getInt,
  getPagination,
  getString,
  handleRouteError,
  jsonError,
  jsonOk,
  paginationMeta
} from '@/lib/api';
import { productSelect, publicProductWhere } from '@/lib/catalog';

const productSorts = {
  newest: { createdAt: 'desc' },
  name: { name: 'asc' },
  price_asc: { price: 'asc' },
  price_desc: { price: 'desc' }
} satisfies Record<string, Prisma.ProductOrderByWithRelationInput>;

export async function GET(request: Request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const q = getString(searchParams, 'q');
    const category = getString(searchParams, 'category', 100);
    const facilityId = getString(searchParams, 'facilityId', 100);
    const minPrice = getInt(searchParams, 'minPrice');
    const maxPrice = getInt(searchParams, 'maxPrice');
    const sort = getString(searchParams, 'sort', 30) as keyof typeof productSorts | undefined;

    if (minPrice !== undefined && minPrice < 0) {
      return jsonError('minPrice tidak boleh negatif.', 422);
    }

    if (maxPrice !== undefined && maxPrice < 0) {
      return jsonError('maxPrice tidak boleh negatif.', 422);
    }

    if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
      return jsonError('minPrice tidak boleh lebih besar dari maxPrice.', 422);
    }

    const where: Prisma.ProductWhereInput = { ...publicProductWhere };

    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { category: { contains: q, mode: 'insensitive' } }
      ];
    }

    if (category) {
      where.category = { equals: category, mode: 'insensitive' };
    }

    if (facilityId) {
      where.facilityId = facilityId;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = { gte: minPrice, lte: maxPrice };
    }

    const pagination = getPagination(searchParams);
    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: sort && productSorts[sort] ? productSorts[sort] : productSorts.newest,
        skip: pagination.skip,
        take: pagination.limit,
        select: productSelect
      }),
      prisma.product.count({ where })
    ]);

    return jsonOk(items, paginationMeta(total, pagination));
  } catch (error) {
    return handleRouteError(error);
  }
}
