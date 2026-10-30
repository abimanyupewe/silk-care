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

INSERT INTO "DoctorProfile" ("id", "slug", "userId", "specialty", "bio", "experienceYears", "consultationFee", "city", "verificationStatus", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid()::text,
  'dokter-uji',
  (SELECT "id" FROM "User" WHERE "email" = ${sqlString(doctor.email)}),
  'Dokter umum',
  'Akun uji untuk pengembangan panel dokter.',
  5,
  50000,
  'Malang',
  'VERIFIED',
  NOW(),
  NOW()
)
ON CONFLICT ("slug") DO UPDATE SET
  "userId" = EXCLUDED."userId",
  "verificationStatus" = 'VERIFIED',
  "updatedAt" = NOW();

INSERT INTO "Facility" ("id", "slug", "userId", "name", "type", "description", "city", "verificationStatus", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid()::text,
  'fasilitas-uji',
  (SELECT "id" FROM "User" WHERE "email" = ${sqlString(facility.email)}),
  'Klinik Uji',
  'CLINIC',
  'Akun uji untuk pengembangan panel fasilitas.',
  'Malang',
  'VERIFIED',
  NOW(),
  NOW()
)
ON CONFLICT ("slug") DO UPDATE SET
  "userId" = EXCLUDED."userId",
  "verificationStatus" = 'VERIFIED',
  "updatedAt" = NOW();

INSERT INTO "Facility" ("id", "slug", "userId", "name", "type", "description", "city", "verificationStatus", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid()::text,
  'apotek-uji',
  (SELECT "id" FROM "User" WHERE "email" = ${sqlString(pharmacy.email)}),
  'Apotek Uji',
  'PHARMACY',
  'Akun uji untuk pengembangan panel apotek (pesanan dan produk).',
  'Malang',
  'VERIFIED',
  NOW(),
  NOW()
)
ON CONFLICT ("slug") DO UPDATE SET
  "userId" = EXCLUDED."userId",
  "verificationStatus" = 'VERIFIED',
  "updatedAt" = NOW();
`);

console.log('Akun uji siap:');
console.log(`- Dokter    : ${doctor.email}`);
console.log(`- Fasilitas : ${facility.email} (klinik, tanpa menu pesanan/produk)`);
console.log(`- Apotek    : ${pharmacy.email} (dengan menu pesanan/produk)`);
console.log(`- Pengguna  : ${patient.email}`);
console.log('Password ada di .env (TEST_*_PASSWORD).');
