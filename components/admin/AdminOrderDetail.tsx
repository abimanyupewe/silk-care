'use client';

import Link from 'next/link';
import { useState } from 'react';
import { AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import {
  AdminOrderStatusBadge,
  AdminPaymentStatusBadge
} from '@/components/admin/AdminOrderBadges';
import { useAdminQuery } from '@/lib/admin-swr';
import { AdminDetailSkeleton } from '@/components/admin/AdminSkeleton';
import { AdminErrorState } from '@/components/admin/AdminState';
import {
  AdminApiError,
  adminOrderNextStatuses,
  adminOrderStatusLabels,
  fetchAdmin,
  type AdminOrderDetail as AdminOrderDetailData,
  type AdminOrderStatus
} from '@/lib/admin-api';
import { formatAdminCurrency, formatAdminDate, formatAdminDateTime } from '@/lib/admin-format';

const actionLabels: Record<AdminOrderStatus, string> = {
  PENDING: 'Menunggu pembayaran',
  PAID: 'Pembayaran diterima',
  PROCESSING: 'Proses pesanan',
  SHIPPED: 'Tandai dikirim',
  COMPLETED: 'Selesaikan pesanan',
  CANCELLED: 'Batalkan pesanan'
};

function DetailItem({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-ink-faint">{label}</dt>
      <dd className="mt-1 text-sm text-ink">{value || '—'}</dd>
    </div>
  );
}

function AdminOrderStatusPanel({
  order,
  onUpdated
}: {
  order: AdminOrderDetailData;
  onUpdated: (order: AdminOrderDetailData) => void;
}) {
  const [note, setNote] = useState('');
  const [pending, setPending] = useState<AdminOrderStatus | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const nextStatuses = adminOrderNextStatuses[order.status] ?? [];

  const submit = async (nextStatus: AdminOrderStatus) => {
    setPending(nextStatus);
    setError('');
    setSuccess('');

    try {
      const response = await fetchAdmin<AdminOrderDetailData>(`/admin/orders/${order.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: nextStatus,
          note: note.trim() || null
        })
      });

      setNote('');
      setSuccess(`Status pesanan diperbarui menjadi ${adminOrderStatusLabels[nextStatus]}.`);
      onUpdated(response.data);
    } catch (cause) {
      if (cause instanceof AdminApiError && cause.status === 401) {
        window.location.href = '/login?callbackUrl=/admin/orders';
        return;
      }

      setError(cause instanceof Error ? cause.message : 'Gagal memperbarui status pesanan.');
    } finally {
      setPending(null);
    }
  };

  if (nextStatuses.length === 0) {
    return (
      <section className="border border-border bg-white p-5">
        <h2 className="text-lg font-bold text-ink">Status pesanan</h2>
        <p className="mt-2 text-sm text-ink-muted">
          Pesanan ini sudah berada di status akhir dan tidak memiliki tindakan lanjutan.
        </p>
      </section>
    );
  }

  return (
    <section className="border border-border bg-white p-5">
      <h2 className="text-lg font-bold text-ink">Perbarui status</h2>
      <p className="mt-1 text-sm text-ink-muted">
        Status pesanan mengikuti alur pembayaran dan pemenuhan. Catatan akan dikirim ke pelanggan.
      </p>

      <label className="mt-4 block text-sm font-medium text-ink" htmlFor="order-status-note">
        Catatan
      </label>
      <textarea
        id="order-status-note"
        value={note}
        onChange={(event) => setNote(event.target.value)}
        maxLength={500}
        rows={3}
        placeholder="Opsional, misalnya nomor resi atau informasi pengiriman..."
        className="mt-1 w-full border border-border-strong bg-white px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-primary"
      />

      {error ? (
        <p className="mt-3 flex items-start gap-2 text-sm text-destructive" aria-live="polite">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : null}

      {success ? (
        <p className="mt-3 flex items-start gap-2 text-sm text-primary-hover" aria-live="polite">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {success}
        </p>
      ) : null}

      <div className="mt-4 flex flex-col gap-2">
        {nextStatuses.map((nextStatus) => (
          <button
            key={nextStatus}
            type="button"
            onClick={() => submit(nextStatus)}
            disabled={pending !== null}
            aria-busy={pending === nextStatus}
            className={
              nextStatus === 'CANCELLED'
                ? 'inline-flex min-h-11 items-center justify-center border border-destructive px-4 text-sm font-semibold text-destructive hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50'
                : 'inline-flex min-h-11 items-center justify-center bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50'
            }
          >
            {pending === nextStatus ? 'Memproses...' : actionLabels[nextStatus]}
          </button>
        ))}
      </div>
    </section>
  );
}

export function AdminOrderDetail({ id }: { id: string }) {
  const {
    data: order,
    loading,
    error,
    reload,
    update: setOrder
  } = useAdminQuery<AdminOrderDetailData>(`/admin/orders/${id}`, 30000);

  if (loading) return <AdminDetailSkeleton />;
  if (error) return <AdminErrorState message={error} onRetry={reload} />;
  if (!order) return null;

  return (
    <div>
      <Link
        href="/admin/orders"
        className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-ink-muted hover:text-primary-hover"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Kembali ke daftar pesanan
      </Link>

      <div className="mt-3 flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary-hover">Detail pesanan</p>
          <h1 className="mt-1 text-2xl font-bold text-ink md:text-[32px]">
            #{order.id.slice(-8).toUpperCase()}
          </h1>
          <p className="mt-2 text-ink-muted">
            {order.facility.name} · {formatAdminCurrency(order.total)}
          </p>
          <p className="mt-1 text-sm text-ink-faint">
            Dibuat {formatAdminDateTime(order.createdAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <AdminOrderStatusBadge status={order.status} />
          <AdminPaymentStatusBadge status={order.paymentStatus} />
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <section className="border border-border bg-white p-5">
            <h2 className="text-lg font-bold text-ink">Produk</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[520px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-ink-faint">
                    <th className="pb-2 pr-4 font-medium">Produk</th>
                    <th className="pb-2 pr-4 font-medium">Harga</th>
                    <th className="pb-2 pr-4 font-medium">Jumlah</th>
                    <th className="pb-2 font-medium">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-3 pr-4">
                        <p className="font-medium text-ink">{item.productName}</p>
                        <p className="text-xs text-ink-faint">{item.productSlug}</p>
                      </td>
                      <td className="py-3 pr-4 text-ink-muted">
                        {formatAdminCurrency(item.price)}
                      </td>
                      <td className="py-3 pr-4 text-ink-muted">{item.quantity}</td>
                      <td className="py-3 font-medium text-ink">
                        {formatAdminCurrency(item.price * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
              <p className="text-sm text-ink-muted">Total pesanan</p>
              <p className="text-lg font-bold text-ink">{formatAdminCurrency(order.total)}</p>
            </div>
          </section>

          <section className="border border-border bg-white p-5">
            <h2 className="text-lg font-bold text-ink">Pengiriman</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <DetailItem label="Penerima" value={order.recipientName} />
              <DetailItem label="Telepon" value={order.recipientPhone} />
              <DetailItem label="Kota" value={order.shippingCity} />
              <DetailItem label="Kode pos" value={order.shippingPostalCode} />
            </dl>
            <div className="mt-4 border-t border-border pt-4">
              <DetailItem label="Alamat" value={order.shippingAddress} />
            </div>
            <div className="mt-4 border-t border-border pt-4">
              <DetailItem label="Catatan" value={order.notes} />
            </div>
          </section>

          <section className="border border-border bg-white p-5">
            <h2 className="text-lg font-bold text-ink">Riwayat status</h2>
            {order.statusHistory.length === 0 ? (
              <p className="mt-3 text-sm text-ink-muted">Belum ada riwayat status.</p>
            ) : (
              <ul className="mt-4 space-y-4">
                {order.statusHistory.map((entry) => (
                  <li key={entry.id} className="border-l-2 border-border-strong pl-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <AdminOrderStatusBadge status={entry.status} />
                      <span className="text-xs text-ink-faint">
                        {formatAdminDateTime(entry.createdAt)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-ink">{entry.note || '—'}</p>
                    <p className="mt-1 text-xs text-ink-faint">
                      Oleh {entry.changedBy?.name || 'Sistem'}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="border border-border bg-white p-5">
            <h2 className="text-lg font-bold text-ink">Pembayaran</h2>
            {order.payments.length === 0 ? (
              <p className="mt-3 text-sm text-ink-muted">Belum ada transaksi pembayaran.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {order.payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex flex-col gap-1 border border-border p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium text-ink">{payment.status}</p>
                      <p className="text-xs text-ink-faint">
                        {formatAdminDateTime(payment.createdAt)}
                      </p>
                    </div>
                    <p className="font-semibold text-ink">{formatAdminCurrency(payment.amount)}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-4">
          <AdminOrderStatusPanel order={order} onUpdated={setOrder} />

          <section className="border border-border bg-white p-5">
            <h2 className="text-lg font-bold text-ink">Fasilitas</h2>
            <p className="mt-2 text-sm font-semibold text-ink">{order.facility.name}</p>
            <p className="text-sm text-ink-muted">
              {order.facility.city || '—'} · {order.facility.phone || '—'}
            </p>
            <Link
              href={`/admin/facilities/${order.facility.id}`}
              className="mt-3 inline-flex min-h-11 items-center border border-border-strong px-3 text-sm font-semibold text-primary-hover hover:border-primary hover:bg-primary-tint"
            >
              Tinjau fasilitas
            </Link>
          </section>

          <section className="border border-border bg-white p-5">
            <h2 className="text-lg font-bold text-ink">Waktu penting</h2>
            <dl className="mt-4 space-y-3">
              <DetailItem label="Dibuat" value={formatAdminDateTime(order.createdAt)} />
              <DetailItem label="Dibayar" value={formatAdminDateTime(order.paidAt)} />
              <DetailItem label="Kedaluwarsa" value={formatAdminDateTime(order.expiresAt)} />
              <DetailItem label="Dibatalkan" value={formatAdminDateTime(order.cancelledAt)} />
              <DetailItem label="Diperbarui" value={formatAdminDate(order.updatedAt)} />
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
}
