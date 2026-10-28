'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import {
  AdminOrderStatusBadge,
  AdminPaymentStatusBadge
} from '@/components/admin/AdminOrderBadges';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminDashboardSkeleton } from '@/components/admin/AdminSkeleton';
import { AdminEmptyState, AdminErrorState } from '@/components/admin/AdminState';
import { useAdminStats } from '@/components/admin/AdminStatsProvider';
import { formatAdminCurrency, formatAdminDateTime } from '@/lib/admin-format';

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
      {detail ? <p className="mt-1 text-sm text-ink-faint">{detail}</p> : null}
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
  const { stats, loading, error, reload } = useAdminStats();

  const moderationQueue = stats
    ? [
        {
          label: 'Dokter',
          count: stats.moderation.pendingDoctors,
          href: '/admin/doctors?verificationStatus=PENDING'
        },
        {
          label: 'Fasilitas',
          count: stats.moderation.pendingFacilities,
          href: '/admin/facilities?verificationStatus=PENDING'
        },
        {
          label: 'Ulasan',
          count: stats.moderation.pendingReviews,
          href: '/admin/reviews?status=PENDING'
        },
        {
          label: 'Artikel',
          count: stats.moderation.pendingArticles,
          href: '/admin/articles?status=PENDING'
        }
      ]
    : [];

  return (
    <div>
      <AdminPageHeader
        eyebrow="Dashboard"
        title="Ringkasan operasional"
        description="Pantau antrean moderasi, pengguna, dan pesanan terbaru dari satu halaman."
        action={
          <button
            type="button"
            onClick={reload}
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
        <div className="mt-6">
          <AdminErrorState message={error} onRetry={reload} />
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
              value={stats.moderation.pendingArticles.toLocaleString('id-ID')}
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
              value={formatAdminCurrency(stats.orders.revenue)}
              detail="Pesanan dibayar dan tidak dibatalkan"
              href="/admin/orders?paymentStatus=PAID"
            />
            <StatCard
              label="Antrean moderasi"
              value={stats.moderation.totalPending.toLocaleString('id-ID')}
              detail="Dokter, fasilitas, ulasan, dan artikel"
            />
          </section>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
            <section className="border border-border bg-white p-4">
              <h2 className="text-lg font-bold text-ink">Antrean moderasi</h2>
              <p className="mt-1 text-sm text-ink-muted">Item yang menunggu tindakan admin.</p>

              <div className="mt-4 divide-y divide-border border-y border-border">
                {moderationQueue.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex min-h-11 items-center justify-between gap-4 py-3 hover:text-primary-hover"
                  >
                    <span className="text-sm text-ink-muted">{item.label}</span>
                    <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                      {item.count.toLocaleString('id-ID')}
                      <ChevronRight className="h-4 w-4 text-ink-faint" aria-hidden="true" />
                    </span>
                  </Link>
                ))}
              </div>
            </section>

            <section className="border border-border bg-white p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-ink">Pesanan terbaru</h2>
                  <p className="mt-1 text-sm text-ink-muted">Lima pesanan terakhir yang masuk.</p>
                </div>
                <Link
                  href="/admin/orders"
                  className="inline-flex min-h-11 shrink-0 items-center gap-1 text-sm font-semibold text-primary-hover hover:underline"
                >
                  Lihat semua
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>

              {stats.recentOrders.length === 0 ? (
                <div className="mt-4">
                  <AdminEmptyState title="Belum ada pesanan" />
                </div>
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-border text-sm text-ink-faint">
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
                          <td className="py-3 pr-3">
                            <Link
                              href={`/admin/orders/${order.id}`}
                              aria-label={`Lihat pesanan ${shortId(order.id)}`}
                              className="inline-flex min-h-11 items-center font-mono text-sm text-primary-hover hover:underline"
                            >
                              {shortId(order.id)}
                            </Link>
                          </td>
                          <td className="py-3 pr-3">
                            <p className="font-medium text-ink">{order.user.name}</p>
                            <p className="text-sm text-ink-faint">{order.user.email}</p>
                          </td>
                          <td className="py-3 pr-3 text-ink-muted">{order.facility.name}</td>
                          <td className="py-3 pr-3 text-ink">{formatAdminCurrency(order.total)}</td>
                          <td className="py-3 pr-3">
                            <div className="flex flex-col items-start gap-1">
                              <AdminOrderStatusBadge status={order.status} />
                              <AdminPaymentStatusBadge status={order.paymentStatus} />
                            </div>
                          </td>
                          <td className="py-3 text-ink-muted">
                            {formatAdminDateTime(order.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>

          <p className="mt-4 text-sm text-ink-faint">
            Diperbarui {formatAdminDateTime(stats.generatedAt)}
          </p>
        </>
      ) : null}
    </div>
  );
}
