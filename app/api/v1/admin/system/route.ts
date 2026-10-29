import { prisma } from '@/lib/db';
import { isAiConfigured } from '@/lib/ai/config';
import { requireRole } from '@/lib/auth-guard';
import { handleRouteError, jsonOk } from '@/lib/api';
import { isCloudinaryConfigured } from '@/lib/cloudinary';
import { isMidtransConfigured } from '@/lib/midtrans';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const auth = await requireRole(['ADMIN']);

    if (!auth.ok) {
      return auth.error;
    }

    const startedAt = Date.now();

    await prisma.$queryRaw`SELECT 1`;

    return jsonOk({
      checkedAt: new Date().toISOString(),
      database: {
        latencyMs: Date.now() - startedAt
      },
      // Hanya memeriksa env terisi, bukan keabsahan kunci.
      integrations: {
        payment: isMidtransConfigured(),
        upload: isCloudinaryConfigured(),
        email: Boolean(process.env.RESEND_API_KEY?.trim() && process.env.EMAIL_FROM?.trim()),
        ai: isAiConfigured(),
        cron: Boolean(process.env.CRON_SECRET?.trim())
      }
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
