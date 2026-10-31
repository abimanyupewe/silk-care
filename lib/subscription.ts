import type { Prisma } from '@/lib/generated/prisma';
import { addMonths } from '@/lib/months';

export const TRIAL_MONTHS = 6;

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
