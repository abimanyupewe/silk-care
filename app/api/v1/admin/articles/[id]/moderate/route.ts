import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth-guard';
import { handleRouteError, jsonError, jsonOk, parseJson } from '@/lib/api';
import { adminArticleSelect } from '@/lib/article';

const moderationSchema = z.object({
  status: z.enum(['PUBLISHED', 'REJECTED']),
  note: z.string().trim().max(1000).nullable().optional()
});

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const auth = await requireRole(['ADMIN']);

    if (!auth.ok) {
      return auth.error;
    }

    const { id } = await context.params;
    const existing = await prisma.article.findFirst({
      where: {
        id,
        deletedAt: null
      },
      select: {
        id: true,
        authorId: true,
        slug: true,
        title: true,
        status: true
      }
    });

    if (!existing) {
      return jsonError('Artikel tidak ditemukan.', 404);
    }

    if (existing.status !== 'PENDING') {
      return jsonError('Hanya artikel berstatus PENDING yang dapat dimoderasi.', 409);
    }

    const parsed = await parseJson(request, moderationSchema);

    if (parsed.error) {
      return parsed.error;
    }

    const approved = parsed.data.status === 'PUBLISHED';
    const note = parsed.data.note?.trim() || null;
    const article = await prisma.$transaction(async (tx) => {
      const updated = await tx.article.update({
        where: {
          id: existing.id
        },
        data: {
          status: parsed.data.status,
          reviewNote: note,
          reviewedAt: new Date()
        },
        select: adminArticleSelect
      });

      await tx.notification.create({
        data: {
          userId: existing.authorId,
          type: 'ARTICLE',
          title: approved ? 'Artikel disetujui' : 'Artikel ditolak',
          body: approved
            ? note || `Artikel "${existing.title}" telah diterbitkan.`
            : note || `Artikel "${existing.title}" belum disetujui. Periksa catatan moderator.`,
          data: {
            articleId: existing.id,
            slug: existing.slug,
            status: parsed.data.status
          }
        }
      });

      return updated;
    });

    return jsonOk(article);
  } catch (error) {
    return handleRouteError(error);
  }
}
