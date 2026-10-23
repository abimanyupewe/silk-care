import type { Prisma } from '@/lib/generated/prisma';
import { prisma } from '@/lib/db';
import { slugify, uniqueSlug } from '@/lib/slug';

export const facilityTypes = [
  'HOSPITAL',
  'CLINIC',
  'LABORATORY',
  'PHARMACY',
  'PHYSIOTHERAPY',
  'RADIOLOGY',
  'FUNERAL_HOME',
  'WELLNESS'
] as const;

export async function createUniqueFacilitySlug(name: string) {
  return uniqueSlug(slugify(name, 'fasilitas'), async (slug) => {
    const existing = await prisma.facility.findUnique({
      where: { slug },
      select: { id: true }
    });

    return Boolean(existing);
  });
}

export const facilityProfileSelect = {
  id: true,
  slug: true,
  name: true,
  type: true,
  description: true,
  address: true,
  city: true,
  phone: true,
  latitude: true,
  longitude: true,
  verificationStatus: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: {
      name: true,
      email: true,
      image: true
    }
  }
} satisfies Prisma.FacilitySelect;
