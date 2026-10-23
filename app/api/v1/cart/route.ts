import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth-guard';
import { handleRouteError, jsonOk } from '@/lib/api';
import { cartSelect, serializeCart } from '@/lib/cart';

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
