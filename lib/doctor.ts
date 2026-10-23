import type { Prisma } from '@/lib/generated/prisma';
import { prisma } from '@/lib/db';
import { slugify, uniqueSlug } from '@/lib/slug';

export const doctorProfileSelect = {
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
      name: true,
      email: true,
      phone: true,
      image: true
    }
  }
} satisfies Prisma.DoctorProfileSelect;

export async function createUniqueDoctorSlug(name: string) {
  return uniqueSlug(slugify(name, 'dokter'), async (slug) => {
    const existing = await prisma.doctorProfile.findUnique({
      where: { slug },
      select: { id: true }
    });

    return Boolean(existing);
  });
}
