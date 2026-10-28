import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { hashAuthToken } from '@/lib/auth-token';
import {
  getClientIp,
  handleRouteError,
  jsonError,
  jsonOk,
  jsonTooManyRequests,
  parseJson
} from '@/lib/api';
import { rateLimit } from '@/lib/rate-limit';

const resetSchema = z.object({
  token: z.string().trim().min(20).max(200),
  newPassword: z.string().min(8).max(72)
});

const invalidTokenMessage = 'Token reset password tidak valid atau sudah kedaluwarsa.';

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const ipLimit = await rateLimit(`reset-password:ip:${ip}`, 10, 15 * 60 * 1000);

    if (!ipLimit.allowed) {
      return jsonTooManyRequests(ipLimit.resetAt);
    }

    const parsed = await parseJson(request, resetSchema);

    if (parsed.error) {
      return parsed.error;
    }

    const tokenHash = hashAuthToken(parsed.data.token);
    const tokenLimit = await rateLimit(`reset-password:token:${tokenHash}`, 5, 15 * 60 * 1000);

    if (!tokenLimit.allowed) {
      return jsonTooManyRequests(tokenLimit.resetAt);
    }

    const record = await prisma.authToken.findUnique({
      where: {
        tokenHash
      },
      select: {
        id: true,
        userId: true,
        type: true,
        expiresAt: true,
        usedAt: true,
        user: {
          select: {
            passwordHash: true,
            emailVerified: true,
            deletedAt: true
          }
        }
      }
    });

    if (
      !record ||
      record.type !== 'PASSWORD_RESET' ||
      record.usedAt ||
      record.expiresAt <= new Date() ||
      record.user.deletedAt
    ) {
      return jsonError(invalidTokenMessage, 422);
    }

    if (
      record.user.passwordHash &&
      (await bcrypt.compare(parsed.data.newPassword, record.user.passwordHash))
    ) {
      return jsonError('Password baru harus berbeda dari password saat ini.', 422);
    }

    const now = new Date();
    const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: {
          id: record.userId
        },
        data: {
          passwordHash,
          sessionVersion: {
            increment: 1
          },
          emailVerified: record.user.emailVerified ?? now
        }
      }),
      prisma.authToken.update({
        where: {
          id: record.id
        },
        data: {
          usedAt: now
        }
      }),
      prisma.authToken.deleteMany({
        where: {
          userId: record.userId,
          type: 'PASSWORD_RESET',
          usedAt: null,
          id: {
            not: record.id
          }
        }
      })
    ]);

    return jsonOk({ message: 'Password berhasil direset. Silakan login dengan password baru.' });
  } catch (error) {
    return handleRouteError(error);
  }
}
