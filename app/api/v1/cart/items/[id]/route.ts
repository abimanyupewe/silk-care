import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth-guard';
import { handleRouteError, jsonError, jsonOk, parseJson } from '@/lib/api';
import { cartSelect, serializeCart } from '@/lib/cart';

const updateItemSchema = z.object({
  quantity: z.number().int().min(1).max(99)
});

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const auth = await requireUser();

    if (!auth.ok) {
      return auth.error;
    }

    const { id } = await context.params;
    const parsed = await parseJson(request, updateItemSchema);

    if (parsed.error) {
      return parsed.error;
    }

    const item = await prisma.cartItem.findFirst({
      where: {
        id,
        cart: {
          userId: auth.user.id
        }
      },
      select: {
        id: true,
        cartId: true,
        product: {
          select: {
            name: true,
            stock: true,
            active: true,
            deletedAt: true,
            facility: {
              select: {
                verificationStatus: true
              }
            }
          }
        }
      }
    });

    if (!item) {
      return jsonError('Item keranjang tidak ditemukan.', 404);
    }

    if (
      !item.product.active ||
      item.product.deletedAt !== null ||
      item.product.facility.verificationStatus !== 'VERIFIED'
    ) {
      return jsonError('Produk sudah tidak tersedia.', 409);
    }

    if (parsed.data.quantity > item.product.stock) {
      return jsonError(`Stok ${item.product.name} tidak mencukupi.`, 409);
    }

    await prisma.cartItem.update({
      where: {
        id: item.id
      },
      data: {
        quantity: parsed.data.quantity
      }
    });

    const cart = await prisma.cart.findUnique({
      where: {
        id: item.cartId
      },
      select: cartSelect
    });

    return jsonOk(serializeCart(cart));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const auth = await requireUser();

    if (!auth.ok) {
      return auth.error;
    }

    const { id } = await context.params;
    const item = await prisma.cartItem.findFirst({
      where: {
        id,
        cart: {
          userId: auth.user.id
        }
      },
      select: {
        id: true,
        cartId: true
      }
    });

    if (!item) {
      return jsonError('Item keranjang tidak ditemukan.', 404);
    }

    await prisma.$transaction(async (tx) => {
      await tx.cartItem.delete({
        where: {
          id: item.id
        }
      });

      const remaining = await tx.cartItem.count({
        where: {
          cartId: item.cartId
        }
      });

      if (remaining === 0) {
        await tx.cart.update({
          where: {
            id: item.cartId
          },
          data: {
            facilityId: null
          }
        });
      }
    });

    const cart = await prisma.cart.findUnique({
      where: {
        id: item.cartId
      },
      select: cartSelect
    });

    return jsonOk(serializeCart(cart));
  } catch (error) {
    return handleRouteError(error);
  }
}
