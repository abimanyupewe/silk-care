import type { Prisma } from '@/lib/generated/prisma';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth-guard';
import {
  getBoolean,
  getEnum,
  getInt,
  getPagination,
  getString,
  handleRouteError,
  jsonError,
  jsonOk,
  paginationMeta
} from '@/lib/api';
import {
  adminReviewSelect,
  reviewStatuses,
  reviewTargetType,
  reviewTargetTypes,
  reviewTargetWhere
} from '@/lib/reviews';

export async function GET(request: Request) {
  try {
    const auth = await requireRole(['ADMIN']);

    if (!auth.ok) {
      return auth.error;
    }

    const searchParams = new URL(request.url).searchParams;
    const q = getString(searchParams, 'q', 100);
    const statusParam = getString(searchParams, 'status', 20);
    const status = getEnum(searchParams, 'status', reviewStatuses);
    const targetTypeParam = getString(searchParams, 'targetType', 20)?.toLowerCase();
    const targetId = getString(searchParams, 'targetId', 100);
    const rating = getInt(searchParams, 'rating');
    const isNegative = getBoolean(searchParams, 'isNegative');
    const pagination = getPagination(searchParams, 20);

    if (statusParam && !status) {
      return jsonError('status harus salah satu dari: pending, approved, rejected.', 422);
    }

    if (
      targetTypeParam &&
      !reviewTargetTypes.includes(targetTypeParam as (typeof reviewTargetTypes)[number])
    ) {
      return jsonError('targetType harus doctor, facility, atau product.', 422);
    }

    if (targetId && !targetTypeParam) {
      return jsonError('targetType wajib diisi jika targetId digunakan.', 422);
    }

    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return jsonError('rating harus antara 1 sampai 5.', 422);
    }

    const where: Prisma.ReviewWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (rating !== undefined) {
      where.rating = rating;
    }

    if (isNegative !== undefined) {
      where.isNegative = isNegative;
    }

    if (targetTypeParam && targetId) {
      Object.assign(
        where,
        reviewTargetWhere(targetTypeParam as (typeof reviewTargetTypes)[number], targetId)
      );
    } else if (targetTypeParam === 'doctor') {
      where.doctorProfileId = { not: null };
    } else if (targetTypeParam === 'facility') {
      where.facilityId = { not: null };
    } else if (targetTypeParam === 'product') {
      where.productId = { not: null };
    }

    if (q) {
      where.OR = [
        { comment: { contains: q, mode: 'insensitive' } },
        { author: { name: { contains: q, mode: 'insensitive' } } },
        { author: { email: { contains: q, mode: 'insensitive' } } }
      ];
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        orderBy: {
          createdAt: 'desc'
        },
        skip: pagination.skip,
        take: pagination.limit,
        select: adminReviewSelect
      }),
      prisma.review.count({ where })
    ]);

    return jsonOk(
      reviews.map((review) => ({
        ...review,
        targetType: reviewTargetType(review)
      })),
      paginationMeta(total, pagination)
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
