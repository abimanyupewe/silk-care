import type { Prisma } from '@/lib/generated/prisma';

export const cartSelect = {
  id: true,
  facilityId: true,
  createdAt: true,
  updatedAt: true,
  facility: {
    select: {
      id: true,
      slug: true,
      name: true,
      city: true,
      type: true,
      verificationStatus: true
    }
  },
  items: {
    orderBy: {
      createdAt: 'asc'
    },
    select: {
      id: true,
      quantity: true,
      createdAt: true,
      updatedAt: true,
      product: {
        select: {
          id: true,
          slug: true,
          name: true,
          price: true,
          stock: true,
          image: true,
          category: true,
          active: true,
          deletedAt: true,
          facilityId: true
        }
      }
    }
  }
} satisfies Prisma.CartSelect;

export type CartWithItems = Prisma.CartGetPayload<{
  select: typeof cartSelect;
}>;

export function serializeCart(cart: CartWithItems | null) {
  if (!cart) {
    return {
      id: null,
      facilityId: null,
      facility: null,
      items: [],
      totalItems: 0,
      subtotal: 0
    };
  }

  const items = cart.items.map((item) => {
    const { deletedAt, ...product } = item.product;

    return {
      id: item.id,
      quantity: item.quantity,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      product,
      subtotal: product.price * item.quantity,
      available: product.active && deletedAt === null && product.stock >= item.quantity
    };
  });

  return {
    id: cart.id,
    facilityId: cart.facilityId,
    facility: cart.facility,
    items,
    totalItems: items.reduce((total, item) => total + item.quantity, 0),
    subtotal: items.reduce((total, item) => total + item.subtotal, 0)
  };
}
