import type { Prisma } from '@/lib/generated/prisma';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth-guard';
import {
  getEnum,
  getPagination,
  getString,
  handleRouteError,
  jsonCreated,
  jsonError,
  jsonOk,
  paginationMeta,
  parseJson
} from '@/lib/api';
import { articleStatuses, createUniqueArticleSlug, partnerArticleSelect } from '@/lib/article';
import { isCloudinaryConfigured, isValidCloudinaryAsset } from '@/lib/cloudinary';
import { mediaPairError } from '@/lib/media';

const articleSchema = z.object({
  title: z.string().trim().min(2).max(200),
  excerpt: z.string().trim().max(500).nullable().optional(),
  content: z.string().trim().min(20).max(50_000),
  coverImage: z.string().trim().url().max(2048).nullable().optional(),
  coverPublicId: z.string().trim().min(1).max(500).nullable().optional()
});

export async function GET(request: Request) {
  try {
    const auth = await requireRole(['DOCTOR', 'FACILITY', 'PHARMACY']);

    if (!auth.ok) {
      return auth.error;
    }

    const searchParams = new URL(request.url).searchParams;
    const q = getString(searchParams, 'q', 100);
    const status = getEnum(searchParams, 'status', articleStatuses);
    const pagination = getPagination(searchParams, 20);
    const where: Prisma.ArticleWhereInput = {
      authorId: auth.user.id,
      deletedAt: null
    };

    if (status) {
      where.status = status;
    }

    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { excerpt: { contains: q, mode: 'insensitive' } }
      ];
    }

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        orderBy: {
          updatedAt: 'desc'
        },
        skip: pagination.skip,
        take: pagination.limit,
        select: partnerArticleSelect
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
    const auth = await requireRole(['DOCTOR', 'FACILITY', 'PHARMACY']);

    if (!auth.ok) {
      return auth.error;
    }

    const parsed = await parseJson(request, articleSchema);

    if (parsed.error) {
      return parsed.error;
    }

    const pairError = mediaPairError(parsed.data.coverImage, parsed.data.coverPublicId);

    if (pairError) {
      return jsonError(pairError, 422);
    }

    if (parsed.data.coverImage) {
      if (!isCloudinaryConfigured()) {
        return jsonError('Cloudinary belum dikonfigurasi.', 503);
      }

      if (
        !parsed.data.coverPublicId ||
        !isValidCloudinaryAsset({
          userId: auth.user.id,
          purpose: 'article-cover',
          url: parsed.data.coverImage,
          publicId: parsed.data.coverPublicId
        })
      ) {
        return jsonError('Media sampul tidak valid.', 422);
      }
    }

    const slug = await createUniqueArticleSlug(parsed.data.title);
    const article = await prisma.article.create({
      data: {
        ...parsed.data,
        slug,
        authorId: auth.user.id,
        status: 'DRAFT'
      },
      select: partnerArticleSelect
    });

    return jsonCreated(article);
  } catch (error) {
    return handleRouteError(error);
  }
}
