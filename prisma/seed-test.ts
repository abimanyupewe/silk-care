import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { runSql, sqlString } from './run-sql';

// Akun uji untuk tiap panel. Kredensial dibaca dari .env (TEST_*); seed ini idempoten dan
// memulihkan akun bila sempat dinonaktifkan. Berbeda dari seed-demo: tidak menyentuh data demo.
if (process.env.NODE_ENV === 'production') {
  throw new Error('seed-test tidak boleh dijalankan di production.');
}

function credential(prefix: string) {
  const email = process.env[`${prefix}_EMAIL`]?.trim().toLowerCase();
  const password = process.env[`${prefix}_PASSWORD`]?.trim();

  if (!email || !password || password.length < 8) {
    throw new Error(
      `${prefix}_EMAIL dan ${prefix}_PASSWORD (minimal 8 karakter) wajib diisi di .env.`
    );
  }

  return { email, password };
}

const doctor = credential('TEST_DOCTOR');
const facility = credential('TEST_FACILITY');
const pharmacy = credential('TEST_PHARMACY');
const patient = credential('TEST_PATIENT');

function upsertUser(input: { email: string; password: string }, name: string, role: string) {
  return `
INSERT INTO "User" ("id", "email", "passwordHash", "name", "role", "emailVerified", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid()::text,
  ${sqlString(input.email)},
  ${sqlString(bcrypt.hashSync(input.password, 12))},
  ${sqlString(name)},
  ${sqlString(role)},
  NOW(),
  NOW(),
  NOW()
)
ON CONFLICT ("email") DO UPDATE SET
  "passwordHash" = EXCLUDED."passwordHash",
  "name" = EXCLUDED."name",
  "role" = EXCLUDED."role",
  "emailVerified" = COALESCE("User"."emailVerified", EXCLUDED."emailVerified"),
  "deletedAt" = NULL,
  "updatedAt" = NOW();`;
}

runSql(`
${upsertUser(doctor, 'Dokter Uji', 'DOCTOR')}
${upsertUser(facility, 'Fasilitas Uji', 'FACILITY')}
${upsertUser(pharmacy, 'Apotek Uji', 'PHARMACY')}
${upsertUser(patient, 'Pengguna Uji', 'PATIENT')}

INSERT INTO "DoctorProfile" ("id", "slug", "userId", "specialty", "bio", "experienceYears", "consultationFee", "city", "latitude", "longitude", "verificationStatus", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid()::text,
  'dokter-uji',
  (SELECT "id" FROM "User" WHERE "email" = ${sqlString(doctor.email)}),
  'Dokter umum',
  'Akun uji untuk pengembangan panel dokter.',
  5,
  50000,
  'Malang',
  -6.2000, 106.8166,
  'VERIFIED',
  NOW(),
  NOW()
)
ON CONFLICT ("slug") DO UPDATE SET
  "userId" = EXCLUDED."userId",
  "latitude" = EXCLUDED."latitude",
  "longitude" = EXCLUDED."longitude",
  "verificationStatus" = 'VERIFIED',
  "updatedAt" = NOW();

INSERT INTO "Facility" ("id", "slug", "userId", "name", "type", "description", "city", "latitude", "longitude", "verificationStatus", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid()::text,
  'fasilitas-uji',
  (SELECT "id" FROM "User" WHERE "email" = ${sqlString(facility.email)}),
  'Klinik Uji',
  'CLINIC',
  'Akun uji untuk pengembangan panel fasilitas.',
  'Malang',
  -6.2100, 106.8300,
  'VERIFIED',
  NOW(),
  NOW()
)
ON CONFLICT ("slug") DO UPDATE SET
  "userId" = EXCLUDED."userId",
  "latitude" = EXCLUDED."latitude",
  "longitude" = EXCLUDED."longitude",
  "verificationStatus" = 'VERIFIED',
  "updatedAt" = NOW();

INSERT INTO "Facility" ("id", "slug", "userId", "name", "type", "description", "city", "latitude", "longitude", "verificationStatus", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid()::text,
  'apotek-uji',
  (SELECT "id" FROM "User" WHERE "email" = ${sqlString(pharmacy.email)}),
  'Apotek Uji',
  'PHARMACY',
  'Akun uji untuk pengembangan panel apotek (pesanan dan produk).',
  'Malang',
  -6.1900, 106.8000,
  'VERIFIED',
  NOW(),
  NOW()
)
ON CONFLICT ("slug") DO UPDATE SET
  "userId" = EXCLUDED."userId",
  "latitude" = EXCLUDED."latitude",
  "longitude" = EXCLUDED."longitude",
  "verificationStatus" = 'VERIFIED',
  "updatedAt" = NOW();

UPDATE "DoctorProfile" SET
  "details" = '{"title":"dr.","languages":["Indonesia"]}'::jsonb,
  "internalDetails" = '{"strNumber":"TEST-STR-001"}'::jsonb
WHERE "slug" = 'dokter-uji';

INSERT INTO "Subscription" ("id", "userId", "plan", "endsAt", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid()::text,
  (SELECT "id" FROM "User" WHERE "email" = ${sqlString(doctor.email)}),
  'YEARLY',
  NOW() + interval '1 year',
  NOW(),
  NOW()
)
ON CONFLICT ("userId") DO UPDATE SET
  "plan" = 'YEARLY',
  "endsAt" = NOW() + interval '1 year',
  "updatedAt" = NOW();

UPDATE "Facility" SET
  "details" = '{"clinicKind":"GENERAL","acceptsBpjs":true,"inpatient":false}'::jsonb,
  "internalDetails" = '{"licenseNumber":"TEST-IZIN-001"}'::jsonb
WHERE "slug" = 'fasilitas-uji';

INSERT INTO "Subscription" ("id", "userId", "plan", "endsAt", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid()::text,
  (SELECT "id" FROM "User" WHERE "email" = ${sqlString(facility.email)}),
  'YEARLY',
  NOW() + interval '1 year',
  NOW(),
  NOW()
)
ON CONFLICT ("userId") DO UPDATE SET
  "plan" = 'YEARLY',
  "endsAt" = NOW() + interval '1 year',
  "updatedAt" = NOW();

UPDATE "Facility" SET
  "details" = '{"open24h":false,"acceptsPrescription":true,"delivery":false}'::jsonb,
  "internalDetails" = '{"licenseNumber":"TEST-IZIN-002"}'::jsonb
WHERE "slug" = 'apotek-uji';

INSERT INTO "Subscription" ("id", "userId", "plan", "endsAt", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid()::text,
  (SELECT "id" FROM "User" WHERE "email" = ${sqlString(pharmacy.email)}),
  'YEARLY',
  NOW() + interval '1 year',
  NOW(),
  NOW()
)
ON CONFLICT ("userId") DO UPDATE SET
  "plan" = 'YEARLY',
  "endsAt" = NOW() + interval '1 year',
  "updatedAt" = NOW();
`);

console.log('Akun uji siap:');
console.log(`- Dokter    : ${doctor.email}`);
console.log(`- Fasilitas : ${facility.email} (klinik, tanpa menu pesanan/produk)`);
console.log(`- Apotek    : ${pharmacy.email} (dengan menu pesanan/produk)`);
console.log(`- Pengguna  : ${patient.email}`);
console.log('Password ada di .env (TEST_*_PASSWORD).');
