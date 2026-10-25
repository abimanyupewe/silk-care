import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth-guard';
import { handleRouteError, jsonError, jsonOk, parseJson } from '@/lib/api';
import { refreshReviewTargetRatings } from '@/lib/rating';
import { adminReviewSelect, reviewTargetType } from '@/lib/reviews';
import { sendReviewModerationEmail } from '@/lib/transaction-email';

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
        id: true,
        authorId: true,
        rating: true,
        status: true,
        author: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    if (!existing) {
      return jsonError('Ulasan tidak ditemukan.', 404);
    }

    const changed = existing.status !== parsed.data.status;
    const note = parsed.data.note?.trim() || null;
    const review = await prisma.$transaction(async (tx) => {
      const updated = await tx.review.update({
        where: {
          id
        },
        data: {
          status: parsed.data.status,
          moderatedAt: new Date(),
          moderatedById: auth.user.id,
          moderationNote: note
        },
        select: adminReviewSelect
      });

      if (changed) {
        const approved = parsed.data.status === 'APPROVED';

        await refreshReviewTargetRatings(tx, updated);
        await tx.notification.create({
          data: {
            userId: existing.authorId,
            type: 'REVIEW',
            title: approved ? 'Ulasan ditayangkan' : 'Ulasan tidak disetujui',
            body: approved
              ? note || 'Ulasan Anda telah disetujui dan ditayangkan.'
              : note || 'Ulasan Anda belum disetujui. Periksa catatan moderator.',
            data: {
              reviewId: existing.id,
              status: parsed.data.status
            }
          }
        });
      }

      return updated;
    });

    if (changed && existing.author.email) {
      await sendReviewModerationEmail({
        to: existing.author.email,
        name: existing.author.name,
        rating: existing.rating,
        status: parsed.data.status,
        note
      });
    }

    return jsonOk({
      ...review,
      targetType: reviewTargetType(review)
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
