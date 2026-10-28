import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth-guard';
import { handleRouteError, jsonError, jsonOk } from '@/lib/api';
import { orderDetailSelect } from '@/lib/order';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const auth = await requireUser();

    if (!auth.ok) {
      return auth.error;
    }

    const { id } = await context.params;
    const order = await prisma.order.findFirst({
      where:
        auth.user.role === 'ADMIN'
          ? { id }
          : {
              id,
              userId: auth.user.id
            },
      select: orderDetailSelect
    });

    if (!order) {
      return jsonError('Pesanan tidak ditemukan.', 404);
    }

    return jsonOk(order);
  } catch (error) {
    return handleRouteError(error);
  }
}
