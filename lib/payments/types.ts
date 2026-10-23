import type { PaymentAttemptStatus } from '@/lib/generated/prisma';

export type PaymentProviderName = 'midtrans';

export type PaymentItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

export type PaymentCustomer = {
  name: string;
  email: string;
  phone?: string | null;
};

export type CreatePaymentInput = {
  orderId: string;
  amount: number;
  items: PaymentItem[];
  customer: PaymentCustomer;
};

export type CreatePaymentResult = {
  token: string;
  redirectUrl: string;
};

export type PaymentWebhookInput = {
  orderId: string;
  statusCode: string;
  grossAmount: string;
  signatureKey: string;
  transactionStatus: string;
  fraudStatus?: string;
};

export type PaymentProvider = {
  name: PaymentProviderName;
  isConfigured(): boolean;
  createTransaction(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  verifyWebhook(input: PaymentWebhookInput): boolean;
  mapStatus(transactionStatus: string, fraudStatus?: string): PaymentAttemptStatus;
};

export class PaymentNotConfiguredError extends Error {
  constructor(message = 'Pembayaran belum dikonfigurasi.') {
    super(message);
    this.name = 'PaymentNotConfiguredError';
  }
}
