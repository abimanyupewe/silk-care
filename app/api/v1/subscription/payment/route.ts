import { randomUUID } from 'node:crypto';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth-guard';
import { handleRouteError, jsonCreated, jsonError, jsonOk, jsonTooManyRequests } from '@/lib/api';
import { rateLimit } from '@/lib/rate-limit';
import { DUITKU_SUB_PREFIX, createDuitkuInvoice, isDuitkuConfigured } from '@/lib/payments/duitku';
import { resolvePartnerPricing } from '@/lib/subscription-price';
import { logError } from '@/lib/logger';

// Faktur kedaluwarsa 60 menit (mengikuti expiryPeriod createInvoice).
const INVOICE_EXPIRY_MINUTES = 60;

function planLabel(amount: number, durationMonths: number, plan: 'YEARLY' | 'ENTERPRISE') {
  return `${plan === 'YEARLY' ? 'Tahunan' : 'Enterprise'} ${durationMonths} bulan (${amount})`;
}

export async function POST() {
  try {
    const auth = await requireRole(['DOCTOR', 'FACILITY', 'PHARMACY']);

    if (!auth.ok) {
      return auth.error;
    }

    const limit = await rateLimit(`subscription:payment:${auth.user.id}`, 10, 10 * 60 * 1000);

    if (!limit.allowed) {
      return jsonTooManyRequests(limit.resetAt);
    }

    if (!isDuitkuConfigured()) {
      return jsonError('Pembayaran belum dikonfigurasi.', 503);
    }

    const subscription = await prisma.subscription.findUnique({
      where: {
        userId: auth.user.id
      },
      select: {
        id: true,
        plan: true,
        endsAt: true,
        customAmount: true,
        customDurationMonths: true
      }
    });

    if (!subscription) {
      return jsonError('Langganan tidak ditemukan.', 404);
    }

    const now = new Date();

    // Invoice yang belum kedaluwarsa dipakai ulang: createInvoice dengan order ID sama
    // dalam 5 menit akan ditolak Duitku (dokumen: 'The transaction is still in progress').
    const pending = await prisma.subscriptionPayment.findFirst({
      where: {
        subscriptionId: subscription.id,
        status: 'PENDING',
        expiresAt: {
          gt: now
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        amount: true,
        durationMonths: true,
        expiresAt: true,
        paymentUrl: true,
        plan: true
      }
    });

    if (pending?.paymentUrl) {
      return jsonOk({
        message: 'Pembayaran masih menunggu pembayaran.',
        merchantOrderId: null,
        amount: pending.amount,
        plan: pending.plan,
        durationMonths: pending.durationMonths,
        expiresAt: pending.expiresAt,
        paymentUrl: pending.paymentUrl
      });
    }

    if (!auth.user.email) {
      return jsonError('Email akun belum diisi; pembayaran butuh email.', 400);
    }

    const { amount, durationMonths, plan } = await resolvePartnerPricing(
      subscription,
      auth.user.role,
      auth.user.id
    );

    const merchantOrderId = `${DUITKU_SUB_PREFIX}${randomUUID()}`;
    const expiresAt = new Date(now.getTime() + INVOICE_EXPIRY_MINUTES * 60 * 1000);

    const attempt = await prisma.subscriptionPayment.create({
      data: {
        subscriptionId: subscription.id,
        plan,
        amount,
        durationMonths,
        merchantOrderId,
        status: 'PENDING',
        expiresAt
      },
      select: {
        id: true,
        merchantOrderId: true,
        amount: true,
        durationMonths: true,
        expiresAt: true
      }
    });

    try {
      const invoice = await createDuitkuInvoice({
        merchantOrderId: attempt.merchantOrderId,
        amount: attempt.amount,
        productDetails: `Langganan SILK ${planLabel(attempt.amount, attempt.durationMonths, plan)}`,
        email: auth.user.email,
        customerName: auth.user.name,
        items: [
          {
            name: `Langganan ${plan === 'YEARLY' ? 'tahunan' : 'enterprise'} SILK`,
            price: attempt.amount,
            quantity: 1
          }
        ]
      });

      await prisma.subscriptionPayment.update({
        where: { id: attempt.id },
        data: {
          reference: invoice.reference,
          paymentUrl: invoice.paymentUrl
        }
      });

      return jsonCreated({
        merchantOrderId: attempt.merchantOrderId,
        plan,
        amount: attempt.amount,
        durationMonths: attempt.durationMonths,
        expiresAt: attempt.expiresAt,
        paymentUrl: invoice.paymentUrl
      });
    } catch (error) {
      // Invoice gagal dibuat: baris PENDING dikembalikan FAILED supaya percobaan berikutnya
      // tidak memakai ulang order ID yang bermasalah.
      await prisma.subscriptionPayment.update({
        where: { id: attempt.id },
        data: {
          status: 'FAILED',
          rawPayload: {
            error: error instanceof Error ? error.message : 'gagal membuat invoice Duitku'
          }
        }
      });

      throw error;
    }
  } catch (error) {
    // Detail error Duitku cukup untuk log server; API membalas pesan umum.
    if (
      error instanceof Error &&
      (error.message.startsWith('Duitku') || error.name === 'DuitkuNotConfiguredError')
    ) {
      logError('subscription_payment_duitku_failed', error, {
        route: 'POST /api/v1/subscription/payment'
      });

      return jsonError('Duitku gagal membuat invoice; coba lagi nanti.', 502);
    }

    return handleRouteError(error);
  }
}
