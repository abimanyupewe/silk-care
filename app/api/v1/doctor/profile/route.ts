import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireDoctorProfile } from '@/lib/doctor-guard';
import { handleRouteError, jsonError, jsonOk, parseJson } from '@/lib/api';
import { doctorProfileSelect } from '@/lib/doctor';
import {
  deleteCloudinaryAsset,
  isCloudinaryConfigured,
  isValidCloudinaryAsset
} from '@/lib/cloudinary';
import { mediaPairError } from '@/lib/media';

const updateSchema = z
  .object({
    specialty: z.string().trim().min(2).max(100).optional(),
    bio: z.string().trim().max(2000).nullable().optional(),
    experienceYears: z.number().int().min(0).max(80).nullable().optional(),
    consultationFee: z.number().int().min(0).max(100_000_000).nullable().optional(),
    city: z.string().trim().max(100).nullable().optional(),
    address: z.string().trim().max(500).nullable().optional(),
    latitude: z.number().min(-90).max(90).nullable().optional(),
    longitude: z.number().min(-180).max(180).nullable().optional(),
    photoUrl: z.string().trim().url().max(2048).nullable().optional(),
    photoPublicId: z.string().trim().min(1).max(500).nullable().optional(),
    videoUrl: z.string().trim().url().max(2048).nullable().optional(),
    videoPublicId: z.string().trim().min(1).max(500).nullable().optional()
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Minimal satu field harus diisi.'
  });

export async function GET() {
  try {
    const auth = await requireDoctorProfile();

    if (!auth.ok) {
      return auth.error;
    }

    const doctor = await prisma.doctorProfile.findUnique({
      where: {
        id: auth.doctor.id
      },
      select: doctorProfileSelect
    });

    if (!doctor) {
      return jsonError('Profil dokter tidak ditemukan.', 404);
    }

    return jsonOk(doctor);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireDoctorProfile();

    if (!auth.ok) {
      return auth.error;
    }

    const parsed = await parseJson(request, updateSchema);

    if (parsed.error) {
      return parsed.error;
    }

    const pairError =
      mediaPairError(parsed.data.photoUrl, parsed.data.photoPublicId) ??
      mediaPairError(parsed.data.videoUrl, parsed.data.videoPublicId);

    if (pairError) {
      return jsonError(pairError, 422);
    }

    if ((parsed.data.photoUrl || parsed.data.videoUrl) && !isCloudinaryConfigured()) {
      return jsonError('Cloudinary belum dikonfigurasi.', 503);
    }

    if (
      parsed.data.photoUrl &&
      parsed.data.photoPublicId &&
      !isValidCloudinaryAsset({
        userId: auth.user.id,
        purpose: 'doctor-profile-photo',
        url: parsed.data.photoUrl,
        publicId: parsed.data.photoPublicId
      })
    ) {
      return jsonError('Media foto tidak valid.', 422);
    }

    if (
      parsed.data.videoUrl &&
      parsed.data.videoPublicId &&
      !isValidCloudinaryAsset({
        userId: auth.user.id,
        purpose: 'doctor-profile-video',
        url: parsed.data.videoUrl,
        publicId: parsed.data.videoPublicId
      })
    ) {
      return jsonError('Media video tidak valid.', 422);
    }

    const existing = await prisma.doctorProfile.findUnique({
      where: {
        id: auth.doctor.id
      },
      select: {
        photoPublicId: true,
        videoPublicId: true
      }
    });

    const doctor = await prisma.doctorProfile.update({
      where: {
        id: auth.doctor.id
      },
      data: parsed.data,
      select: doctorProfileSelect
    });

    if (
      existing?.photoPublicId &&
      parsed.data.photoPublicId !== undefined &&
      existing.photoPublicId !== parsed.data.photoPublicId
    ) {
      try {
        await deleteCloudinaryAsset(existing.photoPublicId, 'image');
      } catch (error) {
        console.error('[cloudinary] gagal menghapus foto lama', error);
      }
    }

    if (
      existing?.videoPublicId &&
      parsed.data.videoPublicId !== undefined &&
      existing.videoPublicId !== parsed.data.videoPublicId
    ) {
      try {
        await deleteCloudinaryAsset(existing.videoPublicId, 'video');
      } catch (error) {
        console.error('[cloudinary] gagal menghapus video lama', error);
      }
    }

    return jsonOk(doctor);
  } catch (error) {
    return handleRouteError(error);
  }
}
