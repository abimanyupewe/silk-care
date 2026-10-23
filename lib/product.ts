import type { Prisma } from '@/lib/generated/prisma';
import { prisma } from '@/lib/db';
import { slugify, uniqueSlug } from '@/lib/slug';

export const facilityProductSelect = {
  id: true,
  slug: true,
  name: true,
  description: true,
  price: true,
  stock: true,
  image: true,
  category: true,
  active: true,
  facilityId: true,
  createdAt: true,
  updatedAt: true
} satisfies Prisma.ProductSelect;

export async function createUniqueProductSlug(name: string) {
  return uniqueSlug(slugify(name, 'produk'), async (slug) => {
    const existing = await prisma.product.findUnique({
      where: { slug },
      select: { id: true }
    });

    return Boolean(existing);
  });
}
