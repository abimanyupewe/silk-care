import assert from 'node:assert/strict';
import { buildFormSteps, cleanValues } from '../../components/partner/register-steps';
import { partnerTypes } from '../../lib/partner-requirements/types';
import { isPartnerSignUpUrl } from '../../lib/roles';

const ids = (t: Parameters<typeof buildFormSteps>[0], a: boolean) =>
  buildFormSteps(t, a)
    .map((s) => s.id)
    .join(',');

assert.equal(ids('CLINIC', true), 'account,basic,details,location,review');
assert.equal(ids('DOCTOR', false), 'basic,details,location,review');
for (const t of partnerTypes)
  assert.ok(buildFormSteps(t, true).find((s) => s.id === 'location')!.registry.length === 1);
assert.deepEqual(
  cleanValues(
    [
      { key: 'a', label: '', kind: 'text', target: 'column' },
      { key: 'b', label: '', kind: 'list', target: 'column' },
      { key: 'c', label: '', kind: 'boolean', target: 'column' },
      { key: 'd', label: '', kind: 'number', target: 'column' }
    ],
    { a: '  ', b: ['x ', ''], c: false, d: undefined }
  ),
  { b: ['x'], c: false }
);
assert.ok(isPartnerSignUpUrl('/mitra/daftar?type=DOCTOR'));
assert.ok(isPartnerSignUpUrl('/mitra/daftar'));
assert.ok(!isPartnerSignUpUrl('/mitra/daftar?type=NOPE'));
assert.ok(!isPartnerSignUpUrl('/mitra/daftar/x'));
assert.ok(!isPartnerSignUpUrl('/mitra/daftar?type=DOCTOR&x=1'));
console.log('register-steps ok');
