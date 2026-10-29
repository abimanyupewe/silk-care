import { auditActions, recordActivity } from '@/lib/audit';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { Prisma } from '@/lib/generated/prisma';
import { handleRouteError, jsonCreated, jsonError, parseJson } from '@/lib/api';
import { sendVerificationEmail } from '@/lib/auth-email';
import { logError } from '@/lib/logger';

const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z
    .string()
    .trim()
    .email()
    .transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(72),
  phone: z.string().trim().min(8).max(20).optional()
});

export async function POST(request: Request) {
  const parsed = await parseJson(request, registerSchema);

  if (parsed.error) {
    return parsed.error;
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  try {
    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone,
        passwordHash
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    await recordActivity({
      actorId: user.id,
      action: auditActions.userRegister,
      targetType: 'USER',
      targetId: user.id,
      request
    });

    try {
      await sendVerificationEmail(user);
    } catch (error) {
      logError('auth.verification_email_failed', error, {
        userId: user.id
      });
    }

    return jsonCreated(user);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return jsonError('Email sudah terdaftar.', 409);
    }

    return handleRouteError(error);
  }
}
