import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth-guard';
import { handleRouteError, jsonError, jsonOk, parseJson } from '@/lib/api';
import { adminReviewSelect, reviewTargetType } from '@/lib/reviews';

const moderateReviewSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  note: z.string().trim().max(1000).nullable().optional()
});

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const auth = await requireRole(['ADMIN']);

    if (!auth.ok) {
      return auth.error;
    }

    const { id } = await context.params;
    const parsed = await parseJson(request, moderateReviewSchema);

    if (parsed.error) {
      return parsed.error;
    }

    const existing = await prisma.review.findUnique({
      where: {
        id
      },
      select: {
        id: true
      }
    });

    if (!existing) {
      return jsonError('Ulasan tidak ditemukan.', 404);
    }

    const review = await prisma.review.update({
      where: {
        id
      },
      data: {
        status: parsed.data.status,
        moderatedAt: new Date(),
        moderatedById: auth.user.id,
        moderationNote: parsed.data.note || null
      },
      select: adminReviewSelect
    });

    return jsonOk({
      ...review,
      targetType: reviewTargetType(review)
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
