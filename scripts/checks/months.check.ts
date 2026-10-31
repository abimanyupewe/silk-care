import assert from 'node:assert/strict';
import { addMonths } from '@/lib/months';

const cases: [string, number, string][] = [
  ['2026-08-31T10:00:00Z', 6, '2027-02-28T10:00:00.000Z'],
  ['2027-08-31T10:00:00Z', 6, '2028-02-29T10:00:00.000Z'],
  ['2026-01-31T00:00:00Z', 1, '2026-02-28T00:00:00.000Z'],
  ['2026-10-31T00:00:00Z', 12, '2027-10-31T00:00:00.000Z'],
  ['2026-11-15T00:00:00Z', 3, '2027-02-15T00:00:00.000Z']
];

for (const [from, months, expected] of cases) {
  assert.equal(addMonths(new Date(from), months).toISOString(), expected);
}
console.log('months.check: ok');
