import { prisma } from '@/lib/db';
import { jsonError, jsonOk } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startedAt = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;

    return jsonOk({
      status: 'ok',
      database: 'up',
      latencyMs: Date.now() - startedAt
    });
  } catch (error) {
    console.error('[health]', error);

    return jsonError('Database tidak tersedia.', 503);
  }
}
