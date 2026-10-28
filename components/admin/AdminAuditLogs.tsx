'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { AdminTableSkeleton } from '@/components/admin/AdminSkeleton';
import { AdminEmptyState, AdminErrorState } from '@/components/admin/AdminState';
import {
  AdminApiError,
  adminAuditTargetLabels,
  fetchAdmin,
  type AdminAuditLog,
  type AdminAuditTargetType,
  type AdminPaginationMeta
} from '@/lib/admin-api';
import { formatAdminDateTime } from '@/lib/admin-format';

export type AdminAuditFilters = {
  q: string;
  targetType: string;
  action: string;
  from: string;
  to: string;
  page: number;
};

function targetHref(log: AdminAuditLog) {
  if (!log.targetId) return null;

  if (log.targetType === 'USER') return `/admin/users/${log.targetId}`;
  if (log.targetType === 'DOCTOR') return `/admin/doctors/${log.targetId}`;
  if (log.targetType === 'FACILITY') return `/admin/facilities/${log.targetId}`;
  if (log.targetType === 'ARTICLE') return `/admin/articles/${log.targetId}`;
  if (log.targetType === 'ORDER') return `/admin/orders/${log.targetId}`;
  if (log.targetType === 'REVIEW') return `/admin/reviews/${log.targetId}`;

  return null;
}

export function AdminAuditLogs({ filters }: { filters: AdminAuditFilters }) {
  const router = useRouter();
  const { q, targetType, action, from, to, page } = filters;
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [meta, setMeta] = useState<AdminPaginationMeta>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [search, setSearch] = useState(q);
  const [target, setTarget] = useState(targetType);
  const [auditAction, setAuditAction] = useState(action);
  const [fromDate, setFromDate] = useState(from);
  const [toDate, setToDate] = useState(to);

  useEffect(() => {
    setSearch(q);
    setTarget(targetType);
    setAuditAction(action);
    setFromDate(from);
    setToDate(to);
  }, [q, targetType, action, from, to]);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();

    if (q) params.set('q', q);
    if (targetType) params.set('targetType', targetType);
    if (action) params.set('action', action);
    if (from) params.set('from', `${from}T00:00:00.000Z`);
    if (to) params.set('to', `${to}T23:59:59.999Z`);
    params.set('page', String(page));

    setLoading(true);
    setError('');

    fetchAdmin<AdminAuditLog[]>(`/admin/audit-logs?${params.toString()}`, {
      signal: controller.signal
    })
      .then((response) => {
        setLogs(response.data);
        setMeta(response.meta as AdminPaginationMeta | undefined);
      })
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === 'AbortError') return;

        if (cause instanceof AdminApiError && cause.status === 401) {
          window.location.href = '/login?callbackUrl=/admin/audit-logs';
          return;
        }

        setError(cause instanceof Error ? cause.message : 'Gagal memuat audit log.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [q, targetType, action, from, to, page, attempt]);

  const applyFilters = (next: {
    search?: string;
    targetType?: string;
    action?: string;
    from?: string;
    to?: string;
    page?: number;
  }) => {
    const nextSearch = next.search ?? search;
    const nextTarget = next.targetType ?? target;
    const nextAction = next.action ?? auditAction;
    const nextFrom = next.from ?? fromDate;
    const nextTo = next.to ?? toDate;
    const nextPage = next.page ?? 1;
    const params = new URLSearchParams();

    if (nextSearch.trim()) params.set('q', nextSearch.trim());
    if (nextTarget) params.set('targetType', nextTarget);
    if (nextAction.trim()) params.set('action', nextAction.trim().toUpperCase());
    if (nextFrom) params.set('from', nextFrom);
    if (nextTo) params.set('to', nextTo);
    if (nextPage > 1) params.set('page', String(nextPage));

    const query = params.toString();
    router.push(query ? `/admin/audit-logs?${query}` : '/admin/audit-logs');
  };

  const resetFilters = () => {
    setSearch('');
    setTarget('');
    setAuditAction('');
    setFromDate('');
    setToDate('');
    router.push('/admin/audit-logs');
  };

  return (
    <div>
      <AdminPageHeader
        eyebrow="Keamanan"
        title="Audit log"
        description="Lacak tindakan admin yang memengaruhi pengguna, mitra, konten, dan pesanan."
        action={
          <button
            type="button"
            onClick={() => setAttempt((value) => value + 1)}
            className="inline-flex min-h-11 items-center rounded-md border border-border-strong px-3 text-sm font-semibold text-ink hover:border-primary hover:bg-primary-tint"
          >
            Muat ulang
          </button>
        }
      />

      <form
        onSubmit={(event) => {
          event.preventDefault();
          applyFilters({ page: 1 });
        }}
        className="mt-6 grid gap-3 border border-border bg-white p-4 lg:grid-cols-3 xl:grid-cols-[1fr_150px_160px_150px_150px_auto] xl:items-end"
      >
        <label className="text-sm font-medium text-ink">
          Cari log
          <span className="relative mt-1 block">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari aksi atau aktor"
              className="h-11 w-full rounded-md border border-border-strong bg-white pl-9 pr-3 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-primary"
            />
          </span>
        </label>

        <label className="text-sm font-medium text-ink">
          Target
          <select
            value={target}
            onChange={(event) => {
              setTarget(event.target.value);
              applyFilters({ targetType: event.target.value, page: 1 });
            }}
            className="mt-1 h-11 w-full rounded-md border border-border-strong bg-white px-3 text-sm text-ink outline-none focus:border-primary"
          >
            <option value="">Semua target</option>
            {(Object.keys(adminAuditTargetLabels) as AdminAuditTargetType[]).map((value) => (
              <option key={value} value={value}>
                {adminAuditTargetLabels[value]}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-ink">
          Aksi
          <input
            type="text"
            value={auditAction}
            onChange={(event) => setAuditAction(event.target.value)}
            placeholder="USER_UPDATE"
            className="mt-1 h-11 w-full rounded-md border border-border-strong bg-white px-3 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-primary"
          />
        </label>

        <label className="text-sm font-medium text-ink">
          Dari tanggal
          <input
            type="date"
            value={fromDate}
            onChange={(event) => setFromDate(event.target.value)}
            className="mt-1 h-11 w-full rounded-md border border-border-strong bg-white px-3 text-sm text-ink outline-none focus:border-primary"
          />
        </label>

        <label className="text-sm font-medium text-ink">
          Sampai tanggal
          <input
            type="date"
            value={toDate}
            onChange={(event) => setToDate(event.target.value)}
            className="mt-1 h-11 w-full rounded-md border border-border-strong bg-white px-3 text-sm text-ink outline-none focus:border-primary"
          />
        </label>

        <div className="flex gap-2">
          <button
            type="submit"
            className="inline-flex h-11 items-center rounded-md bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover"
          >
            Terapkan
          </button>
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex h-11 items-center rounded-md border border-border-strong px-4 text-sm font-semibold text-ink hover:border-primary hover:bg-primary-tint"
          >
            Reset
          </button>
        </div>
      </form>

      <p className="mt-4 text-sm text-ink-muted">
        {meta ? `${meta.total.toLocaleString('id-ID')} log ditemukan` : 'Memuat audit log...'}
      </p>

      <div className="mt-3">
        {loading ? (
          <AdminTableSkeleton rows={8} columns={6} />
        ) : error ? (
          <AdminErrorState message={error} onRetry={() => setAttempt((value) => value + 1)} />
        ) : logs.length === 0 ? (
          <AdminEmptyState
            title="Tidak ada audit log"
            description="Coba ubah kata kunci, target, aksi, atau rentang tanggal."
          />
        ) : (
          <div className="overflow-x-auto border border-border bg-white">
            <table className="w-full min-w-[960px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-surface text-xs text-ink-faint">
                  <th className="px-4 py-3 font-medium">Waktu</th>
                  <th className="px-4 py-3 font-medium">Aktor</th>
                  <th className="px-4 py-3 font-medium">Aksi</th>
                  <th className="px-4 py-3 font-medium">Target</th>
                  <th className="px-4 py-3 font-medium">Metadata</th>
                  <th className="px-4 py-3 font-medium">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.map((log) => {
                  const href = targetHref(log);
                  const metadata = log.metadata
                    ? JSON.stringify(log.metadata, null, 2)
                    : 'Tidak ada metadata';

                  return (
                    <tr key={log.id} className="align-top hover:bg-surface">
                      <td className="px-4 py-3 text-ink-muted">
                        {formatAdminDateTime(log.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-ink">{log.actor.name}</p>
                        <p className="text-xs text-ink-faint">{log.actor.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-semibold text-ink">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-ink">
                          {adminAuditTargetLabels[log.targetType] ?? log.targetType}
                        </p>
                        {log.targetId ? (
                          href ? (
                            <Link
                              href={href}
                              className="font-mono text-xs text-primary-hover hover:underline"
                            >
                              {log.targetId.slice(-8).toUpperCase()}
                            </Link>
                          ) : (
                            <p className="font-mono text-xs text-ink-faint">
                              {log.targetId.slice(-8).toUpperCase()}
                            </p>
                          )
                        ) : (
                          <p className="text-xs text-ink-faint">—</p>
                        )}
                      </td>
                      <td className="max-w-sm px-4 py-3">
                        <details>
                          <summary className="cursor-pointer text-xs font-semibold text-primary-hover">
                            Lihat metadata
                          </summary>
                          <pre className="mt-2 max-h-48 max-w-xs overflow-auto whitespace-pre-wrap bg-surface p-2 font-mono text-xs text-ink">
                            {metadata}
                          </pre>
                        </details>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-ink-muted">
                        {log.ipAddress || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && !error && meta ? (
        <div className="mt-4">
          <AdminPagination
            basePath="/admin/audit-logs"
            page={meta.page}
            totalPages={meta.totalPages}
            total={meta.total}
            limit={meta.limit}
            query={{ q, targetType, action, from, to }}
          />
        </div>
      ) : null}
    </div>
  );
}
