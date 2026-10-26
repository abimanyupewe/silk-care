import type { PaymentAttemptStatus } from '@/lib/generated/prisma';
import {
  createSnapTransaction,
  isMidtransConfigured,
  MidtransNotConfiguredError,
  verifyMidtransSignature
} from '@/lib/midtrans';
import {
  PaymentNotConfiguredError,
  type CreatePaymentInput,
  type CreatePaymentResult,
  type PaymentProvider
} from '@/lib/payments/types';

function mapStatus(transactionStatus: string, fraudStatus?: string): PaymentAttemptStatus {
  if (transactionStatus === 'capture') {
    return fraudStatus === 'accept' ? 'PAID' : 'PENDING';
  }

  if (transactionStatus === 'settlement') {
    return 'PAID';
  }

  if (transactionStatus === 'pending') {
    return 'PENDING';
  }

  if (transactionStatus === 'deny' || transactionStatus === 'cancel') {
    return 'FAILED';
  }

  if (transactionStatus === 'expire') {
    return 'EXPIRED';
  }

  if (transactionStatus === 'refund' || transactionStatus === 'partial_refund') {
    return 'REFUNDED';
  }

  return 'PENDING';
}

export const midtransPaymentProvider: PaymentProvider = {
  name: 'midtrans',
  isConfigured: isMidtransConfigured,
  async createTransaction(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    try {
      const transaction = await createSnapTransaction({
        orderId: input.orderId,
        amount: input.amount,
        items: input.items,
        customer: input.customer
      });

      return {
        token: transaction.token,
        redirectUrl: transaction.redirect_url
      };
    } catch (error) {
      if (error instanceof MidtransNotConfiguredError) {
        throw new PaymentNotConfiguredError('Pembayaran belum dikonfigurasi.');
      }

      throw error;
    }
  },
  verifyWebhook(input) {
    return verifyMidtransSignature({
      orderId: input.orderId,
      statusCode: input.statusCode,
      grossAmount: input.grossAmount,
      signatureKey: input.signatureKey
    });
  },
  mapStatus
};
