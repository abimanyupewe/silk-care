import type { Prisma } from '@/lib/generated/prisma';
import { addMonths } from '@/lib/months';

export const TRIAL_MONTHS = 6;

// Placeholder harga langganan sampai keputusan harga per tipe mitra final (lihat
// dev/Breakdown Fungsional Demo SILK.md, keputusan terbuka soal harga langganan).
export const DEFAULT_SUBSCRIPTION_AMOUNT = 600000;
export const DEFAULT_SUBSCRIPTION_DURATION_MONTHS = 12;

// Harga efektif sebuah pembelian: paket khusus dari admin menang atas harga umum per
// tipe mitra, dan salah satunya wajib menggantikan placeholder.
export function resolveSubscriptionPricing(
  subscription: {
    plan: string;
    customAmount: number | null;
    customDurationMonths: number | null;
  },
  partnerType: string | null,
  priceAmount: number | null
): {
  amount: number;
  durationMonths: number;
  plan: 'YEARLY' | 'ENTERPRISE';
} {
  if (
    subscription.customAmount != null &&
    subscription.customDurationMonths != null &&
    subscription.customDurationMonths > 0
  ) {
    return {
      amount: subscription.customAmount,
      durationMonths: subscription.customDurationMonths,
      plan: subscription.plan === 'ENTERPRISE' ? 'ENTERPRISE' : 'YEARLY'
    };
  }

  return {
    amount: partnerType && priceAmount != null ? priceAmount : DEFAULT_SUBSCRIPTION_AMOUNT,
    durationMonths: DEFAULT_SUBSCRIPTION_DURATION_MONTHS,
    plan: 'YEARLY'
  };
}

// Dipakai sebagai nilai filter relasi `user:`; batas `gt` berarti tepat di endsAt sudah tidak aktif.
export function activeSubscriptionWhere(now: Date) {
  return { deletedAt: null, subscription: { is: { endsAt: { gt: now } } } } as const;
}

// Perpanjangan sebelum habis menyambung dari endsAt, bukan dari sekarang.
export function computeEndsAt(currentEndsAt: Date | null, now: Date, durationMonths: number): Date {
  const base = currentEndsAt && currentEndsAt > now ? currentEndsAt : now;
  return addMonths(base, durationMonths);
}

export async function startTrial(
  tx: Prisma.TransactionClient,
  userId: string,
  now: Date
): Promise<Date> {
  const endsAt = addMonths(now, TRIAL_MONTHS);
  await tx.subscription.create({ data: { userId, plan: 'FREE_TRIAL', endsAt } });
  return endsAt;
}
