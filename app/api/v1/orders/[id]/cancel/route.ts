import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth-guard';
import { handleRouteError, jsonError, jsonOk } from '@/lib/api';
import { OrderActionError, orderDetailSelect } from '@/lib/order';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    const auth = await requireUser();

    if (!auth.ok) {
      return auth.error;
    }

    const { id } = await context.params;
    const order = await prisma.order.findUnique({
      where: {
        id
      },
      select: {
        id: true,
        userId: true,
        status: true,
        paymentStatus: true,
        items: {
          select: {
            productId: true,
            quantity: true
          }
        }
      }
    });

    if (!order) {
      return jsonError('Pesanan tidak ditemukan.', 404);
    }

    if (order.userId !== auth.user.id && auth.user.role !== 'ADMIN') {
      return jsonError('Akses ditolak.', 403);
    }

    if (order.status !== 'PENDING' || order.paymentStatus !== 'UNPAID') {
      return jsonError('Pesanan tidak dapat dibatalkan pada status ini.', 409);
    }

    const now = new Date();
    const cancelled = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.updateMany({
        where: {
          id: order.id,
          status: 'PENDING',
          paymentStatus: 'UNPAID'
        },
        data: {
          status: 'CANCELLED',
          cancelledAt: now
        }
      });

      if (updated.count === 0) {
        throw new OrderActionError('Pesanan tidak dapat dibatalkan pada status ini.');
      }

      for (const item of order.items) {
        await tx.product.update({
          where: {
            id: item.productId
          },
          data: {
            stock: {
              increment: item.quantity
            }
          }
        });
      }

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: 'CANCELLED',
          note: auth.user.role === 'ADMIN' ? 'Dibatalkan oleh admin.' : 'Dibatalkan oleh pengguna.',
          changedById: auth.user.id
        }
      });

      await tx.notification.create({
        data: {
          userId: order.userId,
          type: 'ORDER',
          title: 'Pesanan dibatalkan',
          body: `Pesanan #${order.id.slice(-8).toUpperCase()} telah dibatalkan.`,
          data: {
            orderId: order.id
          }
        }
      });

      return tx.order.findUniqueOrThrow({
        where: {
          id: order.id
        },
        select: orderDetailSelect
      });
    });

    return jsonOk(cancelled);
  } catch (error) {
    if (error instanceof OrderActionError) {
      return jsonError(error.message, error.status);
    }

    return handleRouteError(error);
  }
}
