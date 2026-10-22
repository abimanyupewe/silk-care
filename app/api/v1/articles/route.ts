import type { Prisma } from '@/lib/generated/prisma';
import { prisma } from '@/lib/db';
import { getPagination, getString, handleRouteError, jsonOk, paginationMeta } from '@/lib/api';
import { articleListSelect, publicArticleWhere } from '@/lib/catalog';

const articleSorts = {
  newest: { createdAt: 'desc' },
  oldest: { createdAt: 'asc' },
  title: { title: 'asc' }
} satisfies Record<string, Prisma.ArticleOrderByWithRelationInput>;

export async function GET(request: Request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const q = getString(searchParams, 'q');
    const sort = getString(searchParams, 'sort', 20) as keyof typeof articleSorts | undefined;

    const where: Prisma.ArticleWhereInput = { ...publicArticleWhere };

    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { excerpt: { contains: q, mode: 'insensitive' } }
      ];
    }

    const pagination = getPagination(searchParams);
    const [items, total] = await Promise.all([
      prisma.article.findMany({
        where,
        orderBy: sort && articleSorts[sort] ? articleSorts[sort] : articleSorts.newest,
        skip: pagination.skip,
        take: pagination.limit,
        select: articleListSelect
      }),
      prisma.article.count({ where })
    ]);

    return jsonOk(items, paginationMeta(total, pagination));
  } catch (error) {
    return handleRouteError(error);
  }
}
