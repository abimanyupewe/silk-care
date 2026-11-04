import { prisma } from '@/lib/db';
import { computeEndsAt } from '@/lib/subscription';
import type { Prisma } from '@/lib/generated/prisma';
import type { PaymentAttemptStatus, SubscriptionPlan } from '@/lib/generated/prisma';

// Seleksi minimal untuk mengubah status satu SubscriptionPayment; dipakai callback Duitku
// dan jalur cadangan Transaction Status, jadi pola settle (perpanjangan langganan +
// notifikasi) didefinisikan satu kali di sini.
export type SubscriptionPaymentForSettle = {
  id: string;
  subscriptionId: string;
  plan: SubscriptionPlan;
  amount: number;
  durationMonths: number;
  status: PaymentAttemptStatus;
  paidAt: Date | null;
  reference: string | null;
  subscription: {
    userId: string;
    endsAt: Date | null;
  };
};

export type SubscriptionStatusApplyResult = {
  changed: boolean;
  endsAt: Date | null;
};

// Mengubah status pembayaran (dan menutup langganan bila PAID) tepat satu kali: status
// dipakai sebagai prasyarat updateMany, jadi dua kejadian bersamaan (duplikat callback
// berlawanan dengan pengecekan status) tidak bisa memperpanjang langganan dua kali.
export async function applySubscriptionStatusChange(
  payment: SubscriptionPaymentForSettle,
  next: 'PAID' | 'FAILED',
  extras: {
    rawPayload: Record<string, Prisma.InputJsonValue>;
    reference?: string | null;
    merchantOrderId: string;
  }
): Promise<SubscriptionStatusApplyResult> {
  const now = new Date();
  let changed = false;
  let endsAt: Date | null = null;

  await prisma.$transaction(async (tx) => {
    const updated = await tx.subscriptionPayment.updateMany({
      where: {
        id: payment.id,
        status: payment.status
      },
      data: {
        status: next,
        rawPayload: extras.rawPayload,
        ...(next === 'PAID' ? { paidAt: payment.paidAt ?? now } : {}),
        ...(!payment.reference && extras.reference ? { reference: extras.reference } : {})
      }
    });

    // Prasyarat tidak terpenuhi: proses lain sudah mengubah baris ini terlebih dahulu.
    if (updated.count === 0) {
      return;
    }

    changed = true;

    if (next !== 'PAID') {
      return;
    }

    endsAt = computeEndsAt(payment.subscription.endsAt, now, payment.durationMonths);

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
          merchantOrderId: extras.merchantOrderId
        }
      }
    });
  });

  return { changed, endsAt };
}
