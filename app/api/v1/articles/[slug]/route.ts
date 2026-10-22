import { prisma } from '@/lib/db';
import { handleRouteError, jsonError, jsonOk } from '@/lib/api';
import { articleDetailSelect, publicArticleWhere } from '@/lib/catalog';

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const article = await prisma.article.findFirst({
      where: {
        ...publicArticleWhere,
        slug
      },
      select: articleDetailSelect
    });

    if (!article) {
      return jsonError('Artikel tidak ditemukan.', 404);
    }

    return jsonOk(article);
  } catch (error) {
    return handleRouteError(error);
  }
}
