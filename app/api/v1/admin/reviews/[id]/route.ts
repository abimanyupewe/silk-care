import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth-guard';
import { handleRouteError, jsonError, jsonOk } from '@/lib/api';
import { adminReviewSelect, reviewTargetType } from '@/lib/reviews';

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
    const review = await prisma.review.findUnique({
      where: {
        id
      },
      select: adminReviewSelect
    });

    if (!review) {
      return jsonError('Ulasan tidak ditemukan.', 404);
    }

    return jsonOk({
      ...review,
      targetType: reviewTargetType(review)
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
