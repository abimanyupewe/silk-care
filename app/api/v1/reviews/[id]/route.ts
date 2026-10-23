import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth-guard';
import { handleRouteError, jsonError, jsonOk, parseJson } from '@/lib/api';
import { publicReviewSelect } from '@/lib/reviews';

const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().trim().max(2000).nullable().optional()
});

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const auth = await requireUser();

    if (!auth.ok) {
      return auth.error;
    }

    const { id } = await context.params;
    const parsed = await parseJson(request, updateReviewSchema);

    if (parsed.error) {
      return parsed.error;
    }

    const { rating, comment } = parsed.data;

    if (rating === undefined && comment === undefined) {
      return jsonError('Minimal satu field harus diisi.', 422);
    }

    const existing = await prisma.review.findUnique({
      where: {
        id
      },
      select: {
        id: true,
        authorId: true
      }
    });

    if (!existing) {
      return jsonError('Ulasan tidak ditemukan.', 404);
    }

    if (existing.authorId !== auth.user.id) {
      return jsonError('Akses ditolak.', 403);
    }

    const review = await prisma.review.update({
      where: {
        id
      },
      data: {
        ...(rating !== undefined ? { rating, isNegative: rating <= 2 } : {}),
        ...(comment !== undefined ? { comment: comment || null } : {}),
        status: 'PENDING',
        moderatedAt: null,
        moderatedById: null,
        moderationNote: null
      },
      select: publicReviewSelect
    });

    return jsonOk(review);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const auth = await requireUser();

    if (!auth.ok) {
      return auth.error;
    }

    const { id } = await context.params;
    const existing = await prisma.review.findUnique({
      where: {
        id
      },
      select: {
        id: true,
        authorId: true
      }
    });

    if (!existing) {
      return jsonError('Ulasan tidak ditemukan.', 404);
    }

    if (existing.authorId !== auth.user.id && auth.user.role !== 'ADMIN') {
      return jsonError('Akses ditolak.', 403);
    }

    await prisma.review.delete({
      where: {
        id
      }
    });

    return jsonOk({ id, message: 'Ulasan berhasil dihapus.' });
  } catch (error) {
    return handleRouteError(error);
  }
}
