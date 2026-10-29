'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  LineChart as LineChartIcon
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import {
  AdminOrderStatusBadge,
  AdminPaymentStatusBadge
} from '@/components/admin/AdminOrderBadges';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminDashboardSkeleton } from '@/components/admin/AdminSkeleton';
import { AdminEmptyState, AdminErrorState } from '@/components/admin/AdminState';
import { useAdminStats } from '@/components/admin/AdminStatsProvider';
import { cn } from '@/lib/utils';
import { formatAdminCurrency, formatAdminDateTime } from '@/lib/admin-format';
import {
  adminOrderStatusLabels,
  adminUserRoleLabels,
  type AdminOrderStatus,
  type AdminStats,
  type AdminUserRole
} from '@/lib/admin-api';

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

const chartTick = { fontSize: 14, fill: 'var(--color-ink-muted)' };
const chartTooltip = {
  contentStyle: { borderRadius: 0, border: '1px solid var(--color-border)', fontSize: 14 },
  cursor: { fill: 'var(--color-primary-tint)' }
};

type ChartType = 'bar' | 'line';

const chartTypes: Array<{ value: ChartType; label: string; icon: typeof BarChart3 }> = [
  { value: 'bar', label: 'Grafik batang', icon: BarChart3 },
  { value: 'line', label: 'Grafik garis', icon: LineChartIcon }
];

function ChartCard({
  title,
  description,
  className,
  children
}: {
  title: string;
  description: string;
  className?: string;
  children: (type: ChartType) => React.ReactNode;
}) {
  const [type, setType] = useState<ChartType>('bar');

  return (
    <section className={cn('border border-border bg-white p-4', className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-ink">{title}</h2>
          <p className="mt-1 text-sm text-ink-muted">{description}</p>
        </div>
        <div className="flex shrink-0" role="group" aria-label={`Tipe grafik ${title}`}>
          {chartTypes.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setType(value)}
              aria-pressed={type === value}
              aria-label={label}
              title={label}
              className={cn(
                'inline-flex h-11 w-11 items-center justify-center border border-border-strong -ml-px first:ml-0',
                type === value
                  ? 'border-primary bg-primary-tint text-primary-hover'
                  : 'text-ink hover:bg-surface'
              )}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4 h-64">{children(type)}</div>
    </section>
  );
}

function CategoryChart({
  title,
  description,
  rows
}: {
  title: string;
  description: string;
  rows: Array<{ label: string; value: number }>;
}) {
  const tooltip = (
    <Tooltip
      {...chartTooltip}
      formatter={(value) => [Number(value).toLocaleString('id-ID'), 'Jumlah']}
    />
  );

  return (
    <ChartCard title={title} description={description}>
      {(type) => (
        <ResponsiveContainer width="100%" height="100%">
          {type === 'bar' ? (
            <BarChart data={rows} layout="vertical" margin={{ left: 8, right: 16 }}>
              <CartesianGrid horizontal={false} stroke="var(--color-border)" />
              <XAxis type="number" allowDecimals={false} tick={chartTick} />
              <YAxis type="category" dataKey="label" width={88} tick={chartTick} />
              {tooltip}
              <Bar dataKey="value" fill="var(--color-primary)" maxBarSize={20} />
            </BarChart>
          ) : (
            <LineChart data={rows} margin={{ left: 0, right: 16, top: 8 }}>
              <CartesianGrid vertical={false} stroke="var(--color-border)" />
              <XAxis dataKey="label" tick={chartTick} interval={0} />
              <YAxis allowDecimals={false} width={32} tick={chartTick} />
              {tooltip}
              <Line
                dataKey="value"
                stroke="var(--color-primary)"
                strokeWidth={2}
                dot={{ r: 4, fill: 'var(--color-primary)' }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

function TrendChart({ daily }: { daily: AdminStats['daily'] }) {
  const totalOrders = daily.reduce((sum, day) => sum + day.orders, 0);
  const totalRevenue = daily.reduce((sum, day) => sum + day.revenue, 0);
  const common = (
    <>
      <CartesianGrid vertical={false} stroke="var(--color-border)" />
      <XAxis dataKey="date" tickFormatter={(value: string) => value.slice(5)} tick={chartTick} />
      <YAxis allowDecimals={false} width={32} tick={chartTick} />
      <Tooltip
        {...chartTooltip}
        formatter={(value, name, item) =>
          name === 'orders'
            ? [`${value} (${formatAdminCurrency(item.payload.revenue)})`, 'Pesanan']
            : [value, name]
        }
      />
    </>
  );

  return (
    <ChartCard
      className="mt-6"
      title={`Pesanan ${daily.length} hari terakhir`}
      description={`${totalOrders.toLocaleString('id-ID')} pesanan, pendapatan ${formatAdminCurrency(totalRevenue)}.`}
    >
      {(type) => (
        <ResponsiveContainer width="100%" height="100%">
          {type === 'bar' ? (
            <BarChart data={daily} margin={{ left: 0, right: 8 }}>
              {common}
              <Bar dataKey="orders" fill="var(--color-primary)" />
            </BarChart>
          ) : (
            <LineChart data={daily} margin={{ left: 0, right: 8, top: 8 }}>
              {common}
              <Line
                dataKey="orders"
                stroke="var(--color-primary)"
                strokeWidth={2}
                dot={{ r: 3, fill: 'var(--color-primary)' }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
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

  const attention = stats
    ? [
        {
          label: 'Pembayaran perlu refund (pesanan dibatalkan)',
          count: stats.attention.refundNeeded,
          href: '/admin/orders?status=CANCELLED&paymentStatus=PAID'
        },
        {
          label: 'Pesanan dibayar belum diproses lebih dari 24 jam',
          count: stats.attention.stuckPaidOrders,
          href: '/admin/orders?status=PAID'
        },
        {
          label: 'Ulasan negatif menunggu moderasi',
          count: stats.attention.negativePendingReviews,
          href: '/admin/reviews?status=PENDING&isNegative=true'
        },
        {
          label: 'Konsultasi belum dikonfirmasi dokter lebih dari 24 jam',
          count: stats.attention.staleConsultations
        }
      ]
    : [];

  return (
    <div>
      <AdminPageHeader
        eyebrow="Dashboard"
        title="Ringkasan operasional"
        description="Pantau antrean moderasi, pengguna, dan pesanan terbaru dari satu halaman."
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
              label="Konsultasi"
              value={stats.consultations.total.toLocaleString('id-ID')}
              detail={`${stats.consultations.REQUESTED.toLocaleString('id-ID')} menunggu konfirmasi, ${stats.consultations.CONFIRMED.toLocaleString('id-ID')} terkonfirmasi`}
            />
          </section>

          <section className="mt-6 border border-border bg-white p-4" aria-label="Perlu tindakan">
            <h2 className="text-lg font-bold text-ink">Perlu tindakan</h2>
            <p className="mt-1 text-sm text-ink-muted">
              Hal yang tertahan dan butuh perhatian admin.
            </p>
            <div className="mt-4 divide-y divide-border border-y border-border">
              {attention.map((item) => {
                const row = (
                  <>
                    <span className="flex items-center gap-2 text-sm text-ink-muted">
                      {item.count > 0 ? (
                        <AlertTriangle className="h-4 w-4 text-amber" aria-hidden="true" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" />
                      )}
                      {item.label}
                    </span>
                    <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                      {item.count.toLocaleString('id-ID')}
                      {item.href ? (
                        <ChevronRight className="h-4 w-4 text-ink-faint" aria-hidden="true" />
                      ) : null}
                    </span>
                  </>
                );
                const className = 'flex min-h-11 items-center justify-between gap-4 py-3';

                return item.href ? (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={cn(className, 'hover:text-primary-hover')}
                  >
                    {row}
                  </Link>
                ) : (
                  <div key={item.label} className={className}>
                    {row}
                  </div>
                );
              })}
            </div>
          </section>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <CategoryChart
              title="Pesanan per status"
              description="Sebaran seluruh pesanan menurut status."
              rows={(Object.keys(adminOrderStatusLabels) as AdminOrderStatus[]).map((status) => ({
                label: adminOrderStatusLabels[status],
                value: stats.orders.byStatus[status] ?? 0
              }))}
            />
            <CategoryChart
              title="Pengguna per peran"
              description="Pengguna aktif menurut peran."
              rows={(Object.keys(adminUserRoleLabels) as AdminUserRole[]).map((role) => ({
                label: adminUserRoleLabels[role],
                value: stats.users.byRole[role] ?? 0
              }))}
            />
          </div>

          <TrendChart daily={stats.daily} />

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
