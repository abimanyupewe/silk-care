'use client';

import { useState } from 'react';
import { CalendarClock, CheckCircle2, CheckCheck, XCircle } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminTableSkeleton } from '@/components/admin/AdminSkeleton';
import { AdminEmptyState, AdminErrorState } from '@/components/admin/AdminState';
import { fetchApi } from '@/lib/api-client';
import { useApiQuery } from '@/lib/api-swr';
import { formatAdminDateTime, formatAdminPriceRange } from '@/lib/admin-format';
import {
  appointmentStatusLabels,
  appointmentStatuses,
  type AppointmentStatusValue
} from '@/lib/appointment';
import { cn } from '@/lib/utils';

type Appointment = {
  id: string;
  status: AppointmentStatusValue;
  scheduledAt: string;
  durationMinutes: number;
  serviceName: string;
  price: number | null;
  priceMax: number | null;
  notes: string | null;
  cancelReason: string | null;
  patient: { name: string | null };
};

const statusTone: Record<AppointmentStatusValue, string> = {
  REQUESTED: 'border-amber bg-white text-ink',
  CONFIRMED: 'border-primary bg-primary-tint text-primary-hover',
  COMPLETED: 'border-primary bg-primary-tint text-primary-hover',
  CANCELLED: 'border-destructive bg-white text-destructive'
};

const statusIcon: Record<AppointmentStatusValue, typeof CalendarClock> = {
  REQUESTED: CalendarClock,
  CONFIRMED: CheckCircle2,
  COMPLETED: CheckCheck,
  CANCELLED: XCircle
};

const primaryBtn =
  'inline-flex h-11 items-center bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60';
const outlineBtn =
  'inline-flex h-11 items-center border border-border-strong px-4 text-sm font-semibold text-ink hover:border-primary hover:bg-primary-tint disabled:opacity-60';

function AppointmentCard({
  appointment,
  onChanged
}: {
  appointment: Appointment;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const Icon = statusIcon[appointment.status];
  const canComplete =
    appointment.status === 'CONFIRMED' && new Date(appointment.scheduledAt).getTime() <= Date.now();

  async function change(status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED', reason?: string) {
    setBusy(true);
    setError('');
    try {
      await fetchApi(`/facility/appointments/${appointment.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, reason })
      });
      setCancelling(false);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengubah status janji temu.');
    } finally {
      setBusy(false);
    }
  }

  function submitCancel(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const reason = String(new FormData(event.currentTarget).get('reason') ?? '').trim();
    void change('CANCELLED', reason);
  }

  return (
    <li className="border border-border bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-ink">{appointment.patient.name || 'Pasien SILK'}</p>
          <p className="text-sm text-ink-muted">
            {appointment.serviceName} · {formatAdminDateTime(appointment.scheduledAt)} ·{' '}
            {appointment.durationMinutes} menit
          </p>
          {appointment.price != null ? (
            <p className="text-sm text-ink-muted">
              {formatAdminPriceRange(appointment.price, appointment.priceMax)}
            </p>
          ) : null}
        </div>
        <span
          className={cn(
            'inline-flex min-h-7 items-center gap-1.5 border px-2 text-sm font-medium',
            statusTone[appointment.status]
          )}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
          {appointmentStatusLabels[appointment.status]}
        </span>
      </div>
      {appointment.notes ? (
        <p className="mt-2 text-sm text-ink">Catatan pasien: {appointment.notes}</p>
      ) : null}
      {appointment.cancelReason ? (
        <p className="mt-2 text-sm text-ink-muted">Alasan batal: {appointment.cancelReason}</p>
      ) : null}

      {appointment.status === 'REQUESTED' || appointment.status === 'CONFIRMED' ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {appointment.status === 'REQUESTED' ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => change('CONFIRMED')}
              className={primaryBtn}
            >
              Konfirmasi
            </button>
          ) : null}
          {canComplete ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => change('COMPLETED')}
              className={primaryBtn}
            >
              Tandai selesai
            </button>
          ) : null}
          <button
            type="button"
            disabled={busy}
            onClick={() => setCancelling((value) => !value)}
            className={outlineBtn}
          >
            {appointment.status === 'REQUESTED' ? 'Tolak' : 'Batalkan'}
          </button>
        </div>
      ) : null}

      {cancelling ? (
        <form onSubmit={submitCancel} className="mt-3 space-y-2">
          <label className="block text-sm font-medium text-ink">
            Alasan (wajib, dikirim ke pasien)
            <input
              name="reason"
              required
              maxLength={500}
              className="mt-1 h-11 w-full border border-border-strong bg-white px-3 text-base text-ink outline-none focus:border-primary"
            />
          </label>
          <button type="submit" disabled={busy} className={outlineBtn}>
            Kirim pembatalan
          </button>
        </form>
      ) : null}

      {error ? (
        <p role="alert" className="mt-3 text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </li>
  );
}

export function FacilityAppointments() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const params = new URLSearchParams({ page: String(page) });

  if (status) params.set('status', status);

  const {
    data = [],
    meta,
    loading,
    error,
    reload
  } = useApiQuery<Appointment[]>(`/facility/appointments?${params.toString()}`, 30000);

  return (
    <div>
      <AdminPageHeader
        eyebrow="Panel fasilitas"
        title="Janji temu"
        description="Terima, tolak, dan selesaikan permintaan janji temu dari pasien."
      />

      <label className="mt-6 block text-sm font-medium text-ink sm:w-64">
        Status
        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
          className="mt-1 h-11 w-full border border-border-strong bg-white px-3 text-sm text-ink outline-none focus:border-primary"
        >
          <option value="">Semua status</option>
          {appointmentStatuses.map((value) => (
            <option key={value} value={value}>
              {appointmentStatusLabels[value]}
            </option>
          ))}
        </select>
      </label>

      <div className="mt-4">
        {loading && data.length === 0 ? (
          <AdminTableSkeleton rows={4} columns={3} />
        ) : error ? (
          <AdminErrorState message={error} onRetry={reload} />
        ) : data.length === 0 ? (
          <AdminEmptyState
            title="Belum ada janji temu"
            description="Permintaan janji temu dari pasien akan muncul di sini."
          />
        ) : (
          <ul className="space-y-3">
            {data.map((appointment) => (
              <AppointmentCard key={appointment.id} appointment={appointment} onChanged={reload} />
            ))}
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
