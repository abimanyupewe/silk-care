'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AlertCircle, ChevronRight } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminDashboardSkeleton } from '@/components/admin/AdminSkeleton';
import { AdminApiError, fetchAdmin, type AdminStats } from '@/lib/admin-api';

const orderStatusLabels: Record<string, string> = {
  PENDING: 'Menunggu',
  PAID: 'Dibayar',
  PROCESSING: 'Diproses',
  SHIPPED: 'Dikirim',
  COMPLETED: 'Selesai',
  CANCELLED: 'Dibatalkan'
};

const paymentStatusLabels: Record<string, string> = {
  UNPAID: 'Belum dibayar',
  PAID: 'Dibayar',
  FAILED: 'Gagal',
  EXPIRED: 'Kedaluwarsa',
  REFUNDED: 'Dikembalikan'
};

const currencyFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0
});

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
}

function shortId(value: string) {
  return value.slice(0, 8).toUpperCase();
}

function StatCard({
  label,
  value,
  detail,
  href
}: {
  label: string;
  value: string;
  detail?: string;
  href?: string;
}) {
  const content = (
    <>
      <p className="flex items-center justify-between gap-2 text-sm font-medium text-ink-muted">
        {label}
        {href ? <ChevronRight className="h-4 w-4 shrink-0" aria-hidden="true" /> : null}
      </p>
      <p className="mt-2 text-2xl font-bold text-ink">{value}</p>
      {detail ? <p className="mt-1 text-xs text-ink-faint">{detail}</p> : null}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="border border-border bg-white p-4 hover:border-primary hover:bg-primary-tint"
      >
        {content}
      </Link>
    );
  }

  return <div className="border border-border bg-white p-4">{content}</div>;
}

export function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    setLoading(true);
    setError('');

    fetchAdmin<AdminStats>('/admin/stats', { signal: controller.signal })
      .then((response) => {
        setStats(response.data);
      })
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === 'AbortError') {
          return;
        }

        if (cause instanceof AdminApiError && cause.status === 401) {
          window.location.href = '/login?callbackUrl=/admin';
          return;
        }

        setError(cause instanceof Error ? cause.message : 'Gagal memuat ringkasan admin.');
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [attempt]);

  return (
    <div>
      <AdminPageHeader
        eyebrow="Dashboard"
        title="Ringkasan operasional"
        description="Pantau antrean moderasi, pengguna, dan pesanan terbaru dari satu halaman."
        action={
          <button
            type="button"
            onClick={() => setAttempt((value) => value + 1)}
            disabled={loading}
            aria-busy={loading}
            className="inline-flex min-h-11 items-center rounded-md border border-border-strong px-3 text-sm font-semibold text-ink hover:border-primary hover:bg-primary-tint disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Memuat...' : 'Muat ulang'}
          </button>
        }
      />

      {loading && !stats ? <AdminDashboardSkeleton /> : null}

      {error ? (
        <div className="mt-6 border border-destructive bg-white p-4" aria-live="polite">
          <p className="flex items-start gap-2 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {error}
          </p>
          <button
            type="button"
            onClick={() => setAttempt((value) => value + 1)}
            className="mt-3 inline-flex min-h-11 items-center rounded-md border border-border-strong px-3 text-sm font-semibold text-ink hover:border-primary hover:bg-primary-tint"
          >
            Coba lagi
          </button>
        </div>
      ) : null}

      {stats ? (
        <>
          <section
            className="mt-6 grid grid-cols-2 gap-3 xl:grid-cols-4"
            aria-label="Statistik utama"
          >
            <StatCard
              label="Pengguna aktif"
              value={stats.users.active.toLocaleString('id-ID')}
              detail={`${stats.users.total.toLocaleString('id-ID')} total pengguna`}
              href="/admin/users?status=active"
            />
            <StatCard
              label="Dokter menunggu"
              value={stats.moderation.pendingDoctors.toLocaleString('id-ID')}
              detail={`${stats.partners.doctors.total.toLocaleString('id-ID')} total dokter`}
              href="/admin/doctors?verificationStatus=PENDING"
            />
            <StatCard
              label="Fasilitas menunggu"
              value={stats.moderation.pendingFacilities.toLocaleString('id-ID')}
              detail={`${stats.partners.facilities.total.toLocaleString('id-ID')} total fasilitas`}
              href="/admin/facilities?verificationStatus=PENDING"
            />
            <StatCard
              label="Ulasan menunggu"
              value={stats.moderation.pendingReviews.toLocaleString('id-ID')}
              detail={`${stats.reviews.total.toLocaleString('id-ID')} total ulasan`}
              href="/admin/reviews?status=PENDING"
            />
            <StatCard
              label="Artikel menunggu"
              value={stats.catalog.articles.pending.toLocaleString('id-ID')}
              detail={`${stats.catalog.articles.total.toLocaleString('id-ID')} total artikel`}
              href="/admin/articles?status=PENDING"
            />
            <StatCard
              label="Total pesanan"
              value={stats.orders.total.toLocaleString('id-ID')}
              detail={`${(stats.orders.byPaymentStatus.PAID ?? 0).toLocaleString('id-ID')} sudah dibayar`}
              href="/admin/orders"
            />
            <StatCard
              label="Pendapatan tercatat"
              value={formatCurrency(stats.orders.revenue)}
              detail="Pesanan dibayar dan tidak dibatalkan"
              href="/admin/orders?paymentStatus=PAID"
            />
            <StatCard
              label="Antrean moderasi"
              value={stats.moderation.totalPending.toLocaleString('id-ID')}
              detail="Dokter, fasilitas, dan ulasan"
            />
          </section>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
            <section className="border border-border bg-white p-4">
              <h2 className="text-lg font-bold text-ink">Antrean moderasi</h2>
              <p className="mt-1 text-sm text-ink-muted">Item yang menunggu tindakan admin.</p>

              <div className="mt-4 divide-y divide-border border-y border-border">
                <Link
                  href="/admin/doctors?verificationStatus=PENDING"
                  className="flex items-center justify-between gap-4 py-3 hover:text-primary-hover"
                >
                  <span className="text-sm text-ink-muted">Dokter</span>
                  <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                    {stats.moderation.pendingDoctors.toLocaleString('id-ID')}
                    <ChevronRight className="h-4 w-4 text-ink-faint" aria-hidden="true" />
                  </span>
                </Link>
                <Link
                  href="/admin/facilities?verificationStatus=PENDING"
                  className="flex items-center justify-between gap-4 py-3 hover:text-primary-hover"
                >
                  <span className="text-sm text-ink-muted">Fasilitas</span>
                  <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                    {stats.moderation.pendingFacilities.toLocaleString('id-ID')}
                    <ChevronRight className="h-4 w-4 text-ink-faint" aria-hidden="true" />
                  </span>
                </Link>
                <Link
                  href="/admin/reviews?status=PENDING"
                  className="flex items-center justify-between gap-4 py-3 hover:text-primary-hover"
                >
                  <span className="text-sm text-ink-muted">Ulasan</span>
                  <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                    {stats.moderation.pendingReviews.toLocaleString('id-ID')}
                    <ChevronRight className="h-4 w-4 text-ink-faint" aria-hidden="true" />
                  </span>
                </Link>
                <Link
                  href="/admin/articles?status=PENDING"
                  className="flex items-center justify-between gap-4 py-3 hover:text-primary-hover"
                >
                  <span className="text-sm text-ink-muted">Artikel</span>
                  <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                    {stats.catalog.articles.pending.toLocaleString('id-ID')}
                    <ChevronRight className="h-4 w-4 text-ink-faint" aria-hidden="true" />
                  </span>
                </Link>
              </div>
            </section>

            <section className="border border-border bg-white p-4">
              <div>
                <h2 className="text-lg font-bold text-ink">Pesanan terbaru</h2>
                <p className="mt-1 text-sm text-ink-muted">Lima pesanan terakhir yang masuk.</p>
              </div>

              {stats.recentOrders.length === 0 ? (
                <p className="mt-4 text-sm text-ink-muted">Belum ada pesanan.</p>
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-border text-xs text-ink-faint">
                        <th className="pb-2 pr-3 font-medium">ID</th>
                        <th className="pb-2 pr-3 font-medium">Pembeli</th>
                        <th className="pb-2 pr-3 font-medium">Fasilitas</th>
                        <th className="pb-2 pr-3 font-medium">Total</th>
                        <th className="pb-2 pr-3 font-medium">Status</th>
                        <th className="pb-2 font-medium">Tanggal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {stats.recentOrders.map((order) => (
                        <tr key={order.id}>
                          <td className="py-3 pr-3 font-mono text-xs text-ink-muted">
                            {shortId(order.id)}
                          </td>
                          <td className="py-3 pr-3">
                            <p className="font-medium text-ink">{order.user.name}</p>
                            <p className="text-xs text-ink-faint">{order.user.email}</p>
                          </td>
                          <td className="py-3 pr-3 text-ink-muted">{order.facility.name}</td>
                          <td className="py-3 pr-3 text-ink">{formatCurrency(order.total)}</td>
                          <td className="py-3 pr-3">
                            <span className="inline-flex items-center rounded-md border border-border bg-surface px-2 py-1 text-xs font-medium text-ink">
                              {orderStatusLabels[order.status] ?? order.status}
                            </span>
                            <span className="mt-1 block text-xs text-ink-faint">
                              {paymentStatusLabels[order.paymentStatus] ?? order.paymentStatus}
                            </span>
                          </td>
                          <td className="py-3 text-ink-muted">{formatDate(order.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>

          <p className="mt-4 text-xs text-ink-faint">Diperbarui {formatDate(stats.generatedAt)}</p>
        </>
      ) : null}
    </div>
  );
}
