import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth-guard';
import { handleRouteError, jsonError, jsonOk } from '@/lib/api';
import { adminArticleSelect } from '@/lib/article';
import { auditActions, writeAuditLog } from '@/lib/audit';

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

    const restored = await prisma.$transaction(async (tx) => {
      const result = await tx.article.update({
        where: {
          id: article.id
        },
        data: {
          deletedAt: null,
          status: 'DRAFT'
        },
        select: adminArticleSelect
      });

      await writeAuditLog(
        {
          actorId: auth.user.id,
          action: auditActions.articleRestore,
          targetType: 'ARTICLE',
          targetId: article.id,
          metadata: {
            status: 'DRAFT'
          },
          request
        },
        tx
      );

      return result;
    });

    return jsonOk(restored);
  } catch (error) {
    return handleRouteError(error);
  }
}
