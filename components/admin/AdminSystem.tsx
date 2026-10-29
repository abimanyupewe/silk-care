'use client';

import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminDetailSkeleton } from '@/components/admin/AdminSkeleton';
import { AdminErrorState } from '@/components/admin/AdminState';
import { useAdminQuery } from '@/lib/admin-swr';
import type { AdminSystemStatus } from '@/lib/admin-api';
import { formatAdminDateTime } from '@/lib/admin-format';

export function AdminSystem() {
  const {
    data: status,
    loading,
    error,
    reload
  } = useAdminQuery<AdminSystemStatus>('/admin/system');

  const systemRows = status
    ? [
        {
          label: 'Pembayaran (Midtrans)',
          ok: status.integrations.payment,
          detail: 'Tanpa ini pembuatan pembayaran gagal (503).'
        },
        {
          label: 'Unggah media (Cloudinary)',
          ok: status.integrations.upload,
          detail: 'Tanpa ini foto/video profil tidak bisa diunggah.'
        },
        {
          label: 'Email transaksi (Resend)',
          ok: status.integrations.email,
          detail: 'Tanpa ini email verifikasi dan transaksi tidak terkirim.'
        },
        {
          label: 'AI Chat',
          ok: status.integrations.ai,
          detail: 'Tanpa ini AI Chat membalas 503.'
        },
        {
          label: 'Cron kedaluwarsa pesanan',
          ok: status.integrations.cron,
          detail: 'CRON_SECRET belum diatur; endpoint cron menolak semua panggilan.'
        }
      ]
    : [];

  return (
    <div>
      <AdminPageHeader
        eyebrow="Sistem"
        title="Status sistem"
        description="Kondisi database dan konfigurasi integrasi. Hanya memeriksa apakah kunci terisi, bukan keabsahannya."
      />

      {loading && !status ? (
        <div className="mt-6">
          <AdminDetailSkeleton />
        </div>
      ) : null}

      {error ? (
        <div className="mt-6">
          <AdminErrorState message={error} onRetry={reload} />
        </div>
      ) : null}

      {status ? (
        <>
          <section className="mt-6 border border-border bg-white p-4" aria-label="Status sistem">
            <h2 className="text-lg font-bold text-ink">Status sistem</h2>
            <p className="mt-1 text-sm text-ink-muted">
              Database merespons dalam {status.database.latencyMs.toLocaleString('id-ID')} ms.
            </p>
            <ul className="mt-4 divide-y divide-border border-y border-border">
              {systemRows.map((row) => (
                <li key={row.label} className="flex min-h-11 items-start gap-3 py-3">
                  {row.ok ? (
                    <CheckCircle2
                      className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                  ) : (
                    <AlertTriangle
                      className="mt-0.5 h-4 w-4 shrink-0 text-amber"
                      aria-hidden="true"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-ink">{row.label}</span>
                      <span className="font-semibold text-ink">
                        {row.ok ? 'Aktif' : 'Belum dikonfigurasi'}
                      </span>
                    </p>
                    {row.ok ? null : <p className="mt-1 text-sm text-ink-faint">{row.detail}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <p className="mt-4 text-sm text-ink-faint">
            Diperbarui {formatAdminDateTime(status.checkedAt)}
          </p>
        </>
      ) : null}
    </div>
  );
}
