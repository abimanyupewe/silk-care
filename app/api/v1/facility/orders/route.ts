import type { Prisma } from '@/lib/generated/prisma';
import { prisma } from '@/lib/db';
import { requireFacility } from '@/lib/facility-guard';
import { getEnum, getPagination, handleRouteError, jsonOk, paginationMeta } from '@/lib/api';
import { orderManagementListSelect, orderStatuses, paymentStatuses } from '@/lib/order';

export async function GET(request: Request) {
  try {
    const auth = await requireFacility();

    if (!auth.ok) {
      return auth.error;
    }

    const searchParams = new URL(request.url).searchParams;
    const status = getEnum(searchParams, 'status', orderStatuses);
    const paymentStatus = getEnum(searchParams, 'paymentStatus', paymentStatuses);
    const pagination = getPagination(searchParams, 10);

    const where: Prisma.OrderWhereInput = {
      facilityId: auth.facility.id
    };

    if (status) {
      where.status = status;
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
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

    return jsonOk(orders, {
      ...paginationMeta(total, pagination),
      facility: auth.facility
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
