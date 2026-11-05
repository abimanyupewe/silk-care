import { jsonError } from '@/lib/api';
import { transactionsEnabled } from '@/lib/features';

export function requireTransactions(): Response | null {
  return transactionsEnabled ? null : jsonError('Fitur ini sedang tidak tersedia.', 503);
}
