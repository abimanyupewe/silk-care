import type { Prisma } from '@/lib/generated/prisma';
import { prisma } from '@/lib/db';
import { slugify, uniqueSlug } from '@/lib/slug';

export { facilityTypes } from '@/lib/facility-types';

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
  photoUrl: true,
  photoPublicId: true,
  videoUrl: true,
  videoPublicId: true,
  verificationStatus: true,
  details: true,
  internalDetails: true,
  ratingAverage: true,
  reviewCount: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: {
      name: true,
      email: true,
      image: true
    }
  },
  operatingHours: {
    orderBy: {
      dayOfWeek: 'asc'
    },
    select: {
      id: true,
      dayOfWeek: true,
      openTime: true,
      closeTime: true,
      isClosed: true
    }
  }
} satisfies Prisma.FacilitySelect;
