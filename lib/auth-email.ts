import { issueAuthToken } from '@/lib/auth-token';
import { getAppUrl } from '@/lib/app-url';
import { sendEmail } from '@/lib/email';
import { prisma } from '@/lib/db';

type EmailUser = {
  id: string;
  name: string;
  email: string;
};

async function issueAndSend(
  user: EmailUser,
  type: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET',
  subject: string,
  buildText: (link: string, token: string) => string,
  path: string
) {
  const { token, tokenHash } = await issueAuthToken(user.id, type);
  const link = `${getAppUrl()}${path}?token=${encodeURIComponent(token)}`;

  try {
    await sendEmail({
      to: user.email,
      subject,
      text: buildText(link, token)
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
  await issueAndSend(
    user,
    'EMAIL_VERIFICATION',
    'Verifikasi email SILK',
    (link, token) =>
      [
        `Halo ${user.name},`,
        '',
        'Terima kasih telah mendaftar di SILK. Verifikasi alamat email Anda dengan membuka tautan berikut:',
        link,
        '',
        `Token verifikasi: ${token}`,
        '',
        'Tautan dan token berlaku selama 24 jam.',
        'Jika Anda tidak merasa membuat akun SILK, abaikan email ini.'
      ].join('\n'),
    '/verify-email'
  );
}

export async function sendPasswordResetEmail(user: EmailUser) {
  await issueAndSend(
    user,
    'PASSWORD_RESET',
    'Reset password SILK',
    (link, token) =>
      [
        `Halo ${user.name},`,
        '',
        'Kami menerima permintaan untuk mengatur ulang password akun SILK Anda. Buka tautan berikut:',
        link,
        '',
        `Token reset password: ${token}`,
        '',
        'Tautan dan token berlaku selama 1 jam.',
        'Jika Anda tidak meminta reset password, abaikan email ini. Password Anda tidak berubah.'
      ].join('\n'),
    '/reset-password'
  );
}
