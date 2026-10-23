import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth-guard';
import { handleRouteError, jsonError, jsonOk, parseJson } from '@/lib/api';
import { adminArticleSelect } from '@/lib/article';

const updateSchema = z
  .object({
    title: z.string().trim().min(2).max(200).optional(),
    excerpt: z.string().trim().max(500).nullable().optional(),
    content: z.string().trim().min(20).max(50_000).optional(),
    coverImage: z.string().trim().max(500).nullable().optional(),
    published: z.boolean().optional()
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Minimal satu field harus diisi.'
  });

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
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
      select: adminArticleSelect
    });

    if (!article) {
      return jsonError('Artikel tidak ditemukan.', 404);
    }

    return jsonOk(article);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const auth = await requireRole(['ADMIN']);

    if (!auth.ok) {
      return auth.error;
    }

    const { id } = await context.params;
    const existing = await prisma.article.findUnique({
      where: {
        id
      },
      select: {
        id: true,
        deletedAt: true
      }
    });

    if (!existing) {
      return jsonError('Artikel tidak ditemukan.', 404);
    }

    if (existing.deletedAt) {
      return jsonError('Artikel sudah dihapus. Pulihkan terlebih dahulu.', 409);
    }

    const parsed = await parseJson(request, updateSchema);

    if (parsed.error) {
      return parsed.error;
    }

    const article = await prisma.article.update({
      where: {
        id: existing.id
      },
      data: parsed.data,
      select: adminArticleSelect
    });

    return jsonOk(article);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const auth = await requireRole(['ADMIN']);

    if (!auth.ok) {
      return auth.error;
    }

    const { id } = await context.params;
    const deletedAt = new Date();
    const deleted = await prisma.article.updateMany({
      where: {
        id,
        deletedAt: null
      },
      data: {
        deletedAt,
        published: false
      }
    });

    if (deleted.count === 0) {
      return jsonError('Artikel tidak ditemukan.', 404);
    }

    return jsonOk({
      id,
      deletedAt
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
