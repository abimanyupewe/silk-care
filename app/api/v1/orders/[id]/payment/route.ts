import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth-guard';
import { jsonCreated, jsonError, jsonOk } from '@/lib/api';
import { getPaymentProvider, PaymentNotConfiguredError } from '@/lib/payments';

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
    const order = await prisma.order.findFirst({
      where: {
        id,
        userId: auth.user.id
      },
      select: {
        id: true,
        status: true,
        paymentStatus: true,
        total: true,
        user: {
          select: {
            name: true,
            email: true,
            phone: true
          }
        },
        items: {
          select: {
            productId: true,
            productName: true,
            quantity: true,
            price: true
          }
        }
      }
    });

    if (!order) {
      return jsonError('Pesanan tidak ditemukan.', 404);
    }

    if (order.status !== 'PENDING' || order.paymentStatus === 'PAID') {
      return jsonError('Pembayaran tidak dapat dibuat pada status pesanan ini.', 409);
    }

    if (order.paymentStatus === 'REFUNDED') {
      return jsonError('Pesanan sudah direfund.', 409);
    }

    const now = new Date();
    const existing = await prisma.payment.findFirst({
      where: {
        orderId: order.id,
        status: 'PENDING',
        expiresAt: {
          gt: now
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        status: true,
        amount: true,
        snapToken: true,
        redirectUrl: true,
        expiresAt: true
      }
    });

    if (existing) {
      return jsonOk(existing);
    }

    await prisma.payment.updateMany({
      where: {
        orderId: order.id,
        status: 'PENDING',
        expiresAt: {
          lte: now
        }
      },
      data: {
        status: 'EXPIRED'
      }
    });

    const externalId = `${order.id}-${Date.now().toString(36)}`;
    const provider = getPaymentProvider();

    if (!provider.isConfigured()) {
      throw new PaymentNotConfiguredError();
    }

    const transaction = await provider.createTransaction({
      orderId: externalId,
      amount: order.total,
      items: order.items.map((item) => ({
        id: item.productId,
        name: item.productName,
        price: item.price,
        quantity: item.quantity
      })),
      customer: {
        name: order.user.name,
        email: order.user.email,
        phone: order.user.phone
      }
    });

    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const payment = await prisma.$transaction(async (tx) => {
      const created = await tx.payment.create({
        data: {
          orderId: order.id,
          externalId,
          amount: order.total,
          status: 'PENDING',
          snapToken: transaction.token,
          redirectUrl: transaction.redirectUrl,
          expiresAt
        },
        select: {
          id: true,
          status: true,
          amount: true,
          snapToken: true,
          redirectUrl: true,
          expiresAt: true
        }
      });

      await tx.order.update({
        where: {
          id: order.id
        },
        data: {
          expiresAt
        }
      });

      return created;
    });

    return jsonCreated(payment);
  } catch (error) {
    if (error instanceof PaymentNotConfiguredError) {
      return jsonError(
        'Pembayaran belum dikonfigurasi. Isi MIDTRANS_SERVER_KEY terlebih dahulu.',
        503
      );
    }

    console.error('[order:payment]', error);
    return jsonError('Gagal membuat transaksi pembayaran.', 502);
  }
}
