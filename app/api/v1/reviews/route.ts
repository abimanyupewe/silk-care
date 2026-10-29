import { auditActions, writeAuditLog } from '@/lib/audit';
import { Prisma } from '@/lib/generated/prisma';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth-guard';
import {
  getPagination,
  getString,
  handleRouteError,
  jsonCreated,
  jsonError,
  jsonOk,
  jsonTooManyRequests,
  paginationMeta,
  parseJson
} from '@/lib/api';
import { rateLimit } from '@/lib/rate-limit';
import {
  getReviewTargetOwner,
  publicReviewSelect,
  reviewTargetExists,
  reviewTargetIds,
  reviewTargetTypes,
  reviewTargetWhere
} from '@/lib/reviews';
import { sendReviewReceivedEmail } from '@/lib/transaction-email';

const createReviewSchema = z.object({
  targetType: z.enum(reviewTargetTypes),
  targetId: z.string().trim().min(1).max(100),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(2000).nullable().optional()
});

export async function GET(request: Request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const targetTypeParam = getString(searchParams, 'targetType', 20)?.toLowerCase();
    const targetId = getString(searchParams, 'targetId', 100);
    const targetType = reviewTargetTypes.find((value) => value === targetTypeParam);

    if (!targetType) {
      return jsonError('targetType harus doctor, facility, atau product.', 422);
    }

    if (!targetId) {
      return jsonError('targetId wajib diisi.', 422);
    }

    if (!(await reviewTargetExists(targetType, targetId))) {
      return jsonError('Target ulasan tidak ditemukan.', 404);
    }

    const pagination = getPagination(searchParams);
    const where: Prisma.ReviewWhereInput = {
      ...reviewTargetWhere(targetType, targetId),
      status: 'APPROVED'
    };

    const [reviews, total, aggregate] = await Promise.all([
      prisma.review.findMany({
        where,
        orderBy: {
          createdAt: 'desc'
        },
        skip: pagination.skip,
        take: pagination.limit,
        select: publicReviewSelect
      }),
      prisma.review.count({ where }),
      prisma.review.aggregate({
        where,
        _avg: {
          rating: true
        }
      })
    ]);

    return jsonOk(reviews, {
      ...paginationMeta(total, pagination),
      targetType,
      targetId,
      averageRating:
        aggregate._avg.rating === null ? null : Number(aggregate._avg.rating.toFixed(1))
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireUser();

    if (!auth.ok) {
      return auth.error;
    }

    const limit = await rateLimit(`review:create:${auth.user.id}`, 10, 10 * 60 * 1000);

    if (!limit.allowed) {
      return jsonTooManyRequests(limit.resetAt);
    }

    const parsed = await parseJson(request, createReviewSchema);

    if (parsed.error) {
      return parsed.error;
    }

    const { targetType, targetId, rating, comment } = parsed.data;

    if (!(await reviewTargetExists(targetType, targetId))) {
      return jsonError('Target ulasan tidak ditemukan.', 404);
    }

    const existing = await prisma.review.findFirst({
      where: {
        authorId: auth.user.id,
        ...reviewTargetWhere(targetType, targetId)
      },
      select: {
        id: true
      }
    });

    if (existing) {
      return jsonError('Anda sudah memberi ulasan untuk target ini.', 409);
    }

    const owner = await getReviewTargetOwner(targetType, targetId);
    const review = await prisma.$transaction(async (tx) => {
      const created = await tx.review.create({
        data: {
          authorId: auth.user.id,
          rating,
          comment: comment || null,
          status: 'PENDING',
          isNegative: rating <= 2,
          ...reviewTargetIds(targetType, targetId)
        },
        select: publicReviewSelect
      });

      if (owner && owner.userId !== auth.user.id) {
        await tx.notification.create({
          data: {
            userId: owner.userId,
            type: 'REVIEW',
            title: 'Ulasan baru',
            body: `${auth.user.name || 'Pengguna'} memberi rating ${rating}/5 untuk ${owner.label}.`,
            data: {
              reviewId: created.id,
              targetType,
              targetId
            }
          }
        });
      }

      await writeAuditLog(
        {
          actorId: auth.user.id,
          action: auditActions.reviewCreate,
          targetType: 'REVIEW',
          targetId: created.id,
          metadata: { targetType, targetId, rating },
          request
        },
        tx
      );

      return created;
    });

    if (owner && owner.email && owner.userId !== auth.user.id) {
      await sendReviewReceivedEmail({
        to: owner.email,
        name: owner.name,
        rating
      });
    }

    return jsonCreated(review);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return jsonError('Anda sudah memberi ulasan untuk target ini.', 409);
    }

    return handleRouteError(error);
  }
}
