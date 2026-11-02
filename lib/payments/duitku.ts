import { createHmac, timingSafeEqual } from 'node:crypto';
import type { PaymentAttemptStatus } from '@/lib/generated/prisma';
import { getAppUrl } from '@/lib/app-url';

// Callback Duitku (POP API) tiba sebagai x-www-form-urlencoded; merchantCode, amount, dan
// merchantOrderId dipakai persis seperti dikirim untuk verifikasi signature. Tipe datanya
// string supaya string yang di-hash identik dengan string yang Duitku kirim.
export type DuitkuCallback = {
  merchantCode: string;
  amount: string;
  merchantOrderId: string;
  resultCode: string;
  reference: string;
  signature: string;
};

// Awalan merchantOrderId per alur pembayaran; alur ORD masih menunggu modul pembuatan
// invoice (lihat dev/Breakdown Fungsional Demo SILK.md).
export const DUITKU_SUB_PREFIX = 'SUB-';
export const DUITKU_ORD_PREFIX = 'ORD-';

export function isDuitkuConfigured() {
  return Boolean(process.env.DUITKU_MERCHANT_CODE?.trim() && process.env.DUITKU_API_KEY?.trim());
}

// Callback: HMAC_SHA256 hex atas `merchantCode + amount + merchantOrderId` dengan API key
// (https://docs.duitku.com/pop/id/#callback). Metode MD5 lama sudah obsolete.
export function verifyDuitkuCallbackSignature(input: DuitkuCallback) {
  const merchantCode = process.env.DUITKU_MERCHANT_CODE?.trim();
  const apiKey = process.env.DUITKU_API_KEY?.trim();

  if (!merchantCode || !apiKey || merchantCode !== input.merchantCode) {
    return false;
  }

  const expected = createHmac('sha256', apiKey)
    .update(`${input.merchantCode}${input.amount}${input.merchantOrderId}`)
    .digest('hex');
  const actual = input.signature.toLowerCase();

  if (actual.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(Buffer.from(actual, 'hex'), Buffer.from(expected, 'hex'));
}

// Tabel Respon API > Callback: 00 sukses, 02 gagal. Kode lain belum dijadwalkan Duitku pada
// callback; kembalikan null agar status tidak diubah (payload tetap disimpan di route).
export function mapDuitkuCallbackStatus(resultCode: string): PaymentAttemptStatus | null {
  if (resultCode === '00') return 'PAID';
  if (resultCode === '02') return 'FAILED';
  return null;
}

export class DuitkuNotConfiguredError extends Error {
  constructor() {
    super('Pembayaran belum dikonfigurasi.');
    this.name = 'DuitkuNotConfiguredError';
  }
}

export function duitkuBaseUrl() {
  return process.env.DUITKU_ENV?.trim() === 'production'
    ? 'https://api-prod.duitku.com'
    : 'https://api-sandbox.duitku.com';
}

// Callback wajib publik (server Duitku yang POST); saat dev isi NEXT_PUBLIC_APP_URL/AUTH_URL
// dengan URL tunnel atau preview Vercel.
export function duitkuCallbackUrl() {
  return `${getAppUrl()}/api/v1/payments/duitku/callback`;
}

// Halaman hasil bayar sampai halaman pricing jadi: menengok lonceran panel ke /dashboard.
export function duitkuReturnUrl() {
  return `${getAppUrl()}/dashboard`;
}

export type DuitkuInvoiceItem = {
  name: string;
  price: number;
  quantity: number;
};

export type DuitkuInvoiceInput = {
  merchantOrderId: string;
  amount: number;
  productDetails: string;
  email: string;
  customerName?: string | null;
  phone?: string | null;
  items?: DuitkuInvoiceItem[];
};

// CreateInvoice (https://docs.duitku.com/pop/id/#create-invoice): signature header =
// HMAC_SHA256 atas `merchantCode + timestamp`, timestamp UNIX milidetik. expiryPeriod
// dijawab 60 menit karena contoh sah di docs (5/10/60); expiresAt langganan mengikut.
export async function createDuitkuInvoice(input: DuitkuInvoiceInput): Promise<{
  reference: string;
  paymentUrl: string;
}> {
  const merchantCode = process.env.DUITKU_MERCHANT_CODE?.trim();
  const apiKey = process.env.DUITKU_API_KEY?.trim();

  if (!merchantCode || !apiKey) {
    throw new DuitkuNotConfiguredError();
  }

  const timestamp = Date.now().toString();
  const signature = createHmac('sha256', apiKey)
    .update(`${merchantCode}${timestamp}`)
    .digest('hex');

  const response = await fetch(`${duitkuBaseUrl()}/api/merchant/createInvoice`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'x-duitku-timestamp': timestamp,
      'x-duitku-signature': signature,
      'x-duitku-merchantcode': merchantCode
    },
    body: JSON.stringify({
      paymentAmount: input.amount,
      merchantOrderId: input.merchantOrderId,
      productDetails: input.productDetails.slice(0, 255),
      email: input.email,
      ...(input.customerName ? { customerVaName: input.customerName.slice(0, 20) } : {}),
      ...(input.phone ? { phoneNumber: input.phone.slice(0, 50) } : {}),
      ...(input.items?.length
        ? {
            itemDetails: input.items.map((item) => ({
              name: item.name.slice(0, 50),
              price: item.price,
              quantity: item.quantity
            }))
          }
        : {}),
      callbackUrl: duitkuCallbackUrl(),
      returnUrl: duitkuReturnUrl(),
      expiryPeriod: 60
    })
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(
      `Duitku gagal membuat invoice (${response.status}): ${detail.slice(0, 300) || 'tanpa detail'}`
    );
  }

  const data = (await response.json()) as {
    statusCode?: string;
    statusMessage?: string;
    reference?: string;
    paymentUrl?: string;
  };

  if (data.statusCode !== '00' || !data.reference || !data.paymentUrl) {
    throw new Error(
      `Duitku gagal membuat invoice: ${(data.statusMessage ?? data.statusCode) || 'tanpa pesan'}`
    );
  }

  return {
    reference: data.reference,
    paymentUrl: data.paymentUrl
  };
}
