'use client';

import Link from 'next/link';
import { useState } from 'react';
import { AdminErrorState } from '@/components/admin/AdminState';
import { AdminTableSkeleton } from '@/components/admin/AdminSkeleton';
import { useAdminQuery } from '@/lib/admin-swr';
import {
  adminAuditActionLabels,
  adminAuditTargetLabels,
  type AdminAuditLog
} from '@/lib/admin-api';
import { formatAdminDateTime } from '@/lib/admin-format';

function targetHref(log: AdminAuditLog) {
  if (!log.targetId) return null;

  const base: Partial<Record<AdminAuditLog['targetType'], string>> = {
    USER: '/admin/users',
    DOCTOR: '/admin/doctors',
    FACILITY: '/admin/facilities',
    ARTICLE: '/admin/articles',
    ORDER: '/admin/orders',
    REVIEW: '/admin/reviews'
  };

  return base[log.targetType] ? `${base[log.targetType]}/${log.targetId}` : null;
}

export function AdminUserActivity({ userId }: { userId: string }) {
  const [page, setPage] = useState(1);
  const { data, meta, loading, error, reload } = useAdminQuery<AdminAuditLog[]>(
    `/admin/audit-logs?userId=${encodeURIComponent(userId)}&page=${page}`,
    30000
  );
  const logs = data ?? [];
  const totalPages = meta?.totalPages ?? 1;

  return (
    <section className="border border-border bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-ink">Riwayat aktivitas</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Login, pesanan, konsultasi, ulasan, dan tindakan admin terhadap akun ini.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="mt-4">
          <AdminTableSkeleton rows={4} columns={4} />
        </div>
      ) : null}

      {error ? (
        <div className="mt-4">
          <AdminErrorState message={error} onRetry={reload} />
        </div>
      ) : null}

      {!loading && !error && logs.length === 0 ? (
        <p className="mt-4 text-sm text-ink-muted">Belum ada aktivitas tercatat.</p>
      ) : null}

      {logs.length > 0 ? (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border text-sm text-ink-faint">
                <th className="pb-2 pr-3 font-medium">Waktu</th>
                <th className="pb-2 pr-3 font-medium">Aktivitas</th>
                <th className="pb-2 pr-3 font-medium">Objek</th>
                <th className="pb-2 font-medium">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs.map((log) => {
                const href = targetHref(log);
                const byUser = log.actor.id === userId;

                return (
                  <tr key={log.id} className="align-top">
                    <td className="py-3 pr-3 text-ink-muted">
                      {formatAdminDateTime(log.createdAt)}
                    </td>
                    <td className="py-3 pr-3">
                      <p className="font-medium text-ink">
                        {adminAuditActionLabels[log.action] ?? log.action}
                      </p>
                      {byUser ? null : (
                        <p className="text-sm text-ink-faint">oleh admin {log.actor.name}</p>
                      )}
                    </td>
                    <td className="py-3 pr-3 text-ink-muted">
                      {href ? (
                        <Link href={href} className="text-primary-hover hover:underline">
                          {adminAuditTargetLabels[log.targetType] ?? log.targetType}
                        </Link>
                      ) : (
                        (adminAuditTargetLabels[log.targetType] ?? log.targetType)
                      )}
                    </td>
                    <td className="py-3 font-mono text-sm text-ink-faint">
                      {log.ipAddress ?? '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      {totalPages > 1 ? (
        <div className="mt-4 flex items-center justify-between gap-3 text-sm">
          <button
            type="button"
            onClick={() => setPage((value) => value - 1)}
            disabled={page <= 1}
            className="inline-flex min-h-11 items-center border border-border-strong px-3 font-semibold text-ink hover:border-primary hover:bg-primary-tint disabled:cursor-not-allowed disabled:opacity-50"
          >
            Sebelumnya
          </button>
          <span className="text-ink-muted">
            Halaman {page} dari {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((value) => value + 1)}
            disabled={page >= totalPages}
            className="inline-flex min-h-11 items-center border border-border-strong px-3 font-semibold text-ink hover:border-primary hover:bg-primary-tint disabled:cursor-not-allowed disabled:opacity-50"
          >
            Berikutnya
          </button>
        </div>
      ) : null}
    </section>
  );
}
