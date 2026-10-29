'use client';

import { useState } from 'react';
import { CheckCircle2, Clock3, PackageCheck, Truck, XCircle } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminTableSkeleton } from '@/components/admin/AdminSkeleton';
import { AdminEmptyState, AdminErrorState } from '@/components/admin/AdminState';
import { fetchApi } from '@/lib/api-client';
import { useApiQuery } from '@/lib/api-swr';
import {
  adminOrderNextStatuses as nextStatuses,
  adminOrderStatusLabels as statusLabels,
  adminPaymentStatusLabels as paymentLabels,
  type AdminOrder as Order,
  type AdminOrderStatus as Status
} from '@/lib/admin-api';
import { formatAdminCurrency, formatAdminDateTime } from '@/lib/admin-format';
import { cn } from '@/lib/utils';

const statusTone: Record<Status, string> = {
  PENDING: 'border-amber bg-amber-tint text-amber-ink',
  PAID: 'border-primary bg-primary-tint text-primary-hover',
  PROCESSING: 'border-primary bg-primary-tint text-primary-hover',
  SHIPPED: 'border-primary bg-primary-tint text-primary-hover',
  COMPLETED: 'border-primary bg-primary-tint text-primary-hover',
  CANCELLED: 'border-destructive bg-white text-destructive'
};

const statusIcon: Record<Status, typeof Clock3> = {
  PENDING: Clock3,
  PAID: CheckCircle2,
  PROCESSING: PackageCheck,
  SHIPPED: Truck,
  COMPLETED: CheckCircle2,
  CANCELLED: XCircle
};

const actionLabels: Partial<Record<Status, string>> = {
  PROCESSING: 'Proses pesanan',
  SHIPPED: 'Tandai dikirim',
  COMPLETED: 'Tandai selesai'
};

const outlineBtn =
  'inline-flex h-11 items-center border border-border-strong px-4 text-sm font-semibold text-ink hover:border-primary hover:bg-primary-tint disabled:opacity-60';
const primaryBtn =
  'inline-flex h-11 items-center bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60';

function OrderCard({ order, onChanged }: { order: Order; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const Icon = statusIcon[order.status];

  async function changeStatus(status: Status) {
    setBusy(true);
    setError('');
    try {
      await fetchApi(`/facility/orders/${order.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengubah status.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="border border-border bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-ink">{order.recipientName}</p>
          <p className="text-sm text-ink-muted">
            {order.recipientPhone} · {order.shippingCity} · {formatAdminDateTime(order.createdAt)}
          </p>
        </div>
        <span
          className={cn(
            'inline-flex min-h-7 items-center gap-1.5 border px-2 text-sm font-medium',
            statusTone[order.status]
          )}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
          {statusLabels[order.status]}
        </span>
      </div>

      <ul className="mt-3 divide-y divide-border border-y border-border">
        {order.items.map((item) => (
          <li key={item.id} className="flex justify-between gap-3 py-2 text-base text-ink">
            <span>
              {item.productName} × {item.quantity}
            </span>
            <span>{formatAdminCurrency(item.price * item.quantity)}</span>
          </li>
        ))}
      </ul>

      <p className="mt-3 text-sm text-ink-muted">
        Pembayaran: {paymentLabels[order.paymentStatus]} · Total{' '}
        <span className="font-semibold text-ink">{formatAdminCurrency(order.total)}</span>
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {nextStatuses[order.status].map((next) =>
          next === 'CANCELLED' ? (
            <button
              key={next}
              type="button"
              disabled={busy}
              onClick={() => window.confirm('Batalkan pesanan ini?') && changeStatus(next)}
              className={outlineBtn}
            >
              Batalkan
            </button>
          ) : (
            <button
              key={next}
              type="button"
              disabled={busy}
              onClick={() => changeStatus(next)}
              className={primaryBtn}
            >
              {actionLabels[next]}
            </button>
          )
        )}
      </div>

      {error ? (
        <p role="alert" className="mt-3 text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </li>
  );
}

export function FacilityOrders() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const params = new URLSearchParams({ page: String(page) });

  if (status) params.set('status', status);

  const {
    data = [],
    meta,
    loading,
    error,
    reload
  } = useApiQuery<Order[]>(`/facility/orders?${params.toString()}`, 30000);

  return (
    <div>
      <AdminPageHeader
        eyebrow="Panel fasilitas"
        title="Pesanan"
        description="Proses pesanan yang sudah dibayar sampai selesai dikirim."
      />

      <label className="mt-6 block text-sm font-medium text-ink sm:w-64">
        Status
        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
          className="mt-1 h-11 w-full border border-border-strong bg-white px-3 text-sm text-ink outline-none focus:border-primary"
        >
          <option value="">Semua status</option>
          {(Object.keys(statusLabels) as Status[]).map((value) => (
            <option key={value} value={value}>
              {statusLabels[value]}
            </option>
          ))}
        </select>
      </label>

      <div className="mt-4">
        {loading && data.length === 0 ? (
          <AdminTableSkeleton rows={4} columns={3} />
        ) : error ? (
          <AdminErrorState message={error} onRetry={reload} />
        ) : data.length === 0 ? (
          <AdminEmptyState
            title="Belum ada pesanan"
            description="Pesanan dari pelanggan akan muncul di sini."
          />
        ) : (
          <ul className="space-y-3">
            {data.map((order) => (
              <OrderCard key={order.id} order={order} onChanged={reload} />
            ))}
          </ul>
        )}
      </div>

      {meta && meta.totalPages > 1 ? (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className={outlineBtn}
          >
            Sebelumnya
          </button>
          <span className="text-sm text-ink-muted">
            Halaman {meta.page} dari {meta.totalPages}
          </span>
          <button
            type="button"
            disabled={page >= meta.totalPages}
            onClick={() => setPage(page + 1)}
            className={outlineBtn}
          >
            Berikutnya
          </button>
        </div>
      ) : null}
    </div>
  );
}
