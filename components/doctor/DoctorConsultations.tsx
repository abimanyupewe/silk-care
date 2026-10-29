'use client';

import { useState } from 'react';
import { CalendarCheck, CheckCircle2, Clock3, XCircle } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminTableSkeleton } from '@/components/admin/AdminSkeleton';
import { AdminEmptyState, AdminErrorState } from '@/components/admin/AdminState';
import { fetchApi } from '@/lib/api-client';
import { useApiQuery } from '@/lib/api-swr';
import {
  adminConsultationStatusLabels as statusLabels,
  type AdminConsultationStatus as Status
} from '@/lib/admin-api';
import { formatAdminCurrency, formatAdminDateTime } from '@/lib/admin-format';
import { cn } from '@/lib/utils';

type MedicalRecord = {
  diagnosis: string;
  notes: string | null;
  prescription: string | null;
  followUpAt: string | null;
};

type Consultation = {
  id: string;
  status: Status;
  type: 'ONLINE' | 'IN_PERSON';
  scheduledAt: string;
  durationMinutes: number;
  fee: number | null;
  complaint: string | null;
  patient: { name: string };
  medicalRecord?: MedicalRecord | null;
};

const statusTone: Record<Status, string> = {
  REQUESTED: 'border-amber bg-amber-tint text-amber-ink',
  CONFIRMED: 'border-primary bg-primary-tint text-primary-hover',
  COMPLETED: 'border-primary bg-primary-tint text-primary-hover',
  CANCELLED: 'border-destructive bg-white text-destructive'
};

const statusIcon: Record<Status, typeof Clock3> = {
  REQUESTED: Clock3,
  CONFIRMED: CalendarCheck,
  COMPLETED: CheckCircle2,
  CANCELLED: XCircle
};

const fieldClass =
  'mt-1 w-full border border-border-strong bg-white px-3 py-2 text-base text-ink outline-none focus:border-primary';
const primaryBtn =
  'inline-flex h-11 items-center bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60';
const outlineBtn =
  'inline-flex h-11 items-center border border-border-strong px-4 text-sm font-semibold text-ink hover:border-primary hover:bg-primary-tint disabled:opacity-60';

function RecordForm({ id, onSaved }: { id: string; onSaved: () => void }) {
  // Daftar tidak memuat rekam medis; ambil detail sekali untuk mengisi form saat diedit ulang.
  const detail = useApiQuery<Consultation>(`/doctor/consultations/${id}`, 0);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  if (detail.loading) return <p className="text-sm text-ink-muted">Memuat rekam medis...</p>;
  if (detail.error) return <AdminErrorState message={detail.error} onRetry={detail.reload} />;

  const record = detail.data?.medicalRecord;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const text = (key: string) => String(form.get(key) ?? '').trim() || null;

    setSaving(true);
    setError('');
    try {
      await fetchApi(`/doctor/consultations/${id}/medical-record`, {
        method: 'PUT',
        body: JSON.stringify({
          diagnosis: text('diagnosis'),
          notes: text('notes'),
          prescription: text('prescription'),
          followUpAt: text('followUpAt')
        })
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan rekam medis.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <label className="block text-sm font-medium text-ink">
        Diagnosis
        <textarea
          name="diagnosis"
          required
          minLength={3}
          maxLength={2000}
          rows={2}
          defaultValue={record?.diagnosis ?? ''}
          className={fieldClass}
        />
      </label>
      <label className="block text-sm font-medium text-ink">
        Catatan
        <textarea
          name="notes"
          maxLength={5000}
          rows={3}
          defaultValue={record?.notes ?? ''}
          className={fieldClass}
        />
      </label>
      <label className="block text-sm font-medium text-ink">
        Resep
        <textarea
          name="prescription"
          maxLength={5000}
          rows={3}
          defaultValue={record?.prescription ?? ''}
          className={fieldClass}
        />
      </label>
      <label className="block text-sm font-medium text-ink sm:w-60">
        Tanggal kontrol
        <input
          type="date"
          name="followUpAt"
          defaultValue={record?.followUpAt?.slice(0, 10) ?? ''}
          className={cn(fieldClass, 'h-11 py-0')}
        />
      </label>
      {error ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}
      <button type="submit" disabled={saving} className={primaryBtn}>
        {saving ? 'Menyimpan...' : 'Simpan rekam medis'}
      </button>
    </form>
  );
}

function ConsultationCard({ item, onChanged }: { item: Consultation; onChanged: () => void }) {
  const [panel, setPanel] = useState<'cancel' | 'record' | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const Icon = statusIcon[item.status];

  async function changeStatus(status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED') {
    setBusy(true);
    setError('');
    try {
      await fetchApi(`/doctor/consultations/${item.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, reason: status === 'CANCELLED' ? reason : undefined })
      });
      setPanel(null);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengubah status.');
    } finally {
      setBusy(false);
    }
  }

  const toggle = (next: 'cancel' | 'record') => setPanel(panel === next ? null : next);

  return (
    <li className="border border-border bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-ink">{item.patient.name}</p>
          <p className="text-sm text-ink-muted">
            {formatAdminDateTime(item.scheduledAt)} · {item.durationMinutes} menit ·{' '}
            {item.type === 'ONLINE' ? 'Online' : 'Tatap muka'}
            {item.fee != null ? ` · ${formatAdminCurrency(item.fee)}` : ''}
          </p>
        </div>
        <span
          className={cn(
            'inline-flex min-h-7 items-center gap-1.5 border px-2 text-sm font-medium',
            statusTone[item.status]
          )}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
          {statusLabels[item.status]}
        </span>
      </div>

      {item.complaint ? <p className="mt-3 text-base text-ink">{item.complaint}</p> : null}

      <div className="mt-3 flex flex-wrap gap-2">
        {item.status === 'REQUESTED' ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => changeStatus('CONFIRMED')}
            className={primaryBtn}
          >
            Konfirmasi
          </button>
        ) : null}
        {item.status === 'CONFIRMED' ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => changeStatus('COMPLETED')}
            className={primaryBtn}
          >
            Tandai selesai
          </button>
        ) : null}
        {item.status === 'COMPLETED' ? (
          <button type="button" onClick={() => toggle('record')} className={primaryBtn}>
            Rekam medis
          </button>
        ) : null}
        {item.status === 'REQUESTED' || item.status === 'CONFIRMED' ? (
          <button type="button" onClick={() => toggle('cancel')} className={outlineBtn}>
            Batalkan
          </button>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="mt-3 text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}

      {panel === 'cancel' ? (
        <div className="mt-3 space-y-3 border-t border-border pt-3">
          <label className="block text-sm font-medium text-ink">
            Alasan pembatalan (opsional)
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              maxLength={500}
              rows={2}
              className={fieldClass}
            />
          </label>
          <button
            type="button"
            disabled={busy}
            onClick={() => changeStatus('CANCELLED')}
            className={outlineBtn}
          >
            Ya, batalkan konsultasi
          </button>
        </div>
      ) : null}

      {panel === 'record' ? (
        <div className="mt-3 border-t border-border pt-3">
          <RecordForm
            id={item.id}
            onSaved={() => {
              setPanel(null);
              onChanged();
            }}
          />
        </div>
      ) : null}
    </li>
  );
}

export function DoctorConsultations() {
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
  } = useApiQuery<Consultation[]>(`/doctor/consultations?${params.toString()}`, 30000);

  return (
    <div>
      <AdminPageHeader
        eyebrow="Panel dokter"
        title="Konsultasi"
        description="Konfirmasi jadwal, selesaikan konsultasi, lalu isi rekam medis pasien."
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
          {(Object.keys(statusLabels) as Status[]).map((value) => (
            <option key={value} value={value}>
              {statusLabels[value]}
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
            title="Belum ada konsultasi"
            description="Konsultasi dari pasien akan muncul di sini."
          />
        ) : (
          <ul className="space-y-3">
            {data.map((item) => (
              <ConsultationCard key={item.id} item={item} onChanged={reload} />
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
