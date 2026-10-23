import type { Prisma } from '@/lib/generated/prisma';
import { prisma } from '@/lib/db';
import { publicDoctorWhere, publicFacilityWhere, publicProductWhere } from '@/lib/catalog';

export const reviewTargetTypes = ['doctor', 'facility', 'product'] as const;

export type ReviewTargetType = (typeof reviewTargetTypes)[number];

export const publicReviewSelect = {
  id: true,
  rating: true,
  comment: true,
  createdAt: true,
  updatedAt: true,
  author: {
    select: {
      name: true,
      image: true
    }
  }
} satisfies Prisma.ReviewSelect;

export function reviewTargetWhere(
  type: ReviewTargetType,
  targetId: string
): Prisma.ReviewWhereInput {
  if (type === 'doctor') {
    return { doctorProfileId: targetId };
  }

  if (type === 'facility') {
    return { facilityId: targetId };
  }

  return { productId: targetId };
}

export function reviewTargetIds(type: ReviewTargetType, targetId: string) {
  return {
    doctorProfileId: type === 'doctor' ? targetId : null,
    facilityId: type === 'facility' ? targetId : null,
    productId: type === 'product' ? targetId : null
  };
}

export async function reviewTargetExists(type: ReviewTargetType, targetId: string) {
  if (type === 'doctor') {
    const target = await prisma.doctorProfile.findFirst({
      where: {
        ...publicDoctorWhere,
        id: targetId
      },
      select: { id: true }
    });

    return Boolean(target);
  }

  if (type === 'facility') {
    const target = await prisma.facility.findFirst({
      where: {
        ...publicFacilityWhere,
        id: targetId
      },
      select: { id: true }
    });

    return Boolean(target);
  }

  const target = await prisma.product.findFirst({
    where: {
      ...publicProductWhere,
      id: targetId
    },
    select: { id: true }
  });

  return Boolean(target);
}
