import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth-guard';
import { handleRouteError, jsonError, jsonOk } from '@/lib/api';
import { partnerArticleSelect } from '@/lib/article';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    const auth = await requireRole(['DOCTOR', 'FACILITY', 'PHARMACY']);

    if (!auth.ok) {
      return auth.error;
    }

    const { id } = await context.params;
    const existing = await prisma.article.findFirst({
      where: {
        id,
        authorId: auth.user.id,
        deletedAt: null
      },
      select: {
        id: true,
        status: true
      }
    });

    if (!existing) {
      return jsonError('Artikel tidak ditemukan.', 404);
    }

    if (existing.status === 'PENDING') {
      return jsonError('Artikel sedang ditinjau.', 409);
    }

    if (existing.status === 'PUBLISHED') {
      return jsonError('Artikel sudah terbit.', 409);
    }

    const article = await prisma.article.update({
      where: {
        id: existing.id
      },
      data: {
        status: 'PENDING',
        reviewNote: null,
        reviewedAt: null
      },
      select: partnerArticleSelect
    });

    return jsonOk(article);
  } catch (error) {
    return handleRouteError(error);
  }
}
