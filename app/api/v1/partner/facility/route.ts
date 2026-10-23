import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth-guard';
import { handleRouteError, jsonCreated, jsonError, parseJson } from '@/lib/api';
import { createUniqueFacilitySlug, facilityProfileSelect, facilityTypes } from '@/lib/facility';

const facilitySchema = z.object({
  name: z.string().trim().min(2).max(150),
  type: z.enum(facilityTypes),
  description: z.string().trim().max(2000).nullable().optional(),
  address: z.string().trim().max(500).nullable().optional(),
  city: z.string().trim().max(100).nullable().optional(),
  phone: z.string().trim().min(8).max(20).nullable().optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional()
});

export async function POST(request: Request) {
  try {
    const auth = await requireUser();

    if (!auth.ok) {
      return auth.error;
    }

    if (auth.user.role === 'ADMIN') {
      return jsonError('Admin tidak dapat mendaftar sebagai fasilitas mitra.', 403);
    }

    const existing = await prisma.user.findUnique({
      where: {
        id: auth.user.id
      },
      select: {
        doctorProfile: {
          select: {
            id: true
          }
        },
        facility: {
          select: {
            id: true
          }
        }
      }
    });

    if (existing?.doctorProfile) {
      return jsonError('Akun ini sudah memiliki profil dokter.', 409);
    }

    if (existing?.facility) {
      return jsonError('Profil fasilitas sudah terdaftar untuk akun ini.', 409);
    }

    const parsed = await parseJson(request, facilitySchema);

    if (parsed.error) {
      return parsed.error;
    }

    const slug = await createUniqueFacilitySlug(parsed.data.name);
    const role = parsed.data.type === 'PHARMACY' ? 'PHARMACY' : 'FACILITY';
    const facility = await prisma.$transaction(async (tx) => {
      const created = await tx.facility.create({
        data: {
          ...parsed.data,
          slug,
          userId: auth.user.id
        },
        select: facilityProfileSelect
      });

      await tx.user.update({
        where: {
          id: auth.user.id
        },
        data: {
          role
        }
      });

      await tx.notification.create({
        data: {
          userId: auth.user.id,
          type: 'ACCOUNT',
          title: 'Pendaftaran fasilitas diterima',
          body: 'Profil fasilitas Anda menunggu verifikasi admin.',
          data: {
            facilityId: created.id
          }
        }
      });

      return created;
    });

    return jsonCreated(facility);
  } catch (error) {
    return handleRouteError(error);
  }
}
