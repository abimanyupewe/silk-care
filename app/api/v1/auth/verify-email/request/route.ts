import { z } from 'zod';
import { prisma } from '@/lib/db';
import { sendVerificationEmail } from '@/lib/auth-email';
import { getClientIp, handleRouteError, jsonOk, jsonTooManyRequests, parseJson } from '@/lib/api';
import { rateLimit } from '@/lib/rate-limit';
import { logError } from '@/lib/logger';

const requestSchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .transform((value) => value.toLowerCase())
});

const genericMessage =
  'Jika email terdaftar dan belum diverifikasi, tautan verifikasi telah dikirim.';

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const ipLimit = await rateLimit(`verify-email-request:ip:${ip}`, 20, 15 * 60 * 1000);

    if (!ipLimit.allowed) {
      return jsonTooManyRequests(ipLimit.resetAt);
    }

    const parsed = await parseJson(request, requestSchema);

    if (parsed.error) {
      return parsed.error;
    }

    const emailLimit = await rateLimit(
      `verify-email-request:email:${parsed.data.email}`,
      5,
      15 * 60 * 1000
    );

    if (!emailLimit.allowed) {
      return jsonTooManyRequests(emailLimit.resetAt);
    }

    const user = await prisma.user.findFirst({
      where: {
        email: parsed.data.email,
        deletedAt: null,
        emailVerified: null
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    });

    if (user) {
      try {
        await sendVerificationEmail(user);
      } catch (error) {
        logError('auth.verification_email_failed', error, {
          userId: user.id
        });
      }
    }

    return jsonOk({ message: genericMessage });
  } catch (error) {
    return handleRouteError(error);
  }
}
