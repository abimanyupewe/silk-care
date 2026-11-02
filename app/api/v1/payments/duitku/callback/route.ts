import { prisma } from '@/lib/db';
import { handleRouteError, jsonError, jsonOk } from '@/lib/api';
import {
  DUITKU_SUB_PREFIX,
  isDuitkuConfigured,
  mapDuitkuCallbackStatus,
  verifyDuitkuCallbackSignature
} from '@/lib/payments/duitku';
import { computeEndsAt } from '@/lib/subscription';

// Callback Duitku (POP API): POST x-www-form-urlencoded, wajib dibalas HTTP 200 supaya Duitku
// tidak mengirim ulang (maksimal 5 percobaan). Signature diverifikasi sebelum data disentuh.
// Alur SUB mensettle di sini (perpanjangan Subscription), alur ORD menunggu modul pembuatan
// invoice, jadi awalan ORD tidak dikenal dulu.

export async function POST(request: Request) {
  try {
    if (!isDuitkuConfigured()) {
      return jsonError('Pembayaran belum dikonfigurasi.', 503);
    }

    const params = new URLSearchParams(await request.text());
    const callback = {
      merchantCode: params.get('merchantCode') ?? '',
      amount: params.get('amount') ?? '',
      merchantOrderId: params.get('merchantOrderId') ?? '',
      resultCode: params.get('resultCode') ?? '',
      reference: params.get('reference') ?? '',
      signature: params.get('signature') ?? ''
    };

    if (
      !callback.merchantCode ||
      !callback.amount ||
      !callback.merchantOrderId ||
      !callback.signature
    ) {
      return jsonError('Callback belum lengkap.', 400);
    }

    if (!verifyDuitkuCallbackSignature(callback)) {
      return jsonError('Signature Duitku tidak valid.', 401);
    }

    if (!callback.merchantOrderId.startsWith(DUITKU_SUB_PREFIX)) {
      return jsonError('Order ID Duitku tidak dikenal.', 404);
    }

    const payment = await prisma.subscriptionPayment.findUnique({
      where: {
        merchantOrderId: callback.merchantOrderId
      },
      select: {
        id: true,
        subscriptionId: true,
        plan: true,
        amount: true,
        durationMonths: true,
        status: true,
        paidAt: true,
        reference: true,
        subscription: {
          select: {
            userId: true,
            endsAt: true
          }
        }
      }
    });

    if (!payment) {
      return jsonError('Pembayaran tidak ditemukan.', 404);
    }

    const amount = Number(callback.amount);

    if (!Number.isFinite(amount) || amount !== payment.amount) {
      return jsonError('Nominal pembayaran tidak sesuai.', 400);
    }

    // Callback Duitku dikirim dengan x-www-form-urlencoded; simpan seluruh parameternya apa
    // adanya sebagai raw_callback untuk audit dan resend manual dari dashboard.
    const rawCallback: Record<string, string> = {};
    for (const [key, value] of params.entries()) {
      rawCallback[key] = value;
    }

    const nextStatus = mapDuitkuCallbackStatus(callback.resultCode);

    if (!nextStatus) {
      await prisma.subscriptionPayment.update({
        where: {
          id: payment.id
        },
        data: {
          rawPayload: rawCallback
        }
      });

      return jsonOk({ message: 'Status callback tidak dikenal; hanya disimpan.' });
    }

    // Transaksi yang sudah PAID tidak boleh mundur: callback telat atau duplikat tidak
    // mengubah langganan yang sudah diperpanjang (idempotensi).
    if (payment.status === 'PAID' && nextStatus !== 'PAID') {
      await prisma.subscriptionPayment.update({
        where: {
          id: payment.id
        },
        data: {
          rawPayload: rawCallback
        }
      });

      return jsonOk({ message: 'Notifikasi pembayaran sudah diproses.' });
    }

    if (payment.status === nextStatus) {
      await prisma.subscriptionPayment.update({
        where: {
          id: payment.id
        },
        data: {
          rawPayload: rawCallback
        }
      });

      return jsonOk({ message: 'Notifikasi pembayaran sudah diproses.' });
    }

    const now = new Date();

    await prisma.$transaction(async (tx) => {
      await tx.subscriptionPayment.update({
        where: {
          id: payment.id
        },
        data: {
          status: nextStatus,
          rawPayload: rawCallback,
          ...(nextStatus === 'PAID' ? { paidAt: payment.paidAt ?? now } : {}),
          ...(!payment.reference && callback.reference ? { reference: callback.reference } : {})
        }
      });

      if (nextStatus !== 'PAID') {
        return;
      }

      const endsAt = computeEndsAt(payment.subscription.endsAt, now, payment.durationMonths);

      await tx.subscription.update({
        where: {
          id: payment.subscriptionId
        },
        data: {
          plan: payment.plan,
          endsAt
        }
      });

      await tx.notification.create({
        data: {
          userId: payment.subscription.userId,
          type: 'SYSTEM',
          title: 'Langganan aktif',
          body: `Pembayaran langganan telah diterima. Akses langganan aktif sampai ${Intl.DateTimeFormat(
            'id-ID',
            { dateStyle: 'long' }
          ).format(endsAt)}.`,
          data: {
            subscriptionId: payment.subscriptionId,
            merchantOrderId: callback.merchantOrderId
          }
        }
      });
    });

    return jsonOk({ message: 'Notifikasi pembayaran diproses.' });
  } catch (error) {
    return handleRouteError(error);
  }
}
