import type { Prisma } from '@/lib/generated/prisma';
import { prisma } from '@/lib/db';
import { slugify, uniqueSlug } from '@/lib/slug';

export const publicFacilityServiceSelect = {
  id: true,
  slug: true,
  name: true,
  description: true,
  priceMin: true,
  priceMax: true,
  durationMinutes: true
} satisfies Prisma.FacilityServiceSelect;

export const facilityServiceSelect = {
  ...publicFacilityServiceSelect,
  active: true,
  createdAt: true,
  updatedAt: true
} satisfies Prisma.FacilityServiceSelect;

export async function createUniqueFacilityServiceSlug(name: string) {
  return uniqueSlug(slugify(name, 'layanan'), async (slug) => {
    const existing = await prisma.facilityService.findUnique({
      where: { slug },
      select: { id: true }
    });

    return Boolean(existing);
  });
}
