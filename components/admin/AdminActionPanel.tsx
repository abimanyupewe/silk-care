'use client';

import { useState } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { AdminApiError, fetchAdmin } from '@/lib/admin-api';

type AdminActionPanelProps = {
  title: string;
  description: string;
  currentStatus: string;
  endpoint: string;
  approveStatus: string;
  rejectStatus: string;
  noteMaxLength: number;
  approveLabel?: string;
  rejectLabel?: string;
  method?: 'PATCH' | 'POST';
  onUpdated: () => void;
};

type Action = 'approve' | 'reject';

export function AdminActionPanel({
  title,
  description,
  currentStatus,
  endpoint,
  approveStatus,
  rejectStatus,
  noteMaxLength,
  approveLabel = 'Setujui',
  rejectLabel = 'Tolak',
  method = 'PATCH',
  onUpdated
}: AdminActionPanelProps) {
  const [note, setNote] = useState('');
  const [pending, setPending] = useState<Action | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const submit = async (action: Action) => {
    const trimmedNote = note.trim();

    if (action === 'reject' && !trimmedNote) {
      setError('Catatan wajib diisi saat menolak.');
      setSuccess('');
      return;
    }

    setPending(action);
    setError('');
    setSuccess('');

    try {
      await fetchAdmin(endpoint, {
        method,
        body: JSON.stringify({
          status: action === 'approve' ? approveStatus : rejectStatus,
          note: trimmedNote || null
        })
      });

      setNote('');
      setSuccess(
        action === 'approve'
          ? 'Status berhasil diperbarui menjadi disetujui.'
          : 'Status berhasil diperbarui menjadi ditolak.'
      );
      onUpdated();
    } catch (cause) {
      if (cause instanceof AdminApiError && cause.status === 401) {
        window.location.href = '/login?callbackUrl=/admin';
        return;
      }

      setError(cause instanceof Error ? cause.message : 'Tindakan admin gagal diproses.');
    } finally {
      setPending(null);
    }
  };

  const alreadyApproved = currentStatus === approveStatus;
  const alreadyRejected = currentStatus === rejectStatus;

  return (
    <section className="border border-border bg-white p-5">
      <h2 className="text-lg font-bold text-ink">{title}</h2>
      <p className="mt-1 text-sm text-ink-muted">{description}</p>

      <label className="mt-4 block text-sm font-medium text-ink" htmlFor="admin-action-note">
        Catatan
      </label>
      <textarea
        id="admin-action-note"
        value={note}
        onChange={(event) => setNote(event.target.value)}
        maxLength={noteMaxLength}
        rows={4}
        placeholder="Tambahkan catatan untuk mitra atau penulis..."
        className="mt-1 w-full rounded-md border border-border-strong bg-white px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-primary"
      />
      <p className="mt-1 text-xs text-ink-faint">
        {note.length}/{noteMaxLength} karakter. Catatan wajib saat menolak.
      </p>

      {error ? (
        <p className="mt-3 flex items-start gap-2 text-sm text-destructive" aria-live="polite">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : null}

      {success ? (
        <p className="mt-3 flex items-start gap-2 text-sm text-primary-hover" aria-live="polite">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {success}
        </p>
      ) : null}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => submit('approve')}
          disabled={pending !== null || alreadyApproved}
          aria-busy={pending === 'approve'}
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending === 'approve'
            ? 'Menyimpan...'
            : alreadyApproved
              ? 'Sudah disetujui'
              : approveLabel}
        </button>
        <button
          type="button"
          onClick={() => submit('reject')}
          disabled={pending !== null || alreadyRejected}
          aria-busy={pending === 'reject'}
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-destructive px-4 text-sm font-semibold text-destructive hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending === 'reject' ? 'Menyimpan...' : alreadyRejected ? 'Sudah ditolak' : rejectLabel}
        </button>
      </div>
    </section>
  );
}
