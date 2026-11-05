import assert from 'node:assert/strict';
import { isDoctorOpenNow, isFacilityOpenNow } from '@/lib/availability';

const atTenJakarta = new Date('2026-11-05T03:00:00.000Z');
const atEightJakarta = new Date('2026-11-05T01:00:00.000Z');

assert.equal(
  isDoctorOpenNow(
    [{ dayOfWeek: 4, startTime: '09:00', endTime: '17:00', isActive: true }],
    atTenJakarta
  ),
  true
);
assert.equal(
  isDoctorOpenNow(
    [{ dayOfWeek: 4, startTime: '09:00', endTime: '17:00', isActive: true }],
    atEightJakarta
  ),
  false
);
assert.equal(
  isFacilityOpenNow(
    [{ dayOfWeek: 4, openTime: '09:00', closeTime: '17:00', isClosed: false }],
    atTenJakarta
  ),
  true
);
assert.equal(
  isFacilityOpenNow(
    [{ dayOfWeek: 4, openTime: '09:00', closeTime: '17:00', isClosed: true }],
    atTenJakarta
  ),
  false
);
console.log('availability.check: ok');
