import { z } from 'zod';
import { prisma } from '@/lib/db';
import { hashAuthToken } from '@/lib/auth-token';
import { handleRouteError, jsonError, jsonOk, parseJson } from '@/lib/api';

const confirmSchema = z.object({
  token: z.string().trim().min(20).max(200)
});

const invalidTokenMessage = 'Token verifikasi tidak valid atau sudah kedaluwarsa.';

export async function POST(request: Request) {
  try {
    const parsed = await parseJson(request, confirmSchema);

    if (parsed.error) {
      return parsed.error;
    }

    const tokenHash = hashAuthToken(parsed.data.token);
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
            emailVerified: true,
            deletedAt: true
          }
        }
      }
    });

    if (!record || record.type !== 'EMAIL_VERIFICATION') {
      return jsonError(invalidTokenMessage, 422);
    }

    if (record.usedAt) {
      if (record.user.emailVerified) {
        return jsonOk({ message: 'Email sudah diverifikasi.' });
      }

      return jsonError(invalidTokenMessage, 422);
    }

    if (record.expiresAt <= new Date() || record.user.deletedAt) {
      return jsonError(invalidTokenMessage, 422);
    }

    const now = new Date();

    await prisma.$transaction([
      prisma.authToken.update({
        where: {
          id: record.id
        },
        data: {
          usedAt: now
        }
      }),
      prisma.user.update({
        where: {
          id: record.userId
        },
        data: {
          emailVerified: now
        }
      })
    ]);

    return jsonOk({ message: 'Email berhasil diverifikasi.' });
  } catch (error) {
    return handleRouteError(error);
  }
}
