'use client';

import { useState } from 'react';
import { CircleAlert, CircleCheck, ExternalLink, RefreshCw } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { fetchApi, ApiError } from '@/lib/api-client';
import { useApiQuery } from '@/lib/api-swr';
import { formatLongDate, formatRupiah } from '@/lib/format';
import { cn } from '@/lib/utils';

type PendingPayment = {
  merchantOrderId: string | null;
  amount: number;
  plan: string;
  durationMonths: number;
  expiresAt: string | null;
  paymentUrl: string;
};

// Bentuk yang dijawab GET /api/v1/subscription — dipakai SubscriptionGate juga.
export type SubscriptionSnapshot = {
  plan: string;
  status: 'ACTIVE' | 'EXPIRED';
  endsAt: string;
  amount: number;
  durationMonths: number;
  pendingPayment: PendingPayment | null;
};

const statusChip = {
  ACTIVE: 'border-primary bg-primary-tint text-primary-hover',
  EXPIRED: 'border-destructive bg-destructive-tint text-destructive'
} as const;

const outlineBtn =
  'inline-flex h-11 items-center gap-2 border border-border-strong px-4 text-sm font-semibold text-ink hover:border-primary hover:bg-primary-tint disabled:opacity-60';

export function LanggananPanel({ eyebrow }: { eyebrow: string }) {
  const {
    data,
    loading,
    error: loadError,
    reload
  } = useApiQuery<SubscriptionSnapshot>('/subscription', 60000);
  const [busy, setBusy] = useState(false);
  const [buyError, setBuyError] = useState('');

  async function buatInvoice() {
    setBuyError('');
    setBusy(true);

    try {
      const invoice = await fetchApi<{ paymentUrl: string | null }>('/subscription/payment', {
        method: 'POST'
      });

      if (invoice.data.paymentUrl) {
        // URL pembayaran Duitku buka di tab yang sama; returnUrl mengembalikan ke /dashboard.
        window.location.assign(invoice.data.paymentUrl);
      } else {
        reload();
      }
    } catch (error) {
      setBuyError(
        error instanceof ApiError ? error.message : 'Gagal menyiapkan pembayaran. Coba lagi.'
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <AdminPageHeader
        eyebrow={eyebrow}
        title="Langganan"
        description={
          'Status langganan dan pembayaran perpanjangan. Perpanjangan sebelum habis menyambung dari masa aktif tersisa, bukan mulai tanggal bayar.'
        }
      />

      <div className="mt-6 max-w-2xl divide-y divide-border border border-border bg-white">
        {loading && !data ? (
          <p className="p-4 text-sm text-ink-muted">Memuat status langganan...</p>
        ) : data ? (
          <>
            <div className="p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-ink">Masa aktif</p>
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 border px-2 py-0.5 text-sm font-semibold',
                    statusChip[data.status]
                  )}
                >
                  {data.status === 'ACTIVE' ? (
                    <CircleCheck className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <CircleAlert className="h-4 w-4" aria-hidden="true" />
                  )}
                  {data.status === 'ACTIVE' ? 'Aktif' : 'Habis'}
                </span>
              </div>
              <p className="mt-2 text-lg font-bold text-ink">{formatLongDate(data.endsAt)}</p>
              <p className="mt-1 text-sm text-ink-muted">Paket: {data.plan.toLowerCase()}</p>
            </div>

            {data.pendingPayment ? (
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-ink">Invoice menunggu pembayaran</p>
                    <p className="mt-1 text-sm text-ink-muted">
                      {formatRupiah(data.pendingPayment.amount)} untuk{' '}
                      {data.pendingPayment.durationMonths} bulan.
                      {data.pendingPayment.expiresAt
                        ? ` Kedaluwarsa ${formatLongDate(data.pendingPayment.expiresAt)}.`
                        : ''}
                    </p>
                    {data.pendingPayment.merchantOrderId ? (
                      <p className="mt-1 text-sm text-ink-faint">
                        {data.pendingPayment.merchantOrderId}
                      </p>
                    ) : null}
                  </div>
                  <a
                    href={data.pendingPayment.paymentUrl}
                    className="inline-flex h-11 shrink-0 items-center gap-2 bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover"
                  >
                    Lanjutkan bayar
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  </a>
                </div>
              </div>
            ) : null}

            <div className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-ink">
                    Paket {data.durationMonths} bulan berikutnya
                  </p>
                  <p className="mt-1 text-lg font-bold text-ink">{formatRupiah(data.amount)}</p>
                </div>
                <button
                  type="button"
                  onClick={buatInvoice}
                  disabled={busy}
                  className="inline-flex h-11 items-center bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
                >
                  {busy ? 'Menyiapkan...' : 'Bayar via Duitku'}
                </button>
              </div>
              <p className="mt-2 text-sm text-ink-muted">
                Pembayaran dibuka di halaman Duitku; status langganan berubah otomatis setelah
                pembayaran diterima.
              </p>
              <button
                type="button"
                onClick={reload}
                className={cn(outlineBtn, 'mt-3')}
                disabled={busy}
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Segarkan status
              </button>
            </div>
          </>
        ) : (
          <p className="p-4 text-sm text-ink-muted">
            {loadError || 'Status langganan tidak tersedia.'}
          </p>
        )}
      </div>

      {buyError ? (
        <p role="alert" className="mt-4 text-sm font-medium text-destructive">
          {buyError}
        </p>
      ) : null}
    </div>
  );
}
