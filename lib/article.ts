import type { Prisma } from '@/lib/generated/prisma';
import { prisma } from '@/lib/db';
import { slugify, uniqueSlug } from '@/lib/slug';

export const articleStatuses = ['DRAFT', 'PENDING', 'PUBLISHED', 'REJECTED'] as const;

export const adminArticleSelect = {
  id: true,
  slug: true,
  title: true,
  excerpt: true,
  content: true,
  coverImage: true,
  coverPublicId: true,
  status: true,
  reviewNote: true,
  reviewedAt: true,
  authorId: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  author: {
    select: {
      id: true,
      name: true,
      email: true
    }
  }
} satisfies Prisma.ArticleSelect;

export const partnerArticleSelect = {
  id: true,
  slug: true,
  title: true,
  excerpt: true,
  content: true,
  coverImage: true,
  coverPublicId: true,
  status: true,
  reviewNote: true,
  reviewedAt: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true
} satisfies Prisma.ArticleSelect;

export async function createUniqueArticleSlug(title: string) {
  return uniqueSlug(slugify(title, 'artikel'), async (slug) => {
    const existing = await prisma.article.findUnique({
      where: { slug },
      select: { id: true }
    });

    return Boolean(existing);
  });
}
