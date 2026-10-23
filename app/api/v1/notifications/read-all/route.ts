import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth-guard';
import { handleRouteError, jsonOk } from '@/lib/api';

export async function POST() {
  try {
    const auth = await requireUser();

    if (!auth.ok) {
      return auth.error;
    }

    const updated = await prisma.notification.updateMany({
      where: {
        userId: auth.user.id,
        readAt: null
      },
      data: {
        readAt: new Date()
      }
    });

    return jsonOk({ updated: updated.count });
  } catch (error) {
    return handleRouteError(error);
  }
}
