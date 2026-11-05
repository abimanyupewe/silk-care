import assert from 'node:assert/strict';
import {
  activeSubscriptionWhere,
  computeEndsAt,
  resolveSubscriptionPricing
} from '@/lib/subscription';
const d = (iso: string) => new Date(iso);

assert.equal(
  computeEndsAt(null, d('2026-10-31T00:00:00Z'), 12).toISOString(),
  '2027-10-31T00:00:00.000Z'
);
// Perpanjangan sebelum habis: sisa masa aktif dipertahankan.
assert.equal(
  computeEndsAt(d('2027-01-15T00:00:00Z'), d('2026-12-01T00:00:00Z'), 12).toISOString(),
  '2028-01-15T00:00:00.000Z'
);
// Perpanjangan setelah habis: dihitung dari sekarang.
assert.equal(
  computeEndsAt(d('2026-01-01T00:00:00Z'), d('2026-12-01T00:00:00Z'), 12).toISOString(),
  '2027-12-01T00:00:00.000Z'
);

const now = d('2026-10-31T00:00:00Z');
const where = activeSubscriptionWhere(now);
assert.equal(where.deletedAt, null);
assert.deepEqual(Object.keys(where.subscription.is.endsAt), ['gt']);
assert.equal(where.subscription.is.endsAt.gt, now);

// Harga efektif: paket khusus admin menang, lalu harga per tipe mitra, placeholder terakhir.
const baseSub = { plan: 'FREE_TRIAL', customAmount: null, customDurationMonths: null };
assert.deepEqual(resolveSubscriptionPricing(baseSub, 'DOCTOR', null), {
  amount: 600000,
  durationMonths: 12,
  plan: 'YEARLY'
});
assert.deepEqual(resolveSubscriptionPricing(baseSub, 'DOCTOR', 750000), {
  amount: 750000,
  durationMonths: 12,
  plan: 'YEARLY'
});
// Paket khusus admin (customAmount + customDurationMonths) menang atas semua harga umum.
assert.deepEqual(
  resolveSubscriptionPricing(
    { plan: 'ENTERPRISE', customAmount: 1200000, customDurationMonths: 18 },
    'DOCTOR',
    750000
  ),
  { amount: 1200000, durationMonths: 18, plan: 'ENTERPRISE' }
);
// customDurationMonths nol/negatif diabaikan, kembali ke harga umum.
assert.deepEqual(
  resolveSubscriptionPricing(
    { plan: 'YEARLY', customAmount: 1200000, customDurationMonths: 0 },
    'DOCTOR',
    750000
  ),
  { amount: 750000, durationMonths: 12, plan: 'YEARLY' }
);
// Tanpa partnerType, tabel harga tidak relevan → placeholder.
assert.deepEqual(resolveSubscriptionPricing(baseSub, null, 750000), {
  amount: 600000,
  durationMonths: 12,
  plan: 'YEARLY'
});

console.log('subscription.check: ok');
