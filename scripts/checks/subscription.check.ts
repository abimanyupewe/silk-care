import assert from 'node:assert/strict';
import { activeSubscriptionWhere, computeEndsAt } from '@/lib/subscription';

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

console.log('subscription.check: ok');
