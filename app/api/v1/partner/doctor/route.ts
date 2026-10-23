import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth-guard';
import { handleRouteError, jsonCreated, jsonError, parseJson } from '@/lib/api';
import { createUniqueDoctorSlug, doctorProfileSelect } from '@/lib/doctor';

const doctorSchema = z.object({
  specialty: z.string().trim().min(2).max(100),
  bio: z.string().trim().max(2000).nullable().optional(),
  experienceYears: z.number().int().min(0).max(80).nullable().optional(),
  consultationFee: z.number().int().min(0).max(100_000_000).nullable().optional(),
  city: z.string().trim().max(100).nullable().optional(),
  address: z.string().trim().max(500).nullable().optional(),
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
      return jsonError('Admin tidak dapat mendaftar sebagai dokter mitra.', 403);
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
      return jsonError('Profil dokter sudah terdaftar untuk akun ini.', 409);
    }

    if (existing?.facility) {
      return jsonError('Akun ini sudah memiliki profil fasilitas.', 409);
    }

    const parsed = await parseJson(request, doctorSchema);

    if (parsed.error) {
      return parsed.error;
    }

    const slug = await createUniqueDoctorSlug(auth.user.name || 'dokter');
    const profile = await prisma.$transaction(async (tx) => {
      const created = await tx.doctorProfile.create({
        data: {
          ...parsed.data,
          slug,
          userId: auth.user.id
        },
        select: doctorProfileSelect
      });

      await tx.user.update({
        where: {
          id: auth.user.id
        },
        data: {
          role: 'DOCTOR'
        }
      });

      await tx.notification.create({
        data: {
          userId: auth.user.id,
          type: 'ACCOUNT',
          title: 'Pendaftaran dokter diterima',
          body: 'Profil dokter Anda menunggu verifikasi admin.',
          data: {
            doctorProfileId: created.id
          }
        }
      });

      return created;
    });

    return jsonCreated(profile);
  } catch (error) {
    return handleRouteError(error);
  }
}
