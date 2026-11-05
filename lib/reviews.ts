import type { Prisma } from '@/lib/generated/prisma';
import { prisma } from '@/lib/db';
import { publicDoctorWhereAt, publicFacilityWhereAt, publicProductWhereAt } from '@/lib/catalog';

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

export async function getReviewTargetOwner(type: ReviewTargetType, targetId: string) {
  if (type === 'doctor') {
    const doctor = await prisma.doctorProfile.findUnique({
      where: {
        id: targetId
      },
      select: {
        userId: true,
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    if (!doctor) {
      return null;
    }

    return {
      userId: doctor.userId,
      name: doctor.user.name,
      email: doctor.user.email,
      label: `Dokter ${doctor.user.name}`
    };
  }

  if (type === 'facility') {
    const facility = await prisma.facility.findUnique({
      where: {
        id: targetId
      },
      select: {
        userId: true,
        name: true,
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    if (!facility) {
      return null;
    }

    return {
      userId: facility.userId,
      name: facility.user.name,
      email: facility.user.email,
      label: facility.name
    };
  }

  const product = await prisma.product.findUnique({
    where: {
      id: targetId
    },
    select: {
      name: true,
      facility: {
        select: {
          userId: true,
          name: true,
          user: {
            select: {
              name: true,
              email: true
            }
          }
        }
      }
    }
  });

  if (!product) {
    return null;
  }

  return {
    userId: product.facility.userId,
    name: product.facility.user.name,
    email: product.facility.user.email,
    label: `${product.name} (${product.facility.name})`
  };
}

export async function reviewTargetExists(type: ReviewTargetType, targetId: string) {
  if (type === 'doctor') {
    const target = await prisma.doctorProfile.findFirst({
      where: {
        ...publicDoctorWhereAt(new Date()),
        id: targetId
      },
      select: { id: true }
    });

    return Boolean(target);
  }

  if (type === 'facility') {
    const target = await prisma.facility.findFirst({
      where: {
        ...publicFacilityWhereAt(new Date()),
        id: targetId
      },
      select: { id: true }
    });

    return Boolean(target);
  }

  const target = await prisma.product.findFirst({
    where: {
      ...publicProductWhereAt(new Date()),
      id: targetId
    },
    select: { id: true }
  });

  return Boolean(target);
}
