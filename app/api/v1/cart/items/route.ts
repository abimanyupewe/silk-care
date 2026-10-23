import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth-guard';
import { publicProductWhere } from '@/lib/catalog';
import { handleRouteError, jsonError, jsonOk, parseJson } from '@/lib/api';
import { cartSelect, serializeCart } from '@/lib/cart';

const addItemSchema = z.object({
  productId: z.string().trim().min(1).max(100),
  quantity: z.number().int().min(1).max(99)
});

export async function POST(request: Request) {
  try {
    const auth = await requireUser();

    if (!auth.ok) {
      return auth.error;
    }

    const parsed = await parseJson(request, addItemSchema);

    if (parsed.error) {
      return parsed.error;
    }

    const { productId, quantity } = parsed.data;

    const product = await prisma.product.findFirst({
      where: {
        ...publicProductWhere,
        id: productId
      },
      select: {
        id: true,
        name: true,
        facilityId: true,
        stock: true
      }
    });

    if (!product) {
      return jsonError('Produk tidak ditemukan atau tidak tersedia.', 404);
    }

    const cart = await prisma.cart.findUnique({
      where: {
        userId: auth.user.id
      },
      select: {
        id: true,
        facilityId: true,
        items: {
          select: {
            productId: true,
            quantity: true
          }
        }
      }
    });

    if (cart && cart.items.length > 0 && cart.facilityId !== product.facilityId) {
      return jsonError(
        'Keranjang hanya dapat berisi produk dari satu fasilitas. Kosongkan keranjang terlebih dahulu.',
        409
      );
    }

    const existingQuantity =
      cart?.items.find((item) => item.productId === product.id)?.quantity ?? 0;
    const nextQuantity = existingQuantity + quantity;

    if (nextQuantity > 99) {
      return jsonError('Jumlah produk dalam keranjang maksimal 99.', 422);
    }

    if (nextQuantity > product.stock) {
      return jsonError(`Stok ${product.name} tidak mencukupi.`, 409);
    }

    if (cart) {
      await prisma.$transaction([
        prisma.cart.update({
          where: {
            id: cart.id
          },
          data: {
            facilityId: product.facilityId
          }
        }),
        prisma.cartItem.upsert({
          where: {
            cartId_productId: {
              cartId: cart.id,
              productId: product.id
            }
          },
          create: {
            cartId: cart.id,
            productId: product.id,
            quantity
          },
          update: {
            quantity: nextQuantity
          }
        })
      ]);
    } else {
      await prisma.cart.create({
        data: {
          userId: auth.user.id,
          facilityId: product.facilityId,
          items: {
            create: {
              productId: product.id,
              quantity
            }
          }
        }
      });
    }

    const updatedCart = await prisma.cart.findUnique({
      where: {
        userId: auth.user.id
      },
      select: cartSelect
    });

    return jsonOk(serializeCart(updatedCart));
  } catch (error) {
    return handleRouteError(error);
  }
}
