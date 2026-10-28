import type { Prisma } from '@/lib/generated/prisma';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth-guard';
import { getPagination, getString, handleRouteError, jsonOk, paginationMeta } from '@/lib/api';

const notificationSelect = {
  id: true,
  type: true,
  title: true,
  body: true,
  data: true,
  readAt: true,
  createdAt: true
} satisfies Prisma.NotificationSelect;

export async function GET(request: Request) {
  try {
    const auth = await requireUser();

    if (!auth.ok) {
      return auth.error;
    }

    const searchParams = new URL(request.url).searchParams;
    const unreadOnly = ['true', '1'].includes(
      (getString(searchParams, 'unreadOnly', 10) ?? '').toLowerCase()
    );
    const pagination = getPagination(searchParams, 20);

    const where: Prisma.NotificationWhereInput = {
      userId: auth.user.id
    };

    if (unreadOnly) {
      where.readAt = null;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: {
          createdAt: 'desc'
        },
        skip: pagination.skip,
        take: pagination.limit,
        select: notificationSelect
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: {
          userId: auth.user.id,
          readAt: null
        }
      })
    ]);

    return jsonOk(notifications, {
      ...paginationMeta(total, pagination),
      unreadCount
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
