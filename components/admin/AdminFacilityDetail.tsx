'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { AdminActionPanel } from '@/components/admin/AdminActionPanel';
import { AdminDetailSkeleton } from '@/components/admin/AdminSkeleton';
import { AdminErrorState } from '@/components/admin/AdminState';
import { AdminStatusBadge } from '@/components/admin/AdminStatusBadge';
import {
  AdminApiError,
  adminFacilityTypeLabels,
  fetchAdmin,
  type AdminFacilityDetail as AdminFacilityDetailData
} from '@/lib/admin-api';
import { adminDayLabels, formatAdminDate, formatAdminDateTime } from '@/lib/admin-format';

function DetailItem({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-ink-faint">{label}</dt>
      <dd className="mt-1 text-sm text-ink">{value || '—'}</dd>
    </div>
  );
}

export function AdminFacilityDetail({ id }: { id: string }) {
  const [facility, setFacility] = useState<AdminFacilityDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    setLoading(true);
    setError('');

    fetchAdmin<AdminFacilityDetailData>(`/admin/facilities/${id}`, {
      signal: controller.signal
    })
      .then((response) => setFacility(response.data))
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === 'AbortError') return;

        if (cause instanceof AdminApiError && cause.status === 401) {
          window.location.href = '/login?callbackUrl=/admin/facilities';
          return;
        }

        setError(cause instanceof Error ? cause.message : 'Gagal memuat detail fasilitas.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [id, attempt]);

  if (loading) return <AdminDetailSkeleton />;
  if (error)
    return <AdminErrorState message={error} onRetry={() => setAttempt((value) => value + 1)} />;
  if (!facility) return null;

  return (
    <div>
      <Link
        href="/admin/facilities"
        className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-ink-muted hover:text-primary-hover"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Kembali ke daftar fasilitas
      </Link>

      <div className="mt-3 flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary-hover">Verifikasi fasilitas</p>
          <h1 className="mt-1 text-2xl font-bold text-ink md:text-[32px]">{facility.name}</h1>
          <p className="mt-2 text-ink-muted">
            {adminFacilityTypeLabels[facility.type] ?? facility.type} · {facility.user.email}
          </p>
          <p className="mt-1 text-sm text-ink-faint">
            Terdaftar {formatAdminDate(facility.createdAt)} · Diperbarui{' '}
            {formatAdminDateTime(facility.updatedAt)}
          </p>
        </div>
        <AdminStatusBadge status={facility.verificationStatus} className="self-start" />
      </div>

      {facility.user.deletedAt ? (
        <p className="mt-4 border border-destructive bg-white p-3 text-sm text-destructive">
          Akun fasilitas ini sedang nonaktif. Verifikasi tidak dapat diproses sampai akun
          dipulihkan.
        </p>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <section className="border border-border bg-white p-5">
            <h2 className="text-lg font-bold text-ink">Profil fasilitas</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <DetailItem
                label="Tipe"
                value={adminFacilityTypeLabels[facility.type] ?? facility.type}
              />
              <DetailItem label="Kota" value={facility.city} />
              <DetailItem label="Telepon" value={facility.phone || facility.user.phone} />
              <DetailItem label="Jumlah produk" value={String(facility._count.products)} />
              <DetailItem
                label="Koordinat"
                value={
                  facility.latitude !== null && facility.longitude !== null
                    ? `${facility.latitude}, ${facility.longitude}`
                    : null
                }
              />
              <DetailItem label="Pemilik" value={facility.user.name} />
            </dl>
            <div className="mt-4 border-t border-border pt-4">
              <DetailItem label="Alamat" value={facility.address} />
            </div>
            <div className="mt-4 border-t border-border pt-4">
              <DetailItem label="Deskripsi" value={facility.description} />
            </div>
          </section>

          <section className="border border-border bg-white p-5">
            <h2 className="text-lg font-bold text-ink">Jam operasional</h2>
            {facility.operatingHours.length === 0 ? (
              <p className="mt-3 text-sm text-ink-muted">Belum ada jam operasional.</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[420px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs text-ink-faint">
                      <th className="pb-2 pr-4 font-medium">Hari</th>
                      <th className="pb-2 pr-4 font-medium">Buka</th>
                      <th className="pb-2 pr-4 font-medium">Tutup</th>
                      <th className="pb-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {facility.operatingHours.map((hour) => (
                      <tr key={hour.id}>
                        <td className="py-3 pr-4 text-ink">
                          {adminDayLabels[hour.dayOfWeek] ?? hour.dayOfWeek}
                        </td>
                        <td className="py-3 pr-4 text-ink-muted">
                          {hour.isClosed ? '—' : hour.openTime}
                        </td>
                        <td className="py-3 pr-4 text-ink-muted">
                          {hour.isClosed ? '—' : hour.closeTime}
                        </td>
                        <td className="py-3 text-ink-muted">{hour.isClosed ? 'Tutup' : 'Buka'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="border border-border bg-white p-5">
            <h2 className="text-lg font-bold text-ink">Media profil</h2>
            <div className="mt-4 flex flex-col gap-2 text-sm">
              {facility.photoUrl ? (
                <a
                  href={facility.photoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-11 items-center gap-2 text-primary-hover hover:underline"
                >
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  Lihat foto fasilitas
                </a>
              ) : (
                <p className="text-ink-muted">Foto fasilitas belum diunggah.</p>
              )}
              {facility.videoUrl ? (
                <a
                  href={facility.videoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-11 items-center gap-2 text-primary-hover hover:underline"
                >
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  Lihat video fasilitas
                </a>
              ) : (
                <p className="text-ink-muted">Video fasilitas belum diunggah.</p>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-4">
          <AdminActionPanel
            title="Tindakan verifikasi"
            description="Setujui fasilitas jika data sudah sesuai, atau tolak dengan catatan yang jelas."
            currentStatus={facility.verificationStatus}
            endpoint={`/admin/facilities/${facility.id}/verification`}
            approveStatus="VERIFIED"
            rejectStatus="REJECTED"
            noteMaxLength={500}
            approveLabel="Setujui fasilitas"
            rejectLabel="Tolak fasilitas"
            onUpdated={() => setAttempt((value) => value + 1)}
          />
        </div>
      </div>
    </div>
  );
}
