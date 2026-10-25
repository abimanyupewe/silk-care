import { jsonError, jsonOk, handleRouteError } from '@/lib/api';
import { expireDueOrders } from '@/lib/order-expiry';

export async function GET(request: Request) {
  try {
    const secret = process.env.CRON_SECRET?.trim();

    if (!secret) {
      return jsonError('Cron belum dikonfigurasi.', 503);
    }

    const authorization = request.headers.get('authorization');

    if (authorization !== `Bearer ${secret}`) {
      return jsonError('Akses ditolak.', 401);
    }

    const result = await expireDueOrders(200);

    return jsonOk(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
