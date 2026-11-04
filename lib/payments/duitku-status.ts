import { createHmac } from 'node:crypto';
import { logError } from '@/lib/logger';
import type { Prisma } from '@/lib/generated/prisma';

// Transaction Status (https://docs.duitku.com/pop/id/#check-transaction): cadangan kalau
// callback tidak kunjung datang. Alamat web berbeda dengan alamat API createInvoice
// (sandbox → sandbox.duitku.com, produksi → www.duitku.com).
export function duitkuWebBaseUrl() {
  return process.env.DUITKU_ENV?.trim() === 'production'
    ? 'https://www.duitku.com'
    : 'https://sandbox.duitku.com';
}

// Signature Transaction Status: HMAC_SHA256 hex atas `merchantCode + merchantOrderId`
// dengan API key. Terpisah dari pemanggilan fetch supaya bisa diuji tanpa jaringan.
export function duitkuStatusSignature(
  merchantCode: string,
  merchantOrderId: string,
  apiKey: string
) {
  return createHmac('sha256', apiKey).update(`${merchantCode}${merchantOrderId}`).digest('hex');
}

export type DuitkuStatusResult = {
  statusCode: string;
  reference: string | null;
  amount: number | null;
  raw: Record<string, Prisma.InputJsonValue>;
};

// Pemetaan statusCode Transaction Status: 00 sukses, 01 pending, 02 kedaluwarsa/dibatalkan.
// Selain itu (termasuk '') jangan mengubah status pembayaran.
export function mapDuitkuStatusStatusCode(statusCode: string): 'PAID' | 'FAILED' | null {
  if (statusCode === '00') return 'PAID';
  if (statusCode === '02') return 'FAILED';
  return null;
}

// Kegagalan jaringan/format diperlakukan "tidak tahu" (null): jalur cadangan tidak boleh
// membuat bacaan status langganan ikut gagal.
export async function checkDuitkuStatus(
  merchantOrderId: string
): Promise<DuitkuStatusResult | null> {
  const merchantCode = process.env.DUITKU_MERCHANT_CODE?.trim();
  const apiKey = process.env.DUITKU_API_KEY?.trim();

  if (!merchantCode || !apiKey) {
    return null;
  }

  const timestamp = Date.now();

  try {
    const response = await fetch(`${duitkuWebBaseUrl()}/webapi/api/merchant/transactionstatus`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        merchantCode,
        merchantOrderId,
        signature: duitkuStatusSignature(merchantCode, merchantOrderId, apiKey),
        timestamp
      })
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json().catch(() => null)) as {
      statusCode?: unknown;
      reference?: unknown;
      amount?: unknown;
    } | null;

    if (!data || typeof data !== 'object' || typeof data.statusCode !== 'string') {
      return null;
    }

    return {
      statusCode: data.statusCode,
      reference: typeof data.reference === 'string' ? data.reference : null,
      amount: typeof data.amount === 'number' ? data.amount : null,
      raw: data as Record<string, Prisma.InputJsonValue>
    };
  } catch (error) {
    logError('duitku_status_check_failed', error, { merchantOrderId });
    return null;
  }
}
