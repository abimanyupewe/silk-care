import type { Prisma } from '@/lib/generated/prisma';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth-guard';
import {
  getBoolean,
  getPagination,
  getString,
  handleRouteError,
  jsonCreated,
  jsonOk,
  paginationMeta,
  parseJson
} from '@/lib/api';
import { adminArticleSelect, createUniqueArticleSlug } from '@/lib/article';

const createSchema = z.object({
  title: z.string().trim().min(2).max(200),
  excerpt: z.string().trim().max(500).nullable().optional(),
  content: z.string().trim().min(20).max(50_000),
  coverImage: z.string().trim().max(500).nullable().optional(),
  published: z.boolean().default(false)
});

export async function GET(request: Request) {
  try {
    const auth = await requireRole(['ADMIN']);

    if (!auth.ok) {
      return auth.error;
    }

    const searchParams = new URL(request.url).searchParams;
    const q = getString(searchParams, 'q', 100);
    const published = getBoolean(searchParams, 'published');
    const deleted = getBoolean(searchParams, 'deleted');
    const pagination = getPagination(searchParams, 20);

    const where: Prisma.ArticleWhereInput = {
      deletedAt: deleted ? { not: null } : null
    };

    if (published !== undefined) {
      where.published = published;
    }

    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { slug: { contains: q, mode: 'insensitive' } },
        { excerpt: { contains: q, mode: 'insensitive' } }
      ];
    }

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        orderBy: {
          createdAt: 'desc'
        },
        skip: pagination.skip,
        take: pagination.limit,
        select: adminArticleSelect
      }),
      prisma.article.count({ where })
    ]);

    return jsonOk(articles, paginationMeta(total, pagination));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireRole(['ADMIN']);

    if (!auth.ok) {
      return auth.error;
    }

    const parsed = await parseJson(request, createSchema);

    if (parsed.error) {
      return parsed.error;
    }

    const slug = await createUniqueArticleSlug(parsed.data.title);
    const article = await prisma.article.create({
      data: {
        ...parsed.data,
        slug,
        authorId: auth.user.id
      },
      select: adminArticleSelect
    });

    return jsonCreated(article);
  } catch (error) {
    return handleRouteError(error);
  }
}
