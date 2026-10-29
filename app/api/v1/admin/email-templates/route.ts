import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth-guard';
import { handleRouteError, jsonOk } from '@/lib/api';
import { emailAudiences, emailTemplateDefs } from '@/lib/email-templates';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const auth = await requireRole(['ADMIN']);

    if (!auth.ok) {
      return auth.error;
    }

    const overrides = await prisma.emailTemplate.findMany({
      select: { key: true, audience: true, subject: true, body: true, updatedAt: true }
    });

    return jsonOk(
      emailTemplateDefs.map((def) => ({
        ...def,
        audiences: Object.fromEntries(
          emailAudiences.map((audience) => {
            const override = overrides.find(
              (row) => row.key === def.key && row.audience === audience
            );

            return [
              audience,
              {
                subject: override?.subject ?? def.subject,
                body: override?.body ?? def.body,
                customized: Boolean(override),
                updatedAt: override?.updatedAt ?? null
              }
            ];
          })
        )
      }))
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
