'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AlertCircle, ArrowLeft, ExternalLink } from 'lucide-react';
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

function FacilityEditPanel({
  facility,
  onUpdated
}: {
  facility: AdminFacilityDetailData;
  onUpdated: (facility: AdminFacilityDetailData) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const numberOrNull = (name: string) => {
      const value = String(form.get(name) ?? '').trim();
      return value ? Number(value) : null;
    };
    setPending(true);
    setError('');
    try {
      const response = await fetchAdmin<AdminFacilityDetailData>(
        `/admin/facilities/${facility.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            name: form.get('name'),
            type: form.get('type'),
            description: form.get('description') || null,
            address: form.get('address') || null,
            city: form.get('city') || null,
            phone: form.get('phone') || null,
            latitude: numberOrNull('latitude'),
            longitude: numberOrNull('longitude')
          })
        }
      );
      onUpdated(response.data);
      setEditing(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Gagal memperbarui profil fasilitas.');
    } finally {
      setPending(false);
    }
  };

  if (!editing)
    return (
      <section className="border border-border bg-white p-5">
        <h2 className="text-lg font-bold text-ink">Perbarui profil</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Koreksi data fasilitas sebelum memproses verifikasi.
        </p>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="mt-4 inline-flex min-h-11 items-center border border-border-strong px-4 text-sm font-semibold text-ink hover:border-primary hover:bg-primary-tint"
        >
          Edit profil
        </button>
      </section>
    );

  return (
    <section className="border border-border bg-white p-5">
      <h2 className="text-lg font-bold text-ink">Edit profil fasilitas</h2>
      <p className="mt-1 text-sm text-ink-muted">Mengubah tipe dapat menyesuaikan peran pemilik.</p>
      <form onSubmit={save} className="mt-4 space-y-4">
        <label className="block text-sm font-medium text-ink">
          Nama
          <input
            name="name"
            required
            minLength={2}
            maxLength={150}
            defaultValue={facility.name}
            className="mt-1 h-10 w-full border border-border-strong px-3 text-ink outline-none focus:border-primary focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-primary"
          />
        </label>
        <label className="block text-sm font-medium text-ink">
          Tipe
          <select
            name="type"
            defaultValue={facility.type}
            className="mt-1 h-10 w-full border border-border-strong bg-white px-3 text-ink outline-none focus:border-primary focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-primary"
          >
            {Object.entries(adminFacilityTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-ink">
          Kota
          <input
            name="city"
            maxLength={100}
            defaultValue={facility.city ?? ''}
            className="mt-1 h-10 w-full border border-border-strong px-3 text-ink outline-none focus:border-primary focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-primary"
          />
        </label>
        <label className="block text-sm font-medium text-ink">
          Telepon
          <input
            name="phone"
            minLength={8}
            maxLength={20}
            defaultValue={facility.phone ?? ''}
            className="mt-1 h-10 w-full border border-border-strong px-3 text-ink outline-none focus:border-primary focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-primary"
          />
        </label>
        <label className="block text-sm font-medium text-ink">
          Alamat
          <textarea
            name="address"
            maxLength={500}
            defaultValue={facility.address ?? ''}
            rows={3}
            className="mt-1 w-full border border-border-strong p-3 text-ink outline-none focus:border-primary focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-primary"
          />
        </label>
        <label className="block text-sm font-medium text-ink">
          Deskripsi
          <textarea
            name="description"
            maxLength={2000}
            defaultValue={facility.description ?? ''}
            rows={4}
            className="mt-1 w-full border border-border-strong p-3 text-ink outline-none focus:border-primary focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-primary"
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-ink">
            Latitude
            <input
              name="latitude"
              type="number"
              step="any"
              min="-90"
              max="90"
              defaultValue={facility.latitude ?? ''}
              className="mt-1 h-10 w-full border border-border-strong px-3 text-ink outline-none focus:border-primary focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-primary"
            />
          </label>
          <label className="block text-sm font-medium text-ink">
            Longitude
            <input
              name="longitude"
              type="number"
              step="any"
              min="-180"
              max="180"
              defaultValue={facility.longitude ?? ''}
              className="mt-1 h-10 w-full border border-border-strong px-3 text-ink outline-none focus:border-primary focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-primary"
            />
          </label>
        </div>
        {error ? (
          <p className="flex gap-2 text-sm text-destructive" aria-live="polite">
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            {error}
          </p>
        ) : null}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex min-h-11 items-center border border-primary bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? 'Menyimpan...' : 'Simpan perubahan'}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => setEditing(false)}
            className="inline-flex min-h-11 items-center border border-border-strong px-4 text-sm font-semibold text-ink hover:border-primary hover:bg-primary-tint"
          >
            Batal
          </button>
        </div>
      </form>
    </section>
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
          <FacilityEditPanel facility={facility} onUpdated={setFacility} />
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
