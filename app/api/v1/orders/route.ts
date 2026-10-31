import { auditActions, writeAuditLog } from '@/lib/audit';
import { requireTransactions } from '@/lib/transactions-guard';
import type { Prisma } from '@/lib/generated/prisma';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth-guard';
import { cartSelect } from '@/lib/cart';
import {
  getEnum,
  getPagination,
  handleRouteError,
  jsonCreated,
  jsonError,
  jsonOk,
  jsonTooManyRequests,
  paginationMeta,
  parseJson
} from '@/lib/api';
import {
  OrderActionError,
  orderDetailSelect,
  orderListSelect,
  orderStatuses,
  paymentStatuses
} from '@/lib/order';
import { expireDueOrders, ORDER_PAYMENT_WINDOW_MS } from '@/lib/order-expiry';
import {
  completeIdempotencyRecord,
  createIdempotencyRecord,
  isIdempotencyUniqueError,
  replayIdempotency,
  resolveIdempotency,
  type IdempotencyContext
} from '@/lib/idempotency';
import { rateLimit } from '@/lib/rate-limit';
import { sendOrderCreatedEmail } from '@/lib/transaction-email';

const checkoutSchema = z.object({
  recipientName: z.string().trim().min(2).max(100),
  recipientPhone: z.string().trim().min(8).max(20),
  shippingAddress: z.string().trim().min(10).max(500),
  shippingCity: z.string().trim().min(2).max(100),
  shippingPostalCode: z.string().trim().min(3).max(10).nullable().optional(),
  notes: z.string().trim().max(1000).nullable().optional()
});

export async function GET(request: Request) {
  try {
    const auth = await requireUser();

    if (!auth.ok) {
      return auth.error;
    }

    await expireDueOrders();

    const searchParams = new URL(request.url).searchParams;
    const status = getEnum(searchParams, 'status', orderStatuses);
    const paymentStatus = getEnum(searchParams, 'paymentStatus', paymentStatuses);
    const pagination = getPagination(searchParams, 10);

    const where: Prisma.OrderWhereInput = {
      userId: auth.user.id
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
        select: orderListSelect
      }),
      prisma.order.count({ where })
    ]);

    return jsonOk(orders, paginationMeta(total, pagination));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  let idempotency: (IdempotencyContext & { userId: string }) | null = null;

  try {
    const auth = await requireUser();

    if (!auth.ok) {
      return auth.error;
    }

    const off = requireTransactions();
    if (off) return off;

    const parsed = await parseJson(request, checkoutSchema);

    if (parsed.error) {
      return parsed.error;
    }

    const idempotencyResult = await resolveIdempotency(
      request,
      auth.user.id,
      'CHECKOUT',
      parsed.data
    );

    if (idempotencyResult.response) {
      return idempotencyResult.response;
    }

    idempotency = idempotencyResult.context
      ? {
          ...idempotencyResult.context,
          userId: auth.user.id
        }
      : null;

    const limit = await rateLimit(`orders:create:${auth.user.id}`, 5, 10 * 60 * 1000);

    if (!limit.allowed) {
      return jsonTooManyRequests(limit.resetAt);
    }

    const cart = await prisma.cart.findUnique({
      where: {
        userId: auth.user.id
      },
      select: cartSelect
    });

    if (!cart || cart.items.length === 0) {
      return jsonError('Keranjang masih kosong.', 422);
    }

    const facilityId = cart.facilityId;

    if (!facilityId || !cart.facility) {
      return jsonError('Fasilitas keranjang tidak ditemukan.', 409);
    }

    if (cart.facility.verificationStatus !== 'VERIFIED') {
      return jsonError('Fasilitas pemasok produk belum terverifikasi.', 409);
    }

    for (const item of cart.items) {
      if (!item.product.active || item.product.deletedAt !== null) {
        return jsonError(`Produk ${item.product.name} sudah tidak tersedia.`, 409);
      }

      if (item.product.facilityId !== facilityId) {
        return jsonError('Keranjang berisi produk dari fasilitas yang berbeda.', 409);
      }

      if (item.quantity > item.product.stock) {
        return jsonError(`Stok ${item.product.name} tidak mencukupi.`, 409);
      }
    }

    const total = cart.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const expiresAt = new Date(Date.now() + ORDER_PAYMENT_WINDOW_MS);

    const order = await prisma.$transaction(async (tx) => {
      let idempotencyRecordId: string | null = null;

      if (idempotency) {
        const record = await createIdempotencyRecord(tx, {
          userId: idempotency.userId,
          scope: 'CHECKOUT',
          context: idempotency
        });

        idempotencyRecordId = record.id;
      }

      for (const item of cart.items) {
        const stockUpdate = await tx.product.updateMany({
          where: {
            id: item.product.id,
            active: true,
            deletedAt: null,
            stock: {
              gte: item.quantity
            }
          },
          data: {
            stock: {
              decrement: item.quantity
            }
          }
        });

        if (stockUpdate.count === 0) {
          throw new OrderActionError(`Stok ${item.product.name} tidak mencukupi.`);
        }
      }

      const created = await tx.order.create({
        data: {
          userId: auth.user.id,
          facilityId,
          total,
          recipientName: parsed.data.recipientName,
          recipientPhone: parsed.data.recipientPhone,
          shippingAddress: parsed.data.shippingAddress,
          shippingCity: parsed.data.shippingCity,
          shippingPostalCode: parsed.data.shippingPostalCode || null,
          notes: parsed.data.notes || null,
          expiresAt,
          items: {
            create: cart.items.map((item) => ({
              productId: item.product.id,
              productName: item.product.name,
              productSlug: item.product.slug,
              productImage: item.product.image,
              quantity: item.quantity,
              price: item.product.price
            }))
          }
        },
        select: {
          id: true
        }
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: created.id,
          status: 'PENDING',
          note: 'Pesanan dibuat.',
          changedById: auth.user.id
        }
      });

      await tx.notification.create({
        data: {
          userId: auth.user.id,
          type: 'ORDER',
          title: 'Pesanan berhasil dibuat',
          body: `Pesanan #${created.id.slice(-8).toUpperCase()} menunggu pembayaran.`,
          data: {
            orderId: created.id
          }
        }
      });

      await writeAuditLog(
        {
          actorId: auth.user.id,
          action: auditActions.orderCreate,
          targetType: 'ORDER',
          targetId: created.id,
          request
        },
        tx
      );

      await tx.cartItem.deleteMany({
        where: {
          cartId: cart.id
        }
      });

      await tx.cart.update({
        where: {
          id: cart.id
        },
        data: {
          facilityId: null
        }
      });

      const detail = await tx.order.findUniqueOrThrow({
        where: {
          id: created.id
        },
        select: orderDetailSelect
      });

      if (idempotencyRecordId) {
        await completeIdempotencyRecord(tx, idempotencyRecordId, {
          status: 201,
          body: {
            data: detail
          },
          resourceId: detail.id
        });
      }

      return detail;
    });

    if (auth.user.email) {
      await sendOrderCreatedEmail({
        to: auth.user.email,
        name: auth.user.name || order.recipientName,
        orderId: order.id,
        total: order.total,
        facilityName: order.facility.name
      });
    }

    return jsonCreated(order);
  } catch (error) {
    if (idempotency && isIdempotencyUniqueError(error)) {
      return replayIdempotency(
        idempotency.userId,
        'CHECKOUT',
        idempotency.key,
        idempotency.requestHash
      );
    }

    if (error instanceof OrderActionError) {
      return jsonError(error.message, error.status);
    }

    return handleRouteError(error);
  }
}
