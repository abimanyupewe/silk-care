import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth-guard';
import { handleRouteError, jsonError, jsonOk } from '@/lib/api';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(_request: Request, context: RouteContext) {
  try {
    const auth = await requireUser();

    if (!auth.ok) {
      return auth.error;
    }

    const { id } = await context.params;
    const notification = await prisma.notification.findFirst({
      where: {
        id,
        userId: auth.user.id
      },
      select: {
        id: true,
        readAt: true
      }
    });

    if (!notification) {
      return jsonError('Notifikasi tidak ditemukan.', 404);
    }

    if (notification.readAt) {
      return jsonOk(notification);
    }

    const updated = await prisma.notification.update({
      where: {
        id: notification.id
      },
      data: {
        readAt: new Date()
      },
      select: {
        id: true,
        readAt: true
      }
    });

    return jsonOk(updated);
  } catch (error) {
    return handleRouteError(error);
  }
}
