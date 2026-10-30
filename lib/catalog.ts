import type { Prisma } from '@/lib/generated/prisma';
import { doctorScheduleSelect, facilityOperatingHourSelect } from '@/lib/schedule';
import { publicFacilityServiceSelect } from '@/lib/facility-service';

export const publicDoctorWhere = {
  verificationStatus: 'VERIFIED',
  user: { deletedAt: null }
} satisfies Prisma.DoctorProfileWhereInput;

export const publicFacilityWhere = {
  verificationStatus: 'VERIFIED',
  user: { deletedAt: null }
} satisfies Prisma.FacilityWhereInput;

export const publicFacilityServiceWhere = {
  active: true,
  deletedAt: null
} satisfies Prisma.FacilityServiceWhereInput;

export const publicArticleWhere = {
  status: 'PUBLISHED',
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
  latitude: true,
  longitude: true,
  ratingAverage: true,
  reviewCount: true,
  createdAt: true,
  photoUrl: true,
  user: {
    select: {
      name: true,
      image: true
    }
  }
} satisfies Prisma.DoctorProfileSelect;

export const doctorDetailSelect = {
  ...doctorListSelect,
  videoUrl: true,
  updatedAt: true,
  schedules: {
    where: {
      isActive: true
    },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    select: doctorScheduleSelect
  },
  _count: {
    select: {
      reviews: {
        where: {
          status: 'APPROVED'
        }
      }
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
  latitude: true,
  longitude: true,
  ratingAverage: true,
  reviewCount: true,
  createdAt: true,
  photoUrl: true,
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
  videoUrl: true,
  updatedAt: true,
  operatingHours: {
    orderBy: {
      dayOfWeek: 'asc'
    },
    select: facilityOperatingHourSelect
  },
  services: {
    where: publicFacilityServiceWhere,
    orderBy: {
      name: 'asc'
    },
    select: publicFacilityServiceSelect
  }
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
