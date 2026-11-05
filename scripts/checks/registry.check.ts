import assert from 'node:assert/strict';
import {
  buildPartnerSchema,
  buildStepSchema,
  isPartnerType,
  partnerRequirements,
  partnerTypes,
  splitValues
} from '@/lib/partner-requirements';

for (const type of partnerTypes) {
  assert.equal(partnerRequirements[type].draft, true, type);
  const keys = partnerRequirements[type].steps.flatMap((s) => s.fields.map((f) => f.key));
  assert.equal(new Set(keys).size, keys.length, `${type}: kunci field ganda`);
  for (const f of partnerRequirements[type].steps.flatMap((s) => s.fields)) {
    assert.ok(!(f.target === 'internal' && f.filterable), `${type}.${f.key}: internal filterable`);
    assert.ok(f.key !== 'password' && f.key !== 'email', `${type}: field akun`);
  }
}
assert.ok(isPartnerType('DOCTOR') && isPartnerType('PHARMACY') && !isPartnerType('X'));

const pharmacy = buildPartnerSchema('PHARMACY');
const full = {
  name: 'Apotek Sehat',
  city: 'Bandung',
  address: 'Jl. Merdeka 1',
  latitude: -6.2,
  longitude: 106.8
};
assert.ok(pharmacy.safeParse(full).success);
assert.ok(!pharmacy.safeParse({ ...full, name: undefined }).success);
assert.ok(!pharmacy.safeParse({ ...full, latitude: 91 }).success);
assert.ok(!pharmacy.safeParse({ ...full, longitude: 181 }).success);
assert.ok(!pharmacy.safeParse({ ...full, latitude: undefined }).success);
// kunci asing dibuang agar klien tidak bisa menyelundupkan kolom
const parsed = pharmacy.parse({ ...full, verificationStatus: 'VERIFIED', password: 'x' });
assert.ok(!('verificationStatus' in parsed) && !('password' in parsed));

const doctor = buildPartnerSchema('DOCTOR');
const doc = {
  specialty: 'Umum',
  city: 'Jakarta',
  address: 'Jl. A',
  latitude: -6.2,
  longitude: 106.8,
  phone: '08123456789',
  strNumber: '123'
};
const dp = doctor.parse(doc);
const split = splitValues('DOCTOR', dp);
assert.equal(split.internalDetails.strNumber, '123');
assert.ok(!('strNumber' in split.details) && !('strNumber' in split.columns));
assert.equal(split.details.phone, '08123456789');
assert.ok(!('phone' in split.columns));
assert.equal(split.columns.specialty, 'Umum');

const fac = splitValues(
  'PHARMACY',
  pharmacy.parse({ ...full, phone: '0221234567', open24h: true })
);
assert.equal(fac.columns.phone, '0221234567');
assert.equal(fac.columns.name, 'Apotek Sehat');
assert.ok(!('type' in fac.columns));

const optional = partnerRequirements.CLINIC.steps.find((s) => s.fields.every((f) => !f.required));
assert.ok(optional);
assert.ok(buildStepSchema(optional).safeParse({}).success);
console.log('registry.check: ok');
