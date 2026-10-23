import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth-guard';
import { handleRouteError, jsonError, jsonOk, jsonTooManyRequests, parseJson } from '@/lib/api';
import { rateLimit } from '@/lib/rate-limit';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(72),
  newPassword: z.string().min(8).max(72)
});

export async function POST(request: Request) {
  try {
    const auth = await requireUser();

    if (!auth.ok) {
      return auth.error;
    }

    const limit = rateLimit(`change-password:${auth.user.id}`, 5, 15 * 60 * 1000);

    if (!limit.allowed) {
      return jsonTooManyRequests(limit.resetAt);
    }

    const parsed = await parseJson(request, changePasswordSchema);

    if (parsed.error) {
      return parsed.error;
    }

    const user = await prisma.user.findFirst({
      where: {
        id: auth.user.id,
        deletedAt: null
      },
      select: {
        id: true,
        passwordHash: true
      }
    });

    if (!user) {
      return jsonError('Akun tidak ditemukan.', 404);
    }

    if (!user.passwordHash) {
      return jsonError('Akun ini tidak memiliki password.', 400);
    }

    const currentPasswordValid = await bcrypt.compare(
      parsed.data.currentPassword,
      user.passwordHash
    );

    if (!currentPasswordValid) {
      return jsonError('Password saat ini tidak valid.', 422);
    }

    const samePassword = await bcrypt.compare(parsed.data.newPassword, user.passwordHash);

    if (samePassword) {
      return jsonError('Password baru harus berbeda dari password saat ini.', 422);
    }

    const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);

    await prisma.user.update({
      where: {
        id: user.id
      },
      data: {
        passwordHash
      }
    });

    return jsonOk({ message: 'Password berhasil diubah.' });
  } catch (error) {
    return handleRouteError(error);
  }
}
