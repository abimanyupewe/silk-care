import { z } from 'zod';
import { requireUser } from '@/lib/auth-guard';
import { handleRouteError, jsonError, jsonOk, jsonTooManyRequests, parseJson } from '@/lib/api';
import {
  CloudinaryNotConfiguredError,
  cloudinaryUploadPurposes,
  createCloudinaryUploadSignature,
  isUploadPurposeAllowed
} from '@/lib/cloudinary';
import { rateLimit } from '@/lib/rate-limit';

const signatureSchema = z.object({
  purpose: z.enum(cloudinaryUploadPurposes)
});

export async function POST(request: Request) {
  try {
    const auth = await requireUser();

    if (!auth.ok) {
      return auth.error;
    }

    const limit = await rateLimit(`uploads:signature:${auth.user.id}`, 30, 10 * 60 * 1000);

    if (!limit.allowed) {
      return jsonTooManyRequests(limit.resetAt);
    }

    const parsed = await parseJson(request, signatureSchema);

    if (parsed.error) {
      return parsed.error;
    }

    if (!isUploadPurposeAllowed(parsed.data.purpose, auth.user.role)) {
      return jsonError('Jenis upload tidak sesuai dengan role akun.', 403);
    }

    const signature = createCloudinaryUploadSignature(auth.user.id, parsed.data.purpose);

    return jsonOk(signature);
  } catch (error) {
    if (error instanceof CloudinaryNotConfiguredError) {
      return jsonError('Cloudinary belum dikonfigurasi.', 503);
    }

    return handleRouteError(error);
  }
}
