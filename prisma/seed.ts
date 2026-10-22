import 'dotenv/config';
import { spawnSync } from 'node:child_process';
import bcrypt from 'bcryptjs';

function sqlString(value: string) {
  return `'${value.replace(/'/g, "''")}'`;
}

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  const name = process.env.SEED_ADMIN_NAME?.trim() || 'Admin SILK';

  if (!email || !password) {
    throw new Error('SEED_ADMIN_EMAIL dan SEED_ADMIN_PASSWORD wajib diisi.');
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // Seed memakai `prisma db execute` (direct connection), bukan Prisma Client,
  // agar tidak bergantung pada koneksi pooled/WebSocket saat CLI.
  const sql = `
INSERT INTO "User" ("id", "email", "passwordHash", "name", "role", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid()::text,
  ${sqlString(email)},
  ${sqlString(passwordHash)},
  ${sqlString(name)},
  'ADMIN',
  NOW(),
  NOW()
)
ON CONFLICT ("email") DO UPDATE SET
  "name" = EXCLUDED."name",
  "passwordHash" = EXCLUDED."passwordHash",
  "role" = 'ADMIN',
  "updatedAt" = NOW();
`;

  const result = spawnSync('npx', ['prisma', 'db', 'execute', '--stdin'], {
    input: sql,
    stdio: ['pipe', 'inherit', 'inherit']
  });

  if (result.status !== 0) {
    throw new Error('Seed gagal dijalankan.');
  }

  console.log(`Admin siap: ${email}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
