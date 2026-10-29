import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth-guard';
import { handleRouteError, jsonError, jsonOk, parseJson } from '@/lib/api';
import { auditActions, writeAuditLog } from '@/lib/audit';
import { getEmailTemplateDef, isEmailAudience, validateEmailTemplate } from '@/lib/email-templates';

type RouteContext = {
  params: Promise<{
    key: string;
    audience: string;
  }>;
};

const updateSchema = z.object({
  subject: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(5000)
});

async function resolveTarget(context: RouteContext) {
  const { key, audience } = await context.params;
  const def = getEmailTemplateDef(key);

  if (!def || !isEmailAudience(audience)) {
    return null;
  }

  return { def, audience };
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const auth = await requireRole(['ADMIN']);

    if (!auth.ok) {
      return auth.error;
    }

    const target = await resolveTarget(context);

    if (!target) {
      return jsonError('Template email tidak ditemukan.', 404);
    }

    const parsed = await parseJson(request, updateSchema);

    if (parsed.error) {
      return parsed.error;
    }

    const invalid = validateEmailTemplate(target.def, parsed.data.subject, parsed.data.body);

    if (invalid) {
      return jsonError(invalid, 422);
    }

    const saved = await prisma.$transaction(async (tx) => {
      const row = await tx.emailTemplate.upsert({
        where: { key_audience: { key: target.def.key, audience: target.audience } },
        create: {
          key: target.def.key,
          audience: target.audience,
          subject: parsed.data.subject,
          body: parsed.data.body,
          updatedById: auth.user.id
        },
        update: {
          subject: parsed.data.subject,
          body: parsed.data.body,
          updatedById: auth.user.id
        },
        select: { subject: true, body: true, updatedAt: true }
      });

      await writeAuditLog(
        {
          actorId: auth.user.id,
          action: auditActions.emailTemplateUpdate,
          targetType: 'EMAIL_TEMPLATE',
          targetId: `${target.def.key}:${target.audience}`,
          request
        },
        tx
      );

      return row;
    });

    return jsonOk({ ...saved, customized: true });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const auth = await requireRole(['ADMIN']);

    if (!auth.ok) {
      return auth.error;
    }

    const target = await resolveTarget(context);

    if (!target) {
      return jsonError('Template email tidak ditemukan.', 404);
    }

    await prisma.$transaction(async (tx) => {
      await tx.emailTemplate.deleteMany({
        where: { key: target.def.key, audience: target.audience }
      });

      await writeAuditLog(
        {
          actorId: auth.user.id,
          action: auditActions.emailTemplateReset,
          targetType: 'EMAIL_TEMPLATE',
          targetId: `${target.def.key}:${target.audience}`,
          request
        },
        tx
      );
    });

    return jsonOk({
      subject: target.def.subject,
      body: target.def.body,
      customized: false,
      updatedAt: null
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
