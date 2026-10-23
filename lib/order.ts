import type { Prisma } from '@/lib/generated/prisma';

export const orderListSelect = {
  id: true,
  status: true,
  paymentStatus: true,
  total: true,
  createdAt: true,
  updatedAt: true,
  facility: {
    select: {
      id: true,
      slug: true,
      name: true,
      city: true,
      type: true
    }
  },
  items: {
    select: {
      id: true,
      productName: true,
      productSlug: true,
      productImage: true,
      quantity: true,
      price: true
    }
  }
} satisfies Prisma.OrderSelect;

export const orderDetailSelect = {
  id: true,
  status: true,
  paymentStatus: true,
  total: true,
  recipientName: true,
  recipientPhone: true,
  shippingAddress: true,
  shippingCity: true,
  shippingPostalCode: true,
  notes: true,
  paidAt: true,
  expiresAt: true,
  cancelledAt: true,
  createdAt: true,
  updatedAt: true,
  facility: {
    select: {
      id: true,
      slug: true,
      name: true,
      city: true,
      type: true,
      phone: true
    }
  },
  items: {
    select: {
      id: true,
      productId: true,
      productName: true,
      productSlug: true,
      productImage: true,
      quantity: true,
      price: true
    }
  },
  statusHistory: {
    orderBy: {
      createdAt: 'asc'
    },
    select: {
      id: true,
      status: true,
      note: true,
      createdAt: true,
      changedBy: {
        select: {
          name: true
        }
      }
    }
  },
  payments: {
    orderBy: {
      createdAt: 'desc'
    },
    select: {
      id: true,
      status: true,
      amount: true,
      redirectUrl: true,
      expiresAt: true,
      paidAt: true,
      createdAt: true
    }
  }
} satisfies Prisma.OrderSelect;

export class OrderActionError extends Error {
  constructor(
    message: string,
    public status = 409
  ) {
    super(message);
    this.name = 'OrderActionError';
  }
}
