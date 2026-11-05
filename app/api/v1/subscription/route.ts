import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth-guard';
import { handleRouteError, jsonError, jsonOk } from '@/lib/api';
import { isDuitkuConfigured } from '@/lib/payments/duitku';
import { checkDuitkuStatus, mapDuitkuStatusStatusCode } from '@/lib/payments/duitku-status';
import { applySubscriptionStatusChange } from '@/lib/subscription-settle';
import { resolvePartnerPricing } from '@/lib/subscription-price';

import type { SubscriptionPaymentForSettle } from '@/lib/subscription-settle';

// Status langganan mitra untuk panel. Sekaligus jalur cadangan Transaction Status Duitku:
// baris PENDING ditanyakan ke Duitku (docs POP), supaya update status tidak berharap hanya
// pada callback yang bisa terlewat.
export async function GET() {
  try {
    const auth = await requireRole(['DOCTOR', 'FACILITY', 'PHARMACY']);

    if (!auth.ok) {
      return auth.error;
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

    let activePlan = subscription.plan;
    let activeEndsAt = subscription.endsAt;

    const pending = await prisma.subscriptionPayment.findFirst({
      where: {
        subscriptionId: subscription.id,
        status: 'PENDING'
      },
      orderBy: {
        createdAt: 'desc'
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
        merchantOrderId: true,
        expiresAt: true,
        paymentUrl: true,
        subscription: {
          select: {
            userId: true,
            endsAt: true
          }
        }
      }
    });

    let pendingPayment: {
      merchantOrderId: string;
      amount: number;
      plan: string;
      durationMonths: number;
      expiresAt: Date | null;
      paymentUrl: string;
    } | null =
      pending?.paymentUrl != null
        ? {
            merchantOrderId: pending.merchantOrderId,
            amount: pending.amount,
            plan: pending.plan,
            durationMonths: pending.durationMonths,
            expiresAt: pending.expiresAt,
            paymentUrl: pending.paymentUrl
          }
        : null;

    // Cadangan callback: PENDING dengan paymentUrl diinterogasi ke Duitku; hasil PAID atau
    // FAILED menyettle barisnya sama seperti callback. Gagal jaringan hanya dibiarkan lewat
    // tanpa mengubah apa pun.
    if (pending?.paymentUrl && isDuitkuConfigured()) {
      const status = await checkDuitkuStatus(pending.merchantOrderId);
      const next = status ? mapDuitkuStatusStatusCode(status.statusCode) : null;

      if (next) {
        const applied = await applySubscriptionStatusChange(
          pending as SubscriptionPaymentForSettle,
          next,
          {
            rawPayload: status?.raw ?? {},
            reference: status?.reference,
            merchantOrderId: pending.merchantOrderId
          }
        );

        if (applied.changed) {
          pendingPayment = null;

          if (next === 'PAID' && applied.endsAt) {
            activePlan = pending.plan;
            activeEndsAt = applied.endsAt;
          }
        }
      }
    }

    const pricing = await resolvePartnerPricing(subscription, auth.user.role, auth.user.id);

    return jsonOk({
      plan: activePlan,
      status: activeEndsAt > now ? 'ACTIVE' : 'EXPIRED',
      endsAt: activeEndsAt,
      amount: pricing.amount,
      durationMonths: pricing.durationMonths,
      pendingPayment
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
