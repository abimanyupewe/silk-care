import { createHash, randomBytes } from 'node:crypto';
import type { AuthTokenType } from '@/lib/generated/prisma';
import { prisma } from '@/lib/db';

const tokenTtl: Record<AuthTokenType, number> = {
  EMAIL_VERIFICATION: 24 * 60 * 60 * 1000,
  PASSWORD_RESET: 60 * 60 * 1000
};

export function hashAuthToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export async function issueAuthToken(userId: string, type: AuthTokenType) {
  const token = randomBytes(32).toString('base64url');
  const tokenHash = hashAuthToken(token);
  const expiresAt = new Date(Date.now() + tokenTtl[type]);

  await prisma.$transaction([
    prisma.authToken.deleteMany({
      where: {
        userId,
        type
      }
    }),
    prisma.authToken.create({
      data: {
        userId,
        type,
        tokenHash,
        expiresAt
      }
    })
  ]);

  return { token, tokenHash, expiresAt };
}
