import { midtransPaymentProvider } from '@/lib/payments/midtrans';
import type { PaymentProvider } from '@/lib/payments/types';

export function getPaymentProvider(): PaymentProvider {
  return midtransPaymentProvider;
}

export { PaymentNotConfiguredError } from '@/lib/payments/types';
export type {
  CreatePaymentInput,
  CreatePaymentResult,
  PaymentProvider,
  PaymentProviderName
} from '@/lib/payments/types';
