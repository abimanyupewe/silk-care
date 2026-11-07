import { z } from 'zod';
import { requireRole } from '@/lib/auth-guard';
import { handleRouteError, jsonError, jsonOk, jsonTooManyRequests, parseJson } from '@/lib/api';
import { auditActions, writeAuditLog } from '@/lib/audit';
import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import {
  getEmailTemplateDef,
  isEmailAudience,
  renderEmailHtml,
  renderEmailSubject,
  renderEmailText,
  sampleVars,
  validateEmailTemplate
} from '@/lib/email-templates';
import { rateLimit } from '@/lib/rate-limit';

type RouteContext = {
  params: Promise<{ key: string; audience: string }>;
};

// Subjek/isi opsional: panel mengirim draf yang belum disimpan agar bisa diuji dulu.
const testSchema = z.object({
  to: z.string().trim().email().max(254).optional(),
  subject: z.string().trim().min(1).max(200).optional(),
  body: z.string().trim().min(1).max(5000).optional()
});

export async function POST(request: Request, context: RouteContext) {
  try {
    const auth = await requireRole(['ADMIN']);

    if (!auth.ok) {
      return auth.error;
    }

    const { key, audience } = await context.params;
    const def = getEmailTemplateDef(key);

    if (!def || !isEmailAudience(audience)) {
      return jsonError('Template email tidak ditemukan.', 404);
    }

    const limit = await rateLimit(`email-template:test:${auth.user.id}`, 10, 10 * 60 * 1000);

    if (!limit.allowed) {
      return jsonTooManyRequests(limit.resetAt);
    }

    const parsed = await parseJson(request, testSchema);

    if (parsed.error) {
      return parsed.error;
    }

    // Tanpa draf dari panel, pakai versi tersimpan (override atau default).
    const override = await prisma.emailTemplate.findUnique({
      where: { key_audience: { key: def.key, audience } },
      select: { subject: true, body: true }
    });
    const subject = parsed.data.subject ?? override?.subject ?? def.subject;
    const body = parsed.data.body ?? override?.body ?? def.body;
    const invalid = validateEmailTemplate(def, subject, body);

    if (invalid) {
      return jsonError(invalid, 422);
    }

    const to = parsed.data.to ?? auth.user.email;

    if (!to) {
      return jsonError('Isi alamat tujuan email uji.', 422);
    }

    const vars = sampleVars(def);
    const text = renderEmailText(body, vars);
    const renderedSubject = `[TES] ${renderEmailSubject(subject, vars)}`;

    try {
      await sendEmail({
        to,
        subject: renderedSubject,
        text,
        html: renderEmailHtml(text, renderedSubject)
      });
    } catch {
      return jsonError(
        'Email uji gagal dikirim. Periksa konfigurasi RESEND_API_KEY dan EMAIL_FROM.',
        502
      );
    }

    await writeAuditLog({
      actorId: auth.user.id,
      action: auditActions.emailTemplateTest,
      targetType: 'EMAIL_TEMPLATE',
      targetId: `${def.key}:${audience}`,
      request
    });

    return jsonOk({ to });
  } catch (error) {
    return handleRouteError(error);
  }
}
