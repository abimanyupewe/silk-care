import type { Prisma } from '@/lib/generated/prisma';
import { doctorScheduleSelect, facilityOperatingHourSelect } from '@/lib/schedule';

export const verificationStatuses = ['PENDING', 'VERIFIED', 'REJECTED'] as const;

export const userRoles = ['PATIENT', 'DOCTOR', 'FACILITY', 'PHARMACY', 'ADMIN'] as const;

export const adminUserSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  image: true,
  role: true,
  emailVerified: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  doctorProfile: {
    select: {
      id: true,
      slug: true,
      specialty: true,
      verificationStatus: true
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
  }
} satisfies Prisma.UserSelect;

export const adminDoctorSelect = {
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
  verificationStatus: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      image: true,
      deletedAt: true
    }
  }
} satisfies Prisma.DoctorProfileSelect;

export const adminDoctorDetailSelect = {
  ...adminDoctorSelect,
  photoUrl: true,
  photoPublicId: true,
  videoUrl: true,
  videoPublicId: true,
  schedules: {
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    select: doctorScheduleSelect
  }
} satisfies Prisma.DoctorProfileSelect;

export const adminFacilitySelect = {
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
      id: true,
      name: true,
      email: true,
      phone: true,
      image: true,
      deletedAt: true
    }
  },
  _count: {
    select: {
      products: true
    }
  }
} satisfies Prisma.FacilitySelect;

export const adminFacilityDetailSelect = {
  ...adminFacilitySelect,
  photoUrl: true,
  photoPublicId: true,
  videoUrl: true,
  videoPublicId: true,
  operatingHours: {
    orderBy: {
      dayOfWeek: 'asc'
    },
    select: facilityOperatingHourSelect
  }
} satisfies Prisma.FacilitySelect;
