import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireFacility } from '@/lib/facility-guard';
import { facilityProfileSelect } from '@/lib/facility';
import { handleRouteError, jsonError, jsonOk, parseJson } from '@/lib/api';
import { logError } from '@/lib/logger';
import {
  deleteCloudinaryAsset,
  isCloudinaryConfigured,
  isValidCloudinaryAsset
} from '@/lib/cloudinary';
import { mediaPairError } from '@/lib/media';

// Tipe tidak bisa diubah sendiri: menentukan akses apotek, dan role hanya disinkronkan oleh admin.
const profileSchema = z
  .object({
    name: z.string().trim().min(2).max(150).optional(),
    description: z.string().trim().max(2000).nullable().optional(),
    address: z.string().trim().max(500).nullable().optional(),
    city: z.string().trim().max(100).nullable().optional(),
    phone: z.string().trim().min(8).max(20).nullable().optional(),
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
    const auth = await requireFacility();

    if (!auth.ok) {
      return auth.error;
    }

    const facility = await prisma.facility.findUnique({
      where: {
        id: auth.facility.id
      },
      select: facilityProfileSelect
    });

    if (!facility) {
      return jsonError('Profil fasilitas tidak ditemukan.', 404);
    }

    return jsonOk(facility);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireFacility();

    if (!auth.ok) {
      return auth.error;
    }

    const parsed = await parseJson(request, profileSchema);

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
        purpose: 'facility-profile-photo',
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
        purpose: 'facility-profile-video',
        url: parsed.data.videoUrl,
        publicId: parsed.data.videoPublicId
      })
    ) {
      return jsonError('Media video tidak valid.', 422);
    }

    const existing = await prisma.facility.findUnique({
      where: {
        id: auth.facility.id
      },
      select: {
        photoPublicId: true,
        videoPublicId: true
      }
    });

    const facility = await prisma.facility.update({
      where: {
        id: auth.facility.id
      },
      data: parsed.data,
      select: facilityProfileSelect
    });

    if (
      existing?.photoPublicId &&
      parsed.data.photoPublicId !== undefined &&
      existing.photoPublicId !== parsed.data.photoPublicId
    ) {
      try {
        await deleteCloudinaryAsset(existing.photoPublicId, 'image');
      } catch (error) {
        logError('cloudinary.cleanup_failed', error, {
          asset: 'facility-photo'
        });
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
        logError('cloudinary.cleanup_failed', error, {
          asset: 'facility-video'
        });
      }
    }

    return jsonOk(facility);
  } catch (error) {
    return handleRouteError(error);
  }
}
