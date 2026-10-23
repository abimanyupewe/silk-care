import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth-guard';
import { handleRouteError, jsonError, jsonOk, parseJson } from '@/lib/api';
import { partnerArticleSelect } from '@/lib/article';
import {
  deleteCloudinaryAsset,
  isCloudinaryConfigured,
  isValidCloudinaryAsset
} from '@/lib/cloudinary';
import { mediaPairError } from '@/lib/media';

const updateSchema = z
  .object({
    title: z.string().trim().min(2).max(200).optional(),
    excerpt: z.string().trim().max(500).nullable().optional(),
    content: z.string().trim().min(20).max(50_000).optional(),
    coverImage: z.string().trim().url().max(2048).nullable().optional(),
    coverPublicId: z.string().trim().min(1).max(500).nullable().optional()
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
    const auth = await requireRole(['DOCTOR', 'FACILITY', 'PHARMACY']);

    if (!auth.ok) {
      return auth.error;
    }

    const { id } = await context.params;
    const article = await prisma.article.findFirst({
      where: {
        id,
        authorId: auth.user.id,
        deletedAt: null
      },
      select: partnerArticleSelect
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
        status: true,
        coverPublicId: true
      }
    });

    if (!existing) {
      return jsonError('Artikel tidak ditemukan.', 404);
    }

    if (existing.status === 'PENDING') {
      return jsonError('Artikel sedang ditinjau dan belum dapat diubah.', 409);
    }

    if (existing.status === 'PUBLISHED') {
      return jsonError('Artikel sudah terbit dan belum dapat diubah.', 409);
    }

    const parsed = await parseJson(request, updateSchema);

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

    const article = await prisma.article.update({
      where: {
        id: existing.id
      },
      data: {
        ...parsed.data,
        ...(existing.status === 'REJECTED'
          ? {
              status: 'DRAFT',
              reviewNote: null,
              reviewedAt: null
            }
          : {})
      },
      select: partnerArticleSelect
    });

    if (
      existing.coverPublicId &&
      parsed.data.coverPublicId !== undefined &&
      existing.coverPublicId !== parsed.data.coverPublicId
    ) {
      try {
        await deleteCloudinaryAsset(existing.coverPublicId, 'image');
      } catch (error) {
        console.error('[cloudinary] gagal menghapus sampul lama', error);
      }
    }

    return jsonOk(article);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const auth = await requireRole(['DOCTOR', 'FACILITY', 'PHARMACY']);

    if (!auth.ok) {
      return auth.error;
    }

    const { id } = await context.params;
    const deletedAt = new Date();
    const deleted = await prisma.article.updateMany({
      where: {
        id,
        authorId: auth.user.id,
        deletedAt: null
      },
      data: {
        deletedAt,
        status: 'DRAFT'
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
