import { issueAuthToken } from '@/lib/auth-token';
import { getAppUrl } from '@/lib/app-url';
import { sendTemplatedEmail } from '@/lib/email-template-store';
import { prisma } from '@/lib/db';

type EmailUser = {
  id: string;
  name: string;
  email: string;
};

async function issueAndSend(
  user: EmailUser,
  type: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET',
  templateKey: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET',
  path: string
) {
  const { token, tokenHash } = await issueAuthToken(user.id, type);
  const link = `${getAppUrl()}${path}?token=${encodeURIComponent(token)}`;

  try {
    await sendTemplatedEmail({
      key: templateKey,
      to: user.email,
      vars: { nama: user.name, link, token }
    });
  } catch (error) {
    await prisma.authToken.deleteMany({
      where: {
        tokenHash
      }
    });
    throw error;
  }
}

export async function sendVerificationEmail(user: EmailUser) {
  await issueAndSend(user, 'EMAIL_VERIFICATION', 'EMAIL_VERIFICATION', '/verify-email');
}

export async function sendPasswordResetEmail(user: EmailUser) {
  await issueAndSend(user, 'PASSWORD_RESET', 'PASSWORD_RESET', '/reset-password');
}
