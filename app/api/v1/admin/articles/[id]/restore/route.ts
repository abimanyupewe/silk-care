import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth-guard';
import { handleRouteError, jsonError, jsonOk } from '@/lib/api';
import { adminArticleSelect } from '@/lib/article';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    const auth = await requireRole(['ADMIN']);

    if (!auth.ok) {
      return auth.error;
    }

    const { id } = await context.params;
    const article = await prisma.article.findUnique({
      where: {
        id
      },
      select: {
        id: true
      }
    });

    if (!article) {
      return jsonError('Artikel tidak ditemukan.', 404);
    }

    const restored = await prisma.article.update({
      where: {
        id: article.id
      },
      data: {
        deletedAt: null,
        published: false
      },
      select: adminArticleSelect
    });

    return jsonOk(restored);
  } catch (error) {
    return handleRouteError(error);
  }
}
