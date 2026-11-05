import { prisma } from '@/lib/db';
import { resolveSubscriptionPricing } from '@/lib/subscription';
import type { Subscription } from '@/lib/generated/prisma';

// Tipe mitra untuk kunci SubscriptionPrice: DOCTOR, atau tipe profile fasilitas milik akun
// (FACILITY/PHARMACY dipetakan ke tipe fasilitas; pola sama seperti lib/facility-guard.ts).
export async function effectivePartnerType(role: string, userId: string): Promise<string | null> {
  if (role === 'DOCTOR') {
    return 'DOCTOR';
  }

  return (
    (
      await prisma.facility.findUnique({
        where: { userId },
        select: { type: true }
      })
    )?.type ?? role
  );
}

// Kombinasi tipe mitra + tabel harga + paket khusus admin menjadi nominal saat pembayaran.
export async function resolvePartnerPricing(
  subscription: Pick<Subscription, 'plan' | 'customAmount' | 'customDurationMonths'>,
  role: string,
  userId: string
): Promise<{
  amount: number;
  durationMonths: number;
  plan: 'YEARLY' | 'ENTERPRISE';
}> {
  const partnerType = await effectivePartnerType(role, userId);

  if (!partnerType) {
    return resolveSubscriptionPricing(subscription, null, null);
  }

  const price = await prisma.subscriptionPrice.findUnique({
    where: { partnerType },
    select: { amount: true }
  });

  return resolveSubscriptionPricing(subscription, partnerType, price?.amount ?? null);
}
