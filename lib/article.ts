import type { Prisma } from '@/lib/generated/prisma';
import { prisma } from '@/lib/db';
import { slugify, uniqueSlug } from '@/lib/slug';

export const adminArticleSelect = {
  id: true,
  slug: true,
  title: true,
  excerpt: true,
  content: true,
  coverImage: true,
  published: true,
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

export async function createUniqueArticleSlug(title: string) {
  return uniqueSlug(slugify(title, 'artikel'), async (slug) => {
    const existing = await prisma.article.findUnique({
      where: { slug },
      select: { id: true }
    });

    return Boolean(existing);
  });
}
