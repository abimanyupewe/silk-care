import { createHash, timingSafeEqual } from 'node:crypto';

type SnapItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

type SnapCustomer = {
  name: string;
  email: string;
  phone?: string | null;
};

type SnapInput = {
  orderId: string;
  amount: number;
  items: SnapItem[];
  customer: SnapCustomer;
};

export type SnapTransaction = {
  token: string;
  redirect_url: string;
};

export class MidtransNotConfiguredError extends Error {
  constructor() {
    super('Pembayaran belum dikonfigurasi.');
    this.name = 'MidtransNotConfiguredError';
  }
}

export function isMidtransConfigured() {
  return Boolean(process.env.MIDTRANS_SERVER_KEY?.trim());
}

export async function createSnapTransaction(input: SnapInput): Promise<SnapTransaction> {
  const serverKey = process.env.MIDTRANS_SERVER_KEY?.trim();

  if (!serverKey) {
    throw new MidtransNotConfiguredError();
  }

  const baseUrl =
    process.env.MIDTRANS_IS_PRODUCTION === 'true'
      ? 'https://app.midtrans.com'
      : 'https://app.sandbox.midtrans.com';

  const response = await fetch(`${baseUrl}/snap/v1/transactions`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${serverKey}:`).toString('base64')}`
    },
    body: JSON.stringify({
      transaction_details: {
        order_id: input.orderId,
        gross_amount: input.amount
      },
      item_details: input.items.map((item) => ({
        id: item.id.slice(0, 50),
        name: item.name.slice(0, 50),
        price: item.price,
        quantity: item.quantity
      })),
      customer_details: {
        first_name: input.customer.name.slice(0, 50),
        email: input.customer.email,
        phone: input.customer.phone ?? undefined
      },
      expiry: {
        unit: 'hours',
        duration: 24
      }
    })
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(
      `Midtrans gagal membuat transaksi (${response.status}): ${
        detail.slice(0, 300) || 'tanpa detail'
      }`
    );
  }

  return (await response.json()) as SnapTransaction;
}

export function verifyMidtransSignature(input: {
  orderId: string;
  statusCode: string;
  grossAmount: string;
  signatureKey: string;
}) {
  const serverKey = process.env.MIDTRANS_SERVER_KEY?.trim();

  if (!serverKey) {
    return false;
  }

  const expected = createHash('sha512')
    .update(`${input.orderId}${input.statusCode}${input.grossAmount}${serverKey}`)
    .digest('hex');
  const actual = input.signatureKey.toLowerCase();

  if (actual.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
}
