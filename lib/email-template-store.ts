import type { UserRole } from '@/lib/generated/prisma';
import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { logError } from '@/lib/logger';
import {
  getEmailTemplateDef,
  renderEmailSubject,
  renderEmailText,
  type EmailAudience
} from '@/lib/email-templates';

export function audienceForRole(role: UserRole | null | undefined): EmailAudience {
  if (role === 'DOCTOR') return 'DOCTOR';
  if (role === 'FACILITY' || role === 'PHARMACY') return 'FACILITY';

  return 'PATIENT';
}

async function audienceForEmail(email: string) {
  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
    select: { role: true }
  });

  return audienceForRole(user?.role);
}

// Melempar error jika pengiriman gagal; pemanggil yang memutuskan best-effort atau tidak.
export async function sendTemplatedEmail(input: {
  key: string;
  to: string;
  vars: Record<string, string>;
  // Jika kosong, audiens ditentukan dari peran pemilik email.
  audience?: EmailAudience;
}) {
  const def = getEmailTemplateDef(input.key);

  if (!def) {
    throw new Error(`Template email tidak dikenal: ${input.key}`);
  }

  let subject = def.subject;
  let body = def.body;

  // Gagal membaca override tidak boleh menggagalkan email; pakai teks default.
  try {
    const audience = input.audience ?? (await audienceForEmail(input.to));
    const override = await prisma.emailTemplate.findUnique({
      where: { key_audience: { key: def.key, audience } },
      select: { subject: true, body: true }
    });

    if (override) {
      subject = override.subject;
      body = override.body;
    }
  } catch (error) {
    logError('email.template_lookup_failed', error, { key: def.key });
  }

  await sendEmail({
    to: input.to,
    subject: renderEmailSubject(subject, input.vars),
    text: renderEmailText(body, input.vars)
  });
}
