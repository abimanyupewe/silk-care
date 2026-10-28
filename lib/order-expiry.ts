import type { Prisma } from '@/lib/generated/prisma';
import { prisma } from '@/lib/db';
import { sendPaymentEmail } from '@/lib/transaction-email';

export const ORDER_PAYMENT_WINDOW_MS = 24 * 60 * 60 * 1000;

function orderCode(orderId: string) {
  return `#${orderId.slice(-8).toUpperCase()}`;
}

export async function expireDueOrders(limit = 50) {
  const now = new Date();
  const fallbackCutoff = new Date(now.getTime() - ORDER_PAYMENT_WINDOW_MS);
  const dueWhere: Prisma.OrderWhereInput = {
    status: 'PENDING',
    paymentStatus: {
      in: ['UNPAID', 'FAILED']
    },
    OR: [
      {
        expiresAt: {
          lte: now
        }
      },
      {
        expiresAt: null,
        createdAt: {
          lte: fallbackCutoff
        }
      }
    ]
  };
  const orders = await prisma.order.findMany({
    where: dueWhere,
    orderBy: {
      createdAt: 'asc'
    },
    take: limit,
    select: {
      id: true,
      userId: true,
      user: {
        select: {
          name: true,
          email: true
        }
      },
      items: {
        select: {
          productId: true,
          quantity: true
        }
      }
    }
  });
  let expired = 0;

  for (const order of orders) {
    const didExpire = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.updateMany({
        where: {
          id: order.id,
          ...dueWhere
        },
        data: {
          status: 'CANCELLED',
          paymentStatus: 'FAILED',
          cancelledAt: now
        }
      });

      if (updated.count === 0) {
        return false;
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

      await tx.payment.updateMany({
        where: {
          orderId: order.id,
          status: 'PENDING'
        },
        data: {
          status: 'EXPIRED'
        }
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: 'CANCELLED',
          note: 'Pesanan dibatalkan otomatis karena pembayaran kedaluwarsa.'
        }
      });

      await tx.notification.create({
        data: {
          userId: order.userId,
          type: 'ORDER',
          title: 'Pesanan kedaluwarsa',
          body: `Pesanan ${orderCode(order.id)} dibatalkan karena pembayaran tidak diselesaikan.`,
          data: {
            orderId: order.id
          }
        }
      });

      return true;
    });

    if (didExpire) {
      await sendPaymentEmail({
        to: order.user.email,
        name: order.user.name,
        orderId: order.id,
        outcome: 'EXPIRED'
      });
      expired += 1;
    }
  }

  return {
    checked: orders.length,
    expired
  };
}
