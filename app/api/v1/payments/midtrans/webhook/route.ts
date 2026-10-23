import { z } from 'zod';
import { prisma } from '@/lib/db';
import { handleRouteError, jsonError, jsonOk, parseJson } from '@/lib/api';
import { getPaymentProvider } from '@/lib/payments';

const notificationSchema = z
  .object({
    order_id: z.string().min(1),
    status_code: z.string().min(1),
    gross_amount: z.string().min(1),
    signature_key: z.string().min(1),
    transaction_status: z.string().min(1),
    fraud_status: z.string().optional(),
    transaction_id: z.string().optional(),
    payment_type: z.string().optional()
  })
  .passthrough();

export async function POST(request: Request) {
  try {
    const provider = getPaymentProvider();

    if (!provider.isConfigured()) {
      return jsonError('Pembayaran belum dikonfigurasi.', 503);
    }

    const parsed = await parseJson(request, notificationSchema);

    if (parsed.error) {
      return parsed.error;
    }

    const data = parsed.data;
    const rawPayload = {
      order_id: data.order_id,
      status_code: data.status_code,
      gross_amount: data.gross_amount,
      signature_key: data.signature_key,
      transaction_status: data.transaction_status,
      fraud_status: data.fraud_status ?? null,
      transaction_id: data.transaction_id ?? null,
      payment_type: data.payment_type ?? null
    };

    if (
      !provider.verifyWebhook({
        orderId: data.order_id,
        statusCode: data.status_code,
        grossAmount: data.gross_amount,
        signatureKey: data.signature_key,
        transactionStatus: data.transaction_status,
        fraudStatus: data.fraud_status
      })
    ) {
      return jsonError('Signature Midtrans tidak valid.', 401);
    }

    const payment = await prisma.payment.findUnique({
      where: {
        externalId: data.order_id
      },
      select: {
        id: true,
        orderId: true,
        amount: true,
        status: true,
        paidAt: true,
        order: {
          select: {
            id: true,
            userId: true,
            status: true,
            paymentStatus: true,
            facility: {
              select: {
                userId: true
              }
            }
          }
        }
      }
    });

    if (!payment) {
      return jsonError('Pembayaran tidak ditemukan.', 404);
    }

    const grossAmount = Number(data.gross_amount);

    if (!Number.isFinite(grossAmount) || grossAmount !== payment.amount) {
      return jsonError('Nominal pembayaran tidak sesuai.', 400);
    }

    const nextStatus = provider.mapStatus(data.transaction_status, data.fraud_status);

    if (payment.status === nextStatus) {
      await prisma.payment.update({
        where: {
          id: payment.id
        },
        data: {
          rawPayload
        }
      });

      return jsonOk({ message: 'Notifikasi pembayaran sudah diproses.' });
    }

    const now = new Date();

    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: {
          id: payment.id
        },
        data: {
          status: nextStatus,
          rawPayload,
          ...(nextStatus === 'PAID' ? { paidAt: payment.paidAt ?? now } : {})
        }
      });

      if (nextStatus === 'PAID') {
        const isNewlyPaid = payment.order.paymentStatus !== 'PAID';

        await tx.order.update({
          where: {
            id: payment.orderId
          },
          data: {
            paymentStatus: 'PAID',
            ...(isNewlyPaid ? { paidAt: now } : {}),
            ...(isNewlyPaid && payment.order.status === 'PENDING' ? { status: 'PAID' } : {})
          }
        });

        if (isNewlyPaid) {
          await tx.orderStatusHistory.create({
            data: {
              orderId: payment.orderId,
              status: 'PAID',
              note: 'Pembayaran diterima.'
            }
          });

          await tx.notification.create({
            data: {
              userId: payment.order.userId,
              type: 'ORDER',
              title: 'Pembayaran diterima',
              body: `Pembayaran untuk pesanan #${payment.orderId
                .slice(-8)
                .toUpperCase()} telah diterima.`,
              data: {
                orderId: payment.orderId
              }
            }
          });

          if (payment.order.facility.userId !== payment.order.userId) {
            await tx.notification.create({
              data: {
                userId: payment.order.facility.userId,
                type: 'ORDER',
                title: 'Pesanan baru telah dibayar',
                body: `Pesanan #${payment.orderId
                  .slice(-8)
                  .toUpperCase()} telah dibayar dan siap diproses.`,
                data: {
                  orderId: payment.orderId
                }
              }
            });
          }
        }

        return;
      }

      if (nextStatus === 'FAILED' || nextStatus === 'EXPIRED') {
        if (payment.order.paymentStatus !== 'PAID' && payment.order.paymentStatus !== 'REFUNDED') {
          await tx.order.update({
            where: {
              id: payment.orderId
            },
            data: {
              paymentStatus: 'FAILED'
            }
          });

          await tx.notification.create({
            data: {
              userId: payment.order.userId,
              type: 'ORDER',
              title: nextStatus === 'EXPIRED' ? 'Pembayaran kedaluwarsa' : 'Pembayaran gagal',
              body: `Pembayaran untuk pesanan #${payment.orderId
                .slice(-8)
                .toUpperCase()} ${nextStatus === 'EXPIRED' ? 'telah kedaluwarsa' : 'gagal'}.`,
              data: {
                orderId: payment.orderId
              }
            }
          });
        }

        return;
      }

      if (nextStatus === 'REFUNDED') {
        await tx.order.update({
          where: {
            id: payment.orderId
          },
          data: {
            paymentStatus: 'REFUNDED'
          }
        });

        await tx.notification.create({
          data: {
            userId: payment.order.userId,
            type: 'ORDER',
            title: 'Pembayaran direfund',
            body: `Pembayaran untuk pesanan #${payment.orderId
              .slice(-8)
              .toUpperCase()} telah direfund.`,
            data: {
              orderId: payment.orderId
            }
          }
        });
      }
    });

    return jsonOk({ message: 'Notifikasi pembayaran diproses.' });
  } catch (error) {
    return handleRouteError(error);
  }
}
