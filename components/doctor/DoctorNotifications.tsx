'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Bell, BellRing } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminTableSkeleton } from '@/components/admin/AdminSkeleton';
import { AdminEmptyState, AdminErrorState } from '@/components/admin/AdminState';
import { fetchApi } from '@/lib/api-client';
import { useApiQuery } from '@/lib/api-swr';
import { formatAdminDateTime } from '@/lib/admin-format';
import { cn } from '@/lib/utils';

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
};

const outlineBtn =
  'inline-flex h-11 items-center border border-border-strong px-4 text-sm font-semibold text-ink hover:border-primary hover:bg-primary-tint disabled:opacity-60';

type NotificationLink = { href: string; label: string };

// Default untuk panel dokter; panel lain mengoper eyebrow/description/links sendiri.
export function DoctorNotifications({
  eyebrow = 'Panel dokter',
  description = 'Konsultasi baru, perubahan status, dan ulasan untuk Anda.',
  links = {
    CONSULTATION: { href: '/dashboard/dokter/konsultasi', label: 'Lihat konsultasi' }
  }
}: {
  eyebrow?: string;
  description?: string;
  links?: Record<string, NotificationLink>;
}) {
  const [page, setPage] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [error, setError] = useState('');
  const params = new URLSearchParams({ page: String(page) });

  if (unreadOnly) params.set('unreadOnly', 'true');

  const {
    data = [],
    meta,
    loading,
    error: loadError,
    reload
  } = useApiQuery<Notification[]>(`/notifications?${params.toString()}`, 30000);
  const unreadCount = (meta as { unreadCount?: number } | undefined)?.unreadCount ?? 0;

  async function mutate(path: string, method: 'PATCH' | 'POST') {
    setError('');
    try {
      await fetchApi(path, { method });
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memperbarui notifikasi.');
    }
  }

  return (
    <div>
      <AdminPageHeader eyebrow={eyebrow} title="Notifikasi" description={description} />

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <label className="flex min-h-11 items-center gap-2 text-sm font-medium text-ink">
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(event) => {
              setUnreadOnly(event.target.checked);
              setPage(1);
            }}
            className="h-5 w-5 accent-[var(--color-primary)]"
          />
          Hanya yang belum dibaca
        </label>
        <button
          type="button"
          disabled={unreadCount === 0}
          onClick={() => mutate('/notifications/read-all', 'POST')}
          className={outlineBtn}
        >
          Tandai semua dibaca ({unreadCount})
        </button>
      </div>

      {error ? (
        <p role="alert" className="mt-3 text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}

      <div className="mt-4">
        {loading && data.length === 0 ? (
          <AdminTableSkeleton rows={4} columns={2} />
        ) : loadError ? (
          <AdminErrorState message={loadError} onRetry={reload} />
        ) : data.length === 0 ? (
          <AdminEmptyState
            title="Tidak ada notifikasi"
            description="Notifikasi baru akan muncul di sini."
          />
        ) : (
          <ul className="space-y-3">
            {data.map((item) => {
              const unread = !item.readAt;
              const Icon = unread ? BellRing : Bell;

              return (
                <li
                  key={item.id}
                  className={cn(
                    'border p-4',
                    unread ? 'border-primary bg-primary-tint' : 'border-border bg-white'
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="font-semibold text-ink">{item.title}</p>
                    <span className="inline-flex min-h-7 items-center gap-1.5 text-sm font-medium text-ink">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                      {unread ? 'Baru' : 'Dibaca'}
                    </span>
                  </div>
                  <p className="mt-1 text-base text-ink">{item.body}</p>
                  <p className="mt-1 text-sm text-ink-muted">
                    {formatAdminDateTime(item.createdAt)}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {links[item.type] ? (
                      <Link href={links[item.type].href} className={outlineBtn}>
                        {links[item.type].label}
                      </Link>
                    ) : null}
                    {unread ? (
                      <button
                        type="button"
                        onClick={() => mutate(`/notifications/${item.id}/read`, 'PATCH')}
                        className={outlineBtn}
                      >
                        Tandai dibaca
                      </button>
                    ) : null}
                  </div>
                </li>
              );
            })}
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
