import type { OrderStatus, Prisma } from '@/lib/generated/prisma';
import { prisma } from '@/lib/db';
import { auditActions, writeAuditLog } from '@/lib/audit';
import { OrderActionError, orderDetailSelect } from '@/lib/order';
import { sendOrderStatusEmail } from '@/lib/transaction-email';

const transitions: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING: ['CANCELLED'],
  PAID: ['PROCESSING'],
  PROCESSING: ['SHIPPED'],
  SHIPPED: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: []
};

const defaultNotes: Record<OrderStatus, string> = {
  PENDING: 'Pesanan dibuat.',
  PAID: 'Pembayaran diterima.',
  PROCESSING: 'Pesanan sedang diproses.',
  SHIPPED: 'Pesanan telah dikirim.',
  COMPLETED: 'Pesanan selesai.',
  CANCELLED: 'Pesanan dibatalkan.'
};

const notificationTitles: Record<OrderStatus, string> = {
  PENDING: 'Status pesanan diperbarui',
  PAID: 'Pembayaran diterima',
  PROCESSING: 'Pesanan sedang diproses',
  SHIPPED: 'Pesanan telah dikirim',
  COMPLETED: 'Pesanan selesai',
  CANCELLED: 'Pesanan dibatalkan'
};

type ChangeOrderStatusInput = {
  orderId: string;
  nextStatus: OrderStatus;
  changedById: string;
  note?: string | null;
  facilityId?: string;
  audit?: {
    request: Request;
  };
};

export async function changeOrderStatus({
  orderId,
  nextStatus,
  changedById,
  note,
  facilityId,
  audit
}: ChangeOrderStatusInput) {
  const order = await prisma.order.findUnique({
    where: {
      id: orderId
    },
    select: {
      id: true,
      userId: true,
      facilityId: true,
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

  if (!order || (facilityId && order.facilityId !== facilityId)) {
    throw new OrderActionError('Pesanan tidak ditemukan.', 404);
  }

  if (!transitions[order.status].includes(nextStatus)) {
    throw new OrderActionError('Perubahan status pesanan tidak diizinkan.', 409);
  }

  const requiresPaid = ['PROCESSING', 'SHIPPED', 'COMPLETED'].includes(nextStatus);

  if (requiresPaid && order.paymentStatus !== 'PAID') {
    throw new OrderActionError('Pesanan belum dibayar.', 409);
  }

  if (
    nextStatus === 'CANCELLED' &&
    (order.paymentStatus === 'PAID' || order.paymentStatus === 'REFUNDED')
  ) {
    throw new OrderActionError('Pesanan yang sudah dibayar tidak dapat dibatalkan.', 409);
  }

  const now = new Date();
  const statusNote = note?.trim() || defaultNotes[nextStatus];
  const where: Prisma.OrderWhereInput = {
    id: order.id,
    status: order.status
  };

  if (requiresPaid) {
    where.paymentStatus = 'PAID';
  }

  if (nextStatus === 'CANCELLED') {
    where.paymentStatus = {
      notIn: ['PAID', 'REFUNDED']
    };
  }

  const updated = await prisma.$transaction(async (tx) => {
    const updated = await tx.order.updateMany({
      where,
      data: {
        status: nextStatus,
        ...(nextStatus === 'CANCELLED' ? { cancelledAt: now } : {})
      }
    });

    if (updated.count === 0) {
      throw new OrderActionError('Status pesanan sudah berubah. Muat ulang data.', 409);
    }

    if (nextStatus === 'CANCELLED') {
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
    }

    await tx.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: nextStatus,
        note: statusNote,
        changedById
      }
    });

    await tx.notification.create({
      data: {
        userId: order.userId,
        type: 'ORDER',
        title: notificationTitles[nextStatus],
        body: `Pesanan #${order.id.slice(-8).toUpperCase()}: ${statusNote}`,
        data: {
          orderId: order.id
        }
      }
    });

    if (audit) {
      await writeAuditLog(
        {
          actorId: changedById,
          action: auditActions.orderStatusUpdate,
          targetType: 'ORDER',
          targetId: order.id,
          metadata: {
            from: order.status,
            to: nextStatus,
            note: statusNote
          },
          request: audit.request
        },
        tx
      );
    }

    return tx.order.findUniqueOrThrow({
      where: {
        id: order.id
      },
      select: orderDetailSelect
    });
  });

  const recipient = await prisma.user.findUnique({
    where: {
      id: order.userId
    },
    select: {
      name: true,
      email: true
    }
  });

  if (recipient?.email) {
    await sendOrderStatusEmail({
      to: recipient.email,
      name: recipient.name,
      orderId: order.id,
      status: nextStatus,
      note: statusNote
    });
  }

  return updated;
}
