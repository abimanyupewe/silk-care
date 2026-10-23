import { spawnSync } from 'node:child_process';

export function sqlString(value: string) {
  return `'${value.replace(/'/g, "''")}'`;
}

export function sqlNullableString(value: string | null | undefined) {
  if (value === null || value === undefined || value === '') {
    return 'NULL';
  }

  return sqlString(value);
}

export function runSql(sql: string) {
  const result = spawnSync('npx', ['prisma', 'db', 'execute', '--stdin'], {
    input: sql,
    stdio: ['pipe', 'inherit', 'inherit']
  });

  if (result.status !== 0) {
    throw new Error('Eksekusi SQL gagal.');
  }
}
