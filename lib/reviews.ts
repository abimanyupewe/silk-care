import type { Prisma } from '@/lib/generated/prisma';
import { prisma } from '@/lib/db';
import { publicDoctorWhere, publicFacilityWhere, publicProductWhere } from '@/lib/catalog';

export const reviewTargetTypes = ['doctor', 'facility', 'product'] as const;

export type ReviewTargetType = (typeof reviewTargetTypes)[number];

export const reviewStatuses = ['PENDING', 'APPROVED', 'REJECTED'] as const;

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

export const adminReviewSelect = {
  id: true,
  rating: true,
  comment: true,
  status: true,
  isNegative: true,
  moderationNote: true,
  moderatedAt: true,
  createdAt: true,
  updatedAt: true,
  doctorProfileId: true,
  facilityId: true,
  productId: true,
  author: {
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      deletedAt: true
    }
  },
  doctorProfile: {
    select: {
      id: true,
      slug: true,
      specialty: true,
      verificationStatus: true,
      user: {
        select: {
          name: true,
          email: true
        }
      }
    }
  },
  facility: {
    select: {
      id: true,
      slug: true,
      name: true,
      type: true,
      verificationStatus: true
    }
  },
  product: {
    select: {
      id: true,
      slug: true,
      name: true,
      facility: {
        select: {
          id: true,
          slug: true,
          name: true
        }
      }
    }
  },
  moderatedBy: {
    select: {
      id: true,
      name: true,
      email: true
    }
  }
} satisfies Prisma.ReviewSelect;

export function reviewTargetType(review: {
  doctorProfileId: string | null;
  facilityId: string | null;
  productId: string | null;
}): ReviewTargetType {
  if (review.doctorProfileId) {
    return 'doctor';
  }

  if (review.facilityId) {
    return 'facility';
  }

  return 'product';
}

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
