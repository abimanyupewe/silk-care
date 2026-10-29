import type { Prisma } from '@/lib/generated/prisma';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth-guard';
import {
  getEnum,
  getPagination,
  getString,
  handleRouteError,
  jsonOk,
  paginationMeta
} from '@/lib/api';
import { orderManagementListSelect, orderStatuses, paymentStatuses } from '@/lib/order';
import { expireDueOrders } from '@/lib/order-expiry';

export async function GET(request: Request) {
  try {
    const auth = await requireRole(['ADMIN']);

    if (!auth.ok) {
      return auth.error;
    }

    await expireDueOrders();

    const searchParams = new URL(request.url).searchParams;
    const status = getEnum(searchParams, 'status', orderStatuses);
    const paymentStatus = getEnum(searchParams, 'paymentStatus', paymentStatuses);
    const q = getString(searchParams, 'q', 100)?.replace(/^#/, '');
    const facilityId = getString(searchParams, 'facilityId', 100);
    const userId = getString(searchParams, 'userId', 100);
    const pagination = getPagination(searchParams, 10);

    const where: Prisma.OrderWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }

    if (facilityId) {
      where.facilityId = facilityId;
    }

    if (userId) {
      where.userId = userId;
    }

    // ID pesanan di UI hanya 8 karakter terakhir, jadi cocokkan ID dengan contains.
    if (q) {
      where.OR = [
        { id: { contains: q, mode: 'insensitive' } },
        { recipientName: { contains: q, mode: 'insensitive' } },
        { recipientPhone: { contains: q } },
        { user: { name: { contains: q, mode: 'insensitive' } } },
        { user: { email: { contains: q, mode: 'insensitive' } } },
        { facility: { name: { contains: q, mode: 'insensitive' } } }
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: {
          createdAt: 'desc'
        },
        skip: pagination.skip,
        take: pagination.limit,
        select: orderManagementListSelect
      }),
      prisma.order.count({ where })
    ]);

    return jsonOk(orders, paginationMeta(total, pagination));
  } catch (error) {
    return handleRouteError(error);
  }
}
