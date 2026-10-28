import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth-guard';
import { handleRouteError, jsonOk, jsonTooManyRequests } from '@/lib/api';
import { cartSelect, serializeCart } from '@/lib/cart';
import { rateLimit } from '@/lib/rate-limit';

export async function GET() {
  try {
    const auth = await requireUser();

    if (!auth.ok) {
      return auth.error;
    }

    const cart = await prisma.cart.findUnique({
      where: {
        userId: auth.user.id
      },
      select: cartSelect
    });

    return jsonOk(serializeCart(cart));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE() {
  try {
    const auth = await requireUser();

    if (!auth.ok) {
      return auth.error;
    }

    const limit = await rateLimit(`cart:write:${auth.user.id}`, 60, 60 * 1000);

    if (!limit.allowed) {
      return jsonTooManyRequests(limit.resetAt);
    }

    const existing = await prisma.cart.findUnique({
      where: {
        userId: auth.user.id
      },
      select: {
        id: true
      }
    });

    if (!existing) {
      return jsonOk(serializeCart(null));
    }

    const cart = await prisma.cart.update({
      where: {
        id: existing.id
      },
      data: {
        facilityId: null,
        items: {
          deleteMany: {}
        }
      },
      select: cartSelect
    });

    return jsonOk(serializeCart(cart));
  } catch (error) {
    return handleRouteError(error);
  }
}
