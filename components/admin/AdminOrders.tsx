'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  AdminOrderStatusBadge,
  AdminPaymentStatusBadge
} from '@/components/admin/AdminOrderBadges';
import { useAdminQuery } from '@/lib/admin-swr';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { AdminTableSkeleton } from '@/components/admin/AdminSkeleton';
import { AdminEmptyState, AdminErrorState } from '@/components/admin/AdminState';
import {
  adminOrderStatusLabels,
  adminPaymentStatusLabels,
  type AdminOrder,
  type AdminOrderStatus,
  type AdminPaymentStatus
} from '@/lib/admin-api';
import { formatAdminCurrency, formatAdminDate } from '@/lib/admin-format';

export type AdminOrderFilters = {
  status: string;
  paymentStatus: string;
  page: number;
};

function shortId(value: string) {
  return value.slice(-8).toUpperCase();
}

export function AdminOrders({ filters }: { filters: AdminOrderFilters }) {
  const router = useRouter();
  const { status, paymentStatus, page } = filters;
  const [orderStatus, setOrderStatus] = useState(status);
  const [payment, setPayment] = useState(paymentStatus);

  useEffect(() => {
    setOrderStatus(status);
    setPayment(paymentStatus);
  }, [status, paymentStatus]);

  const params = new URLSearchParams();

  if (status) params.set('status', status);
  if (paymentStatus) params.set('paymentStatus', paymentStatus);
  params.set('page', String(page));

  const {
    data: orders = [],
    meta,
    loading,
    error,
    reload
  } = useAdminQuery<AdminOrder[]>(`/admin/orders?${params.toString()}`);

  const applyFilters = (next: { status?: string; paymentStatus?: string; page?: number }) => {
    const nextStatus = next.status ?? orderStatus;
    const nextPayment = next.paymentStatus ?? payment;
    const nextPage = next.page ?? 1;
    const params = new URLSearchParams();

    if (nextStatus) params.set('status', nextStatus);
    if (nextPayment) params.set('paymentStatus', nextPayment);
    if (nextPage > 1) params.set('page', String(nextPage));

    const query = params.toString();
    router.push(query ? `/admin/orders?${query}` : '/admin/orders');
  };

  const resetFilters = () => {
    setOrderStatus('');
    setPayment('');
    router.push('/admin/orders');
  };

  return (
    <div>
      <AdminPageHeader
        eyebrow="Transaksi"
        title="Pesanan"
        description="Pantau pesanan masuk dan perbarui status pemenuhan pesanan."
      />

      <form
        onSubmit={(event) => {
          event.preventDefault();
          applyFilters({ page: 1 });
        }}
        className="mt-6 flex flex-col gap-3 border border-border bg-white p-4 md:flex-row md:items-end"
      >
        <label className="text-sm font-medium text-ink md:w-52">
          Status pesanan
          <select
            value={orderStatus}
            onChange={(event) => {
              setOrderStatus(event.target.value);
              applyFilters({ status: event.target.value, page: 1 });
            }}
            className="mt-1 h-11 w-full border border-border-strong bg-white px-3 text-sm text-ink outline-none focus:border-primary"
          >
            <option value="">Semua status</option>
            {(Object.keys(adminOrderStatusLabels) as AdminOrderStatus[]).map((value) => (
              <option key={value} value={value}>
                {adminOrderStatusLabels[value]}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-ink md:w-52">
          Pembayaran
          <select
            value={payment}
            onChange={(event) => {
              setPayment(event.target.value);
              applyFilters({ paymentStatus: event.target.value, page: 1 });
            }}
            className="mt-1 h-11 w-full border border-border-strong bg-white px-3 text-sm text-ink outline-none focus:border-primary"
          >
            <option value="">Semua pembayaran</option>
            {(Object.keys(adminPaymentStatusLabels) as AdminPaymentStatus[]).map((value) => (
              <option key={value} value={value}>
                {adminPaymentStatusLabels[value]}
              </option>
            ))}
          </select>
        </label>

        <div className="flex gap-2">
          <button
            type="submit"
            className="inline-flex h-11 items-center bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover"
          >
            Terapkan
          </button>
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex h-11 items-center border border-border-strong px-4 text-sm font-semibold text-ink hover:border-primary hover:bg-primary-tint"
          >
            Reset
          </button>
        </div>
      </form>

      <p className="mt-4 text-sm text-ink-muted">
        {meta
          ? `${meta.total.toLocaleString('id-ID')} pesanan ditemukan`
          : 'Memuat data pesanan...'}
      </p>

      <div className="mt-3">
        {loading ? (
          <AdminTableSkeleton rows={7} columns={8} />
        ) : error ? (
          <AdminErrorState message={error} onRetry={reload} />
        ) : orders.length === 0 ? (
          <AdminEmptyState
            title="Tidak ada pesanan"
            description="Coba ubah filter status pesanan atau pembayaran."
          />
        ) : (
          <div className="overflow-x-auto border border-border bg-white">
            <table className="w-full min-w-[1080px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-surface text-xs text-ink-faint">
                  <th className="px-4 py-3 font-medium">Pesanan</th>
                  <th className="px-4 py-3 font-medium">Fasilitas</th>
                  <th className="px-4 py-3 font-medium">Penerima</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Pembayaran</th>
                  <th className="px-4 py-3 font-medium">Dibuat</th>
                  <th className="px-4 py-3 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-surface">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-ink">#{shortId(order.id)}</p>
                      <p className="text-xs text-ink-faint">{order.items.length} jenis produk</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-ink">{order.facility.name}</p>
                      <p className="text-xs text-ink-faint">{order.facility.city || '—'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-ink">{order.recipientName}</p>
                      <p className="text-xs text-ink-faint">
                        {order.recipientPhone} · {order.shippingCity}
                      </p>
                    </td>
                    <td className="px-4 py-3 font-semibold text-ink">
                      {formatAdminCurrency(order.total)}
                    </td>
                    <td className="px-4 py-3">
                      <AdminOrderStatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3">
                      <AdminPaymentStatusBadge status={order.paymentStatus} />
                    </td>
                    <td className="px-4 py-3 text-ink-muted">{formatAdminDate(order.createdAt)}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="inline-flex min-h-11 items-center border border-border-strong px-3 text-sm font-semibold text-primary-hover hover:border-primary hover:bg-primary-tint"
                      >
                        Kelola
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && !error && meta ? (
        <div className="mt-4">
          <AdminPagination
            basePath="/admin/orders"
            page={meta.page}
            totalPages={meta.totalPages}
            total={meta.total}
            limit={meta.limit}
            query={{ status, paymentStatus }}
          />
        </div>
      ) : null}
    </div>
  );
}
