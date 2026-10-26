import { z } from 'zod';
import { requireRole } from '@/lib/auth-guard';
import { handleRouteError, jsonError, jsonOk, parseJson } from '@/lib/api';
import { OrderActionError } from '@/lib/order';
import { changeOrderStatus } from '@/lib/order-status';

const statusSchema = z.object({
  status: z.enum(['PROCESSING', 'SHIPPED', 'COMPLETED', 'CANCELLED']),
  note: z.string().trim().max(500).nullable().optional()
});

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const auth = await requireRole(['ADMIN']);

    if (!auth.ok) {
      return auth.error;
    }

    const { id } = await context.params;
    const parsed = await parseJson(request, statusSchema);

    if (parsed.error) {
      return parsed.error;
    }

    const order = await changeOrderStatus({
      orderId: id,
      nextStatus: parsed.data.status,
      changedById: auth.user.id,
      note: parsed.data.note,
      audit: {
        request
      }
    });

    return jsonOk(order);
  } catch (error) {
    if (error instanceof OrderActionError) {
      return jsonError(error.message, error.status);
    }

    return handleRouteError(error);
  }
}
