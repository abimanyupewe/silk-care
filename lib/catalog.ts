import type { Prisma } from '@/lib/generated/prisma';
import { prisma } from '@/lib/db';

export const publicDoctorWhere = {
  verificationStatus: 'VERIFIED',
  user: { deletedAt: null }
} satisfies Prisma.DoctorProfileWhereInput;

export const publicFacilityWhere = {
  verificationStatus: 'VERIFIED',
  user: { deletedAt: null }
} satisfies Prisma.FacilityWhereInput;

export const publicArticleWhere = {
  published: true,
  deletedAt: null
} satisfies Prisma.ArticleWhereInput;

export const publicProductWhere = {
  active: true,
  deletedAt: null,
  facility: {
    verificationStatus: 'VERIFIED',
    user: { deletedAt: null }
  }
} satisfies Prisma.ProductWhereInput;

export const doctorListSelect = {
  id: true,
  slug: true,
  specialty: true,
  bio: true,
  experienceYears: true,
  consultationFee: true,
  city: true,
  address: true,
  createdAt: true,
  user: {
    select: {
      name: true,
      image: true
    }
  }
} satisfies Prisma.DoctorProfileSelect;

export const doctorDetailSelect = {
  ...doctorListSelect,
  latitude: true,
  longitude: true,
  updatedAt: true,
  _count: {
    select: {
      reviews: true
    }
  }
} satisfies Prisma.DoctorProfileSelect;

export const facilityListSelect = {
  id: true,
  slug: true,
  name: true,
  type: true,
  description: true,
  city: true,
  address: true,
  phone: true,
  createdAt: true,
  user: {
    select: {
      image: true
    }
  },
  _count: {
    select: {
      products: true
    }
  }
} satisfies Prisma.FacilitySelect;

export const facilityDetailSelect = {
  ...facilityListSelect,
  latitude: true,
  longitude: true,
  updatedAt: true
} satisfies Prisma.FacilitySelect;

export const articleListSelect = {
  id: true,
  slug: true,
  title: true,
  excerpt: true,
  coverImage: true,
  createdAt: true,
  updatedAt: true,
  author: {
    select: {
      name: true,
      image: true
    }
  }
} satisfies Prisma.ArticleSelect;

export const articleDetailSelect = {
  ...articleListSelect,
  content: true
} satisfies Prisma.ArticleSelect;

export const productSelect = {
  id: true,
  slug: true,
  name: true,
  description: true,
  price: true,
  stock: true,
  image: true,
  category: true,
  createdAt: true,
  facility: {
    select: {
      id: true,
      slug: true,
      name: true,
      city: true,
      type: true
    }
  }
} satisfies Prisma.ProductSelect;

export type RatingSummary = {
  rating: number | null;
  reviewCount: number;
};

function summarizeRating(average: number | null, reviewCount: number): RatingSummary {
  return {
    rating: average === null ? null : Number(average.toFixed(1)),
    reviewCount
  };
}

export async function getDoctorRatings(doctorIds: string[]) {
  if (doctorIds.length === 0) {
    return new Map<string, RatingSummary>();
  }

  const rows = await prisma.review.groupBy({
    by: ['doctorProfileId'],
    where: {
      doctorProfileId: {
        in: doctorIds
      },
      status: 'APPROVED'
    },
    _avg: {
      rating: true
    },
    _count: {
      _all: true
    }
  });

  return new Map(
    rows
      .filter((row) => row.doctorProfileId !== null)
      .map((row) => [
        row.doctorProfileId as string,
        summarizeRating(row._avg.rating, row._count._all)
      ])
  );
}

export async function getFacilityRatings(facilityIds: string[]) {
  if (facilityIds.length === 0) {
    return new Map<string, RatingSummary>();
  }

  const rows = await prisma.review.groupBy({
    by: ['facilityId'],
    where: {
      facilityId: {
        in: facilityIds
      },
      status: 'APPROVED'
    },
    _avg: {
      rating: true
    },
    _count: {
      _all: true
    }
  });

  return new Map(
    rows
      .filter((row) => row.facilityId !== null)
      .map((row) => [row.facilityId as string, summarizeRating(row._avg.rating, row._count._all)])
  );
}
