'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CalendarCheck, CheckCircle2, Clock3, Search, XCircle } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { AdminTableSkeleton } from '@/components/admin/AdminSkeleton';
import { AdminEmptyState, AdminErrorState } from '@/components/admin/AdminState';
import { useAdminQuery } from '@/lib/admin-swr';
import {
  adminConsultationStatusLabels,
  type AdminConsultation,
  type AdminConsultationStatus
} from '@/lib/admin-api';
import { formatAdminCurrency, formatAdminDateTime } from '@/lib/admin-format';
import { cn } from '@/lib/utils';

export type AdminConsultationFilters = {
  q: string;
  status: string;
  stale: string;
  page: number;
};

const statusTone: Record<AdminConsultationStatus, string> = {
  REQUESTED: 'border-amber bg-amber-tint text-amber-ink',
  CONFIRMED: 'border-primary bg-primary-tint text-primary-hover',
  COMPLETED: 'border-primary bg-primary-tint text-primary-hover',
  CANCELLED: 'border-destructive bg-white text-destructive'
};

const statusIcon: Record<AdminConsultationStatus, typeof Clock3> = {
  REQUESTED: Clock3,
  CONFIRMED: CalendarCheck,
  COMPLETED: CheckCircle2,
  CANCELLED: XCircle
};

function StatusBadge({ status }: { status: AdminConsultationStatus }) {
  const Icon = statusIcon[status] ?? Clock3;

  return (
    <span
      className={cn(
        'inline-flex min-h-7 items-center gap-1.5 border px-2 text-sm font-medium',
        statusTone[status]
      )}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {adminConsultationStatusLabels[status] ?? status}
    </span>
  );
}

export function AdminConsultations({ filters }: { filters: AdminConsultationFilters }) {
  const router = useRouter();
  const { q, status, stale, page } = filters;
  const [search, setSearch] = useState(q);
  const [consultationStatus, setConsultationStatus] = useState(status);
  const [onlyStale, setOnlyStale] = useState(stale === 'true');

  useEffect(() => {
    setSearch(q);
    setConsultationStatus(status);
    setOnlyStale(stale === 'true');
  }, [q, status, stale]);

  const params = new URLSearchParams();

  if (q) params.set('q', q);
  if (status) params.set('status', status);
  if (stale === 'true') params.set('stale', 'true');
  params.set('page', String(page));

  const {
    data: consultations = [],
    meta,
    loading,
    error,
    reload
  } = useAdminQuery<AdminConsultation[]>(`/admin/consultations?${params.toString()}`);

  const applyFilters = (next: {
    search?: string;
    status?: string;
    stale?: boolean;
    page?: number;
  }) => {
    const nextSearch = next.search ?? search;
    const nextStatus = next.status ?? consultationStatus;
    const nextStale = next.stale ?? onlyStale;
    const nextPage = next.page ?? 1;
    const query = new URLSearchParams();

    if (nextSearch.trim()) query.set('q', nextSearch.trim());
    if (nextStatus && !nextStale) query.set('status', nextStatus);
    if (nextStale) query.set('stale', 'true');
    if (nextPage > 1) query.set('page', String(nextPage));

    const text = query.toString();
    router.push(text ? `/admin/consultations?${text}` : '/admin/consultations');
  };

  const resetFilters = () => {
    setSearch('');
    setConsultationStatus('');
    setOnlyStale(false);
    router.push('/admin/consultations');
  };

  return (
    <div>
      <AdminPageHeader
        eyebrow="Transaksi"
        title="Konsultasi"
        description="Pantau jadwal dan status konsultasi. Keluhan dan rekam medis tidak ditampilkan; hanya pasien dan dokter terkait yang dapat melihatnya."
      />

      <form
        onSubmit={(event) => {
          event.preventDefault();
          applyFilters({ page: 1 });
        }}
        className="mt-6 flex flex-col gap-3 border border-border bg-white p-4 md:flex-row md:items-end"
      >
        <label className="flex-1 text-sm font-medium text-ink">
          Cari konsultasi
          <span className="relative mt-1 block">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Pasien, dokter, atau spesialisasi"
              className="h-11 w-full border border-border-strong bg-white pl-9 pr-3 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-primary"
            />
          </span>
        </label>

        <label className="text-sm font-medium text-ink md:w-56">
          Status
          <select
            value={onlyStale ? 'REQUESTED' : consultationStatus}
            disabled={onlyStale}
            onChange={(event) => {
              setConsultationStatus(event.target.value);
              applyFilters({ status: event.target.value, page: 1 });
            }}
            className="mt-1 h-11 w-full border border-border-strong bg-white px-3 text-sm text-ink outline-none focus:border-primary disabled:bg-surface"
          >
            <option value="">Semua status</option>
            {(Object.keys(adminConsultationStatusLabels) as AdminConsultationStatus[]).map(
              (value) => (
                <option key={value} value={value}>
                  {adminConsultationStatusLabels[value]}
                </option>
              )
            )}
          </select>
        </label>

        <label className="flex min-h-11 items-center gap-2 text-sm font-medium text-ink">
          <input
            type="checkbox"
            checked={onlyStale}
            onChange={(event) => {
              setOnlyStale(event.target.checked);
              applyFilters({ stale: event.target.checked, page: 1 });
            }}
            className="h-5 w-5 accent-[var(--color-primary)]"
          />
          Belum dikonfirmasi &gt; 24 jam
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
          ? `${meta.total.toLocaleString('id-ID')} konsultasi ditemukan`
          : 'Memuat data konsultasi...'}
      </p>

      <div className="mt-3">
        {loading ? (
          <AdminTableSkeleton rows={7} columns={6} />
        ) : error ? (
          <AdminErrorState message={error} onRetry={reload} />
        ) : consultations.length === 0 ? (
          <AdminEmptyState
            title="Tidak ada konsultasi"
            description="Coba ubah kata kunci atau filter status."
          />
        ) : (
          <div className="overflow-x-auto border border-border bg-white">
            <table className="w-full min-w-[960px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-surface text-xs text-ink-faint">
                  <th className="px-4 py-3 font-medium">Jadwal</th>
                  <th className="px-4 py-3 font-medium">Pasien</th>
                  <th className="px-4 py-3 font-medium">Dokter</th>
                  <th className="px-4 py-3 font-medium">Tipe</th>
                  <th className="px-4 py-3 font-medium">Biaya</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Diajukan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {consultations.map((item) => (
                  <tr key={item.id} className="align-top hover:bg-surface">
                    <td className="px-4 py-3">
                      <p className="text-ink">{formatAdminDateTime(item.scheduledAt)}</p>
                      <p className="text-xs text-ink-faint">{item.durationMinutes} menit</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-ink">{item.patient.name}</p>
                      <p className="text-xs text-ink-faint">{item.patient.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-ink">{item.doctorProfile.user.name}</p>
                      <p className="text-xs text-ink-faint">{item.doctorProfile.specialty}</p>
                    </td>
                    <td className="px-4 py-3 text-ink-muted">
                      {item.type === 'ONLINE' ? 'Online' : 'Tatap muka'}
                    </td>
                    <td className="px-4 py-3 text-ink">
                      {item.fee != null ? formatAdminCurrency(item.fee) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-4 py-3 text-ink-muted">
                      {formatAdminDateTime(item.createdAt)}
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
            basePath="/admin/consultations"
            page={meta.page}
            totalPages={meta.totalPages}
            total={meta.total}
            limit={meta.limit}
            query={{ q, status, stale: stale === 'true' ? 'true' : undefined }}
          />
        </div>
      ) : null}
    </div>
  );
}
