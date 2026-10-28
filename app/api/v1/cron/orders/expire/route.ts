import { timingSafeEqual } from 'node:crypto';
import { jsonError, jsonOk, handleRouteError } from '@/lib/api';
import { cleanupExpiredIdempotencyKeys } from '@/lib/idempotency';
import { expireDueOrders } from '@/lib/order-expiry';

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function noStore(response: Response) {
  response.headers.set('Cache-Control', 'no-store');
  return response;
}

export async function GET(request: Request) {
  try {
    const secret = process.env.CRON_SECRET?.trim();

    if (!secret) {
      return noStore(jsonError('Cron belum dikonfigurasi.', 503));
    }

    const authorization = request.headers.get('authorization') ?? '';

    if (!safeEqual(authorization, `Bearer ${secret}`)) {
      return noStore(jsonError('Akses ditolak.', 401));
    }

    const result = await expireDueOrders(200);
    const idempotencyKeysDeleted = await cleanupExpiredIdempotencyKeys();

    return noStore(
      jsonOk({
        ...result,
        idempotencyKeysDeleted
      })
    );
  } catch (error) {
    return noStore(await handleRouteError(error));
  }
}
