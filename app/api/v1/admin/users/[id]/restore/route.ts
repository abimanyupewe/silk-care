import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth-guard';
import { handleRouteError, jsonError, jsonOk } from '@/lib/api';
import { adminUserSelect } from '@/lib/admin';
import { auditActions, writeAuditLog } from '@/lib/audit';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const auth = await requireRole(['ADMIN']);

    if (!auth.ok) {
      return auth.error;
    }

    const { id } = await context.params;
    const user = await prisma.user.findUnique({
      where: {
        id
      },
      select: {
        id: true
      }
    });

    if (!user) {
      return jsonError('Pengguna tidak ditemukan.', 404);
    }

    const restored = await prisma.$transaction(async (tx) => {
      const result = await tx.user.update({
        where: {
          id: user.id
        },
        data: {
          deletedAt: null
        },
        select: adminUserSelect
      });

      await writeAuditLog(
        {
          actorId: auth.user.id,
          action: auditActions.userRestore,
          targetType: 'USER',
          targetId: user.id,
          request
        },
        tx
      );

      return result;
    });

    return jsonOk(restored);
  } catch (error) {
    return handleRouteError(error);
  }
}
