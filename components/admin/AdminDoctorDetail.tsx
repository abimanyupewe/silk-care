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
  fetchAdmin,
  type AdminDoctorDetail as AdminDoctorDetailData
} from '@/lib/admin-api';
import {
  adminDayLabels,
  formatAdminCurrency,
  formatAdminDate,
  formatAdminDateTime
} from '@/lib/admin-format';

function DetailItem({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-ink-faint">{label}</dt>
      <dd className="mt-1 text-sm text-ink">{value || '—'}</dd>
    </div>
  );
}

function DoctorEditPanel({
  doctor,
  onUpdated
}: {
  doctor: AdminDoctorDetailData;
  onUpdated: (doctor: AdminDoctorDetailData) => void;
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
      const response = await fetchAdmin<AdminDoctorDetailData>(`/admin/doctors/${doctor.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          specialty: form.get('specialty'),
          bio: form.get('bio') || null,
          experienceYears: numberOrNull('experienceYears'),
          consultationFee: numberOrNull('consultationFee'),
          city: form.get('city') || null,
          address: form.get('address') || null,
          latitude: numberOrNull('latitude'),
          longitude: numberOrNull('longitude')
        })
      });
      onUpdated(response.data);
      setEditing(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Gagal memperbarui profil dokter.');
    } finally {
      setPending(false);
    }
  };

  if (!editing) {
    return (
      <section className="border border-border bg-white p-5">
        <h2 className="text-lg font-bold text-ink">Perbarui profil</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Koreksi data praktik sebelum memproses verifikasi.
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
  }

  return (
    <section className="border border-border bg-white p-5">
      <h2 className="text-lg font-bold text-ink">Edit profil dokter</h2>
      <form onSubmit={save} className="mt-4 space-y-4">
        <label className="block text-sm font-medium text-ink">
          Spesialis
          <input
            name="specialty"
            required
            minLength={2}
            maxLength={100}
            defaultValue={doctor.specialty}
            className="mt-1 h-10 w-full border border-border-strong px-3 text-ink outline-none focus:border-primary focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-primary"
          />
        </label>
        <label className="block text-sm font-medium text-ink">
          Kota
          <input
            name="city"
            maxLength={100}
            defaultValue={doctor.city ?? ''}
            className="mt-1 h-10 w-full border border-border-strong px-3 text-ink outline-none focus:border-primary focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-primary"
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-ink">
            Pengalaman (tahun)
            <input
              name="experienceYears"
              type="number"
              min="0"
              max="80"
              defaultValue={doctor.experienceYears ?? ''}
              className="mt-1 h-10 w-full border border-border-strong px-3 text-ink outline-none focus:border-primary focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-primary"
            />
          </label>
          <label className="block text-sm font-medium text-ink">
            Tarif konsultasi
            <input
              name="consultationFee"
              type="number"
              min="0"
              max="100000000"
              defaultValue={doctor.consultationFee ?? ''}
              className="mt-1 h-10 w-full border border-border-strong px-3 text-ink outline-none focus:border-primary focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-primary"
            />
          </label>
        </div>
        <label className="block text-sm font-medium text-ink">
          Alamat
          <textarea
            name="address"
            maxLength={500}
            defaultValue={doctor.address ?? ''}
            rows={3}
            className="mt-1 w-full border border-border-strong p-3 text-ink outline-none focus:border-primary focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-primary"
          />
        </label>
        <label className="block text-sm font-medium text-ink">
          Bio
          <textarea
            name="bio"
            maxLength={2000}
            defaultValue={doctor.bio ?? ''}
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
              defaultValue={doctor.latitude ?? ''}
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
              defaultValue={doctor.longitude ?? ''}
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

export function AdminDoctorDetail({ id }: { id: string }) {
  const [doctor, setDoctor] = useState<AdminDoctorDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    setLoading(true);
    setError('');

    fetchAdmin<AdminDoctorDetailData>(`/admin/doctors/${id}`, { signal: controller.signal })
      .then((response) => setDoctor(response.data))
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === 'AbortError') return;

        if (cause instanceof AdminApiError && cause.status === 401) {
          window.location.href = '/login?callbackUrl=/admin/doctors';
          return;
        }

        setError(cause instanceof Error ? cause.message : 'Gagal memuat detail dokter.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [id, attempt]);

  if (loading) return <AdminDetailSkeleton />;
  if (error)
    return <AdminErrorState message={error} onRetry={() => setAttempt((value) => value + 1)} />;
  if (!doctor) return null;

  return (
    <div>
      <Link
        href="/admin/doctors"
        className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-ink-muted hover:text-primary-hover"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Kembali ke daftar dokter
      </Link>

      <div className="mt-3 flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary-hover">Verifikasi dokter</p>
          <h1 className="mt-1 text-2xl font-bold text-ink md:text-[32px]">{doctor.user.name}</h1>
          <p className="mt-2 text-ink-muted">
            {doctor.specialty} · {doctor.user.email}
          </p>
          <p className="mt-1 text-sm text-ink-faint">
            Terdaftar {formatAdminDate(doctor.createdAt)} · Diperbarui{' '}
            {formatAdminDateTime(doctor.updatedAt)}
          </p>
        </div>
        <AdminStatusBadge status={doctor.verificationStatus} className="self-start" />
      </div>

      {doctor.user.deletedAt ? (
        <p className="mt-4 border border-destructive bg-white p-3 text-sm text-destructive">
          Akun dokter ini sedang nonaktif. Verifikasi tidak dapat diproses sampai akun dipulihkan.
        </p>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <section className="border border-border bg-white p-5">
            <h2 className="text-lg font-bold text-ink">Profil praktik</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <DetailItem label="Spesialis" value={doctor.specialty} />
              <DetailItem
                label="Pengalaman"
                value={doctor.experienceYears === null ? '—' : `${doctor.experienceYears} tahun`}
              />
              <DetailItem
                label="Tarif konsultasi"
                value={formatAdminCurrency(doctor.consultationFee)}
              />
              <DetailItem label="Kota" value={doctor.city} />
              <DetailItem label="Telepon" value={doctor.user.phone} />
              <DetailItem
                label="Koordinat"
                value={
                  doctor.latitude !== null && doctor.longitude !== null
                    ? `${doctor.latitude}, ${doctor.longitude}`
                    : null
                }
              />
            </dl>
            <div className="mt-4 border-t border-border pt-4">
              <DetailItem label="Alamat" value={doctor.address} />
            </div>
            <div className="mt-4 border-t border-border pt-4">
              <DetailItem label="Bio" value={doctor.bio} />
            </div>
          </section>

          <section className="border border-border bg-white p-5">
            <h2 className="text-lg font-bold text-ink">Jadwal praktik</h2>
            {doctor.schedules.length === 0 ? (
              <p className="mt-3 text-sm text-ink-muted">Belum ada jadwal praktik.</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[420px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs text-ink-faint">
                      <th className="pb-2 pr-4 font-medium">Hari</th>
                      <th className="pb-2 pr-4 font-medium">Mulai</th>
                      <th className="pb-2 pr-4 font-medium">Selesai</th>
                      <th className="pb-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {doctor.schedules.map((schedule) => (
                      <tr key={schedule.id}>
                        <td className="py-3 pr-4 text-ink">
                          {adminDayLabels[schedule.dayOfWeek] ?? schedule.dayOfWeek}
                        </td>
                        <td className="py-3 pr-4 text-ink-muted">{schedule.startTime}</td>
                        <td className="py-3 pr-4 text-ink-muted">{schedule.endTime}</td>
                        <td className="py-3 text-ink-muted">
                          {schedule.isActive ? 'Aktif' : 'Nonaktif'}
                        </td>
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
              {doctor.photoUrl ? (
                <a
                  href={doctor.photoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-11 items-center gap-2 text-primary-hover hover:underline"
                >
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  Lihat foto profil
                </a>
              ) : (
                <p className="text-ink-muted">Foto profil belum diunggah.</p>
              )}
              {doctor.videoUrl ? (
                <a
                  href={doctor.videoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-11 items-center gap-2 text-primary-hover hover:underline"
                >
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  Lihat video profil
                </a>
              ) : (
                <p className="text-ink-muted">Video profil belum diunggah.</p>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-4">
          <DoctorEditPanel doctor={doctor} onUpdated={setDoctor} />
          <AdminActionPanel
            title="Tindakan verifikasi"
            description="Setujui profil jika data sudah sesuai, atau tolak dengan catatan yang jelas."
            currentStatus={doctor.verificationStatus}
            endpoint={`/admin/doctors/${doctor.id}/verification`}
            approveStatus="VERIFIED"
            rejectStatus="REJECTED"
            noteMaxLength={500}
            approveLabel="Setujui dokter"
            rejectLabel="Tolak dokter"
            onUpdated={() => setAttempt((value) => value + 1)}
          />
        </div>
      </div>
    </div>
  );
}
