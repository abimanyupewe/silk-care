'use client';

import { useState } from 'react';
import { CalendarClock, CheckCircle2, Clock3, FileText, Plus, type LucideIcon } from 'lucide-react';
import { AdminModal } from '@/components/admin/AdminModal';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminTableSkeleton } from '@/components/admin/AdminSkeleton';
import { AdminEmptyState, AdminErrorState } from '@/components/admin/AdminState';
import { AnnouncementBar } from '@/components/shared/AnnouncementBar';
import { fetchAdmin, type AdminAnnouncement } from '@/lib/admin-api';
import { formatAdminDateTime } from '@/lib/admin-format';
import { useApiQuery } from '@/lib/api-swr';
import {
  announcementStatus,
  announcementStatusLabels,
  announcementToneLabels,
  announcementTones,
  hasPlaceholder,
  isSafeLinkUrl,
  type AnnouncementStatusValue,
  type AnnouncementToneValue
} from '@/lib/announcement';
import { announcementTemplates } from '@/lib/announcement-templates';
import { cn } from '@/lib/utils';

// Nilai formulir; tanggal berupa string datetime-local dalam Asia/Jakarta (UTC+7, tanpa DST).
type FormValues = {
  message: string;
  tone: AnnouncementToneValue;
  linkLabel: string;
  linkUrl: string;
  startsAt: string;
  endsAt: string;
  dismissible: boolean;
  active: boolean;
};

type Dialog =
  | { kind: 'pick' }
  | { kind: 'form'; title: string; values: FormValues; editingId: string | null };

const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000;

const toInputValue = (iso: string | null) =>
  iso ? new Date(new Date(iso).getTime() + JAKARTA_OFFSET_MS).toISOString().slice(0, 16) : '';

const fromInputValue = (value: string) =>
  value ? new Date(`${value}:00+07:00`).toISOString() : null;

const emptyValues: FormValues = {
  message: '',
  tone: 'INFO',
  linkLabel: '',
  linkUrl: '',
  startsAt: '',
  endsAt: '',
  dismissible: true,
  active: false
};

const valuesFrom = (item: AdminAnnouncement): FormValues => ({
  message: item.message,
  tone: item.tone,
  linkLabel: item.linkLabel ?? '',
  linkUrl: item.linkUrl ?? '',
  startsAt: toInputValue(item.startsAt),
  endsAt: toInputValue(item.endsAt),
  dismissible: item.dismissible,
  active: item.active
});

const payloadFrom = (values: FormValues) => ({
  message: values.message.trim(),
  tone: values.tone,
  linkLabel: values.linkLabel.trim() || null,
  linkUrl: values.linkUrl.trim() || null,
  startsAt: fromInputValue(values.startsAt),
  endsAt: fromInputValue(values.endsAt),
  dismissible: values.dismissible,
  active: values.active
});

const statusIcons: Record<AnnouncementStatusValue, LucideIcon> = {
  LIVE: CheckCircle2,
  SCHEDULED: CalendarClock,
  ENDED: Clock3,
  DRAFT: FileText
};

const fieldClass =
  'mt-1 w-full border border-border-strong bg-white px-3 text-base text-ink outline-none focus:border-primary';
const primaryBtn =
  'inline-flex h-11 items-center gap-2 bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60';
const outlineBtn =
  'inline-flex h-11 items-center border border-border-strong px-4 text-sm font-semibold text-ink hover:border-primary hover:bg-primary-tint disabled:opacity-60';

function StatusBadge({ item }: { item: AdminAnnouncement }) {
  const status = announcementStatus(item);
  const Icon = statusIcons[status];

  return (
    <span
      className={cn(
        'inline-flex min-h-7 items-center gap-1.5 border px-2 text-sm font-medium',
        status === 'LIVE'
          ? 'border-primary bg-primary-tint text-primary-hover'
          : 'border-border-strong bg-white text-ink'
      )}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {announcementStatusLabels[status]}
    </span>
  );
}

function TemplatePicker({ onPick }: { onPick: (values: FormValues, title: string) => void }) {
  return (
    <div className="mt-4 space-y-3">
      <button
        type="button"
        onClick={() => onPick(emptyValues, 'Banner baru')}
        className={cn(outlineBtn, 'w-full justify-start')}
      >
        Banner kosong
      </button>
      <ul className="space-y-3">
        {announcementTemplates.map((template) => (
          <li key={template.key} className="border border-border">
            <button
              type="button"
              onClick={() =>
                onPick(
                  {
                    ...emptyValues,
                    message: template.message,
                    tone: template.tone,
                    linkLabel: template.linkLabel ?? '',
                    linkUrl: template.linkUrl ?? ''
                  },
                  `Banner dari template: ${template.label}`
                )
              }
              className="block w-full text-left hover:bg-surface"
            >
              <span className="block px-3 pt-3 text-sm font-semibold text-ink">
                {template.label}
              </span>
              <span className="pointer-events-none mt-2 block">
                <AnnouncementBar announcement={{ ...template, dismissible: false }} />
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AnnouncementForm({
  initial,
  editingId,
  onDone,
  onCancel
}: {
  initial: FormValues;
  editingId: string | null;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [values, setValues] = useState(initial);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const placeholder = hasPlaceholder(values.message);
  const linkReady = values.linkLabel.trim() && isSafeLinkUrl(values.linkUrl.trim());
  const set = <K extends keyof FormValues>(key: K, value: FormValues[K]) =>
    setValues((current) => ({ ...current, [key]: value }));

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await fetchAdmin(editingId ? `/admin/announcements/${editingId}` : '/admin/announcements', {
        method: editingId ? 'PATCH' : 'POST',
        // Placeholder belum diisi: simpan sebagai draf, server juga menolak mengaktifkannya.
        body: JSON.stringify({
          ...payloadFrom(values),
          active: placeholder ? false : values.active
        })
      });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan banner.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-4">
      <AnnouncementBar
        announcement={{
          message: values.message.trim() || 'Isi pesan banner di sini.',
          tone: values.tone,
          linkLabel: linkReady ? values.linkLabel.trim() : null,
          linkUrl: linkReady ? values.linkUrl.trim() : null,
          dismissible: values.dismissible
        }}
        onDismiss={() => undefined}
      />

      <label className="block text-sm font-medium text-ink">
        Pesan
        <textarea
          required
          maxLength={200}
          rows={3}
          value={values.message}
          onChange={(event) => set('message', event.target.value)}
          className={cn(fieldClass, 'py-2')}
        />
        <span className="mt-1 block text-sm text-ink-muted">
          {values.message.length}/200 karakter
        </span>
      </label>
      {placeholder ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          Lengkapi bagian dalam [ ] sebelum mengaktifkan banner. Sementara itu hanya bisa disimpan
          sebagai draf.
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm font-medium text-ink">
          Teks tautan (opsional)
          <input
            maxLength={40}
            value={values.linkLabel}
            onChange={(event) => set('linkLabel', event.target.value)}
            className={cn(fieldClass, 'h-11')}
          />
        </label>
        <label className="block text-sm font-medium text-ink">
          Alamat tautan (opsional)
          <input
            maxLength={500}
            placeholder="/fasilitas atau https://…"
            value={values.linkUrl}
            onChange={(event) => set('linkUrl', event.target.value)}
            className={cn(fieldClass, 'h-11')}
          />
        </label>
      </div>

      <label className="block text-sm font-medium text-ink sm:w-64">
        Nada
        <select
          value={values.tone}
          onChange={(event) => set('tone', event.target.value as AnnouncementToneValue)}
          className={cn(fieldClass, 'h-11')}
        >
          {announcementTones.map((tone) => (
            <option key={tone} value={tone}>
              {announcementToneLabels[tone]}
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm font-medium text-ink">
          Mulai tampil (WIB, opsional)
          <input
            type="datetime-local"
            value={values.startsAt}
            onChange={(event) => set('startsAt', event.target.value)}
            className={cn(fieldClass, 'h-11')}
          />
        </label>
        <label className="block text-sm font-medium text-ink">
          Selesai tampil (WIB, opsional)
          <input
            type="datetime-local"
            value={values.endsAt}
            onChange={(event) => set('endsAt', event.target.value)}
            className={cn(fieldClass, 'h-11')}
          />
        </label>
      </div>

      <label className="flex min-h-11 items-center gap-2 text-sm font-medium text-ink">
        <input
          type="checkbox"
          checked={values.dismissible}
          onChange={(event) => set('dismissible', event.target.checked)}
          className="h-5 w-5"
        />
        Pengunjung boleh menutup banner
      </label>
      <label className="flex min-h-11 items-center gap-2 text-sm font-medium text-ink">
        <input
          type="checkbox"
          checked={values.active && !placeholder}
          disabled={placeholder}
          onChange={(event) => set('active', event.target.checked)}
          className="h-5 w-5"
        />
        Aktifkan sekarang (menonaktifkan banner lain)
      </label>

      {error ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={saving} className={primaryBtn}>
          {saving ? 'Menyimpan...' : 'Simpan banner'}
        </button>
        <button type="button" disabled={saving} onClick={onCancel} className={outlineBtn}>
          Batal
        </button>
      </div>
    </form>
  );
}

function AnnouncementRow({
  item,
  otherActive,
  onChanged,
  onEdit
}: {
  item: AdminAnnouncement;
  otherActive: AdminAnnouncement | undefined;
  onChanged: () => void;
  onEdit: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function run(request: () => Promise<unknown>, fallback: string) {
    setBusy(true);
    setError('');
    try {
      await request();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : fallback);
    } finally {
      setBusy(false);
    }
  }

  const setActive = (active: boolean) => {
    if (
      active &&
      otherActive &&
      !window.confirm(`Banner "${otherActive.message}" akan dinonaktifkan. Lanjutkan?`)
    ) {
      return;
    }

    void run(
      () =>
        fetchAdmin(`/admin/announcements/${item.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ active })
        }),
      'Gagal mengubah status banner.'
    );
  };

  const duplicate = () =>
    run(
      () =>
        fetchAdmin('/admin/announcements', {
          method: 'POST',
          body: JSON.stringify({ ...payloadFrom(valuesFrom(item)), active: false })
        }),
      'Gagal menduplikasi banner.'
    );

  const remove = () => {
    if (!window.confirm(`Hapus banner "${item.message}"?`)) return;

    void run(
      () => fetchAdmin(`/admin/announcements/${item.id}`, { method: 'DELETE' }),
      'Gagal menghapus banner.'
    );
  };

  return (
    <li className="border border-border bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="min-w-0 flex-1 font-semibold text-ink">{item.message}</p>
        <StatusBadge item={item} />
      </div>
      <p className="mt-1 text-sm text-ink-muted">
        {announcementToneLabels[item.tone]}
        {item.startsAt ? ` · mulai ${formatAdminDateTime(item.startsAt)}` : ''}
        {item.endsAt ? ` · selesai ${formatAdminDateTime(item.endsAt)}` : ''}
        {item.linkUrl ? ` · tautan ${item.linkUrl}` : ''}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {item.active ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => setActive(false)}
            className={outlineBtn}
          >
            Nonaktifkan
          </button>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => setActive(true)}
            className={primaryBtn}
          >
            Aktifkan
          </button>
        )}
        <button type="button" disabled={busy} onClick={onEdit} className={outlineBtn}>
          Ubah
        </button>
        <button type="button" disabled={busy} onClick={duplicate} className={outlineBtn}>
          Duplikat
        </button>
        <button type="button" disabled={busy} onClick={remove} className={outlineBtn}>
          Hapus
        </button>
      </div>
      {error ? (
        <p role="alert" className="mt-3 text-sm font-medium text-destructive">
          {error}{' '}
          <button type="button" onClick={onChanged} className="font-semibold underline">
            Muat ulang
          </button>
        </p>
      ) : null}
    </li>
  );
}

export function AdminAnnouncements() {
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const {
    data = [],
    meta,
    loading,
    error,
    reload
  } = useApiQuery<AdminAnnouncement[]>(`/admin/announcements?page=${page}`, 0);
  const activeItem = data.find((item) => item.active);

  const done = () => {
    setDialog(null);
    reload();
  };

  return (
    <div>
      <AdminPageHeader
        eyebrow="Sistem"
        title="Banner informasi"
        description="Simpan beberapa banner, lalu pilih satu untuk ditampilkan di atas navbar situs publik. Hanya satu banner yang bisa aktif."
        action={
          <button type="button" onClick={() => setDialog({ kind: 'pick' })} className={primaryBtn}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Buat banner
          </button>
        }
      />

      <div className="mt-6">
        {loading && data.length === 0 ? (
          <AdminTableSkeleton rows={4} columns={3} />
        ) : error ? (
          <AdminErrorState message={error} onRetry={reload} />
        ) : data.length === 0 ? (
          <AdminEmptyState
            title="Belum ada banner"
            description="Buat banner pertama dari template atau mulai dari banner kosong."
          />
        ) : (
          <ul className="space-y-3">
            {data.map((item) => (
              <AnnouncementRow
                key={item.id}
                item={item}
                otherActive={activeItem && activeItem.id !== item.id ? activeItem : undefined}
                onChanged={reload}
                onEdit={() =>
                  setDialog({
                    kind: 'form',
                    title: 'Ubah banner',
                    values: valuesFrom(item),
                    editingId: item.id
                  })
                }
              />
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

      <AdminModal
        open={dialog?.kind === 'pick'}
        onClose={() => setDialog(null)}
        title="Buat banner"
        description="Mulai dari template atau dari banner kosong."
        wide
      >
        <TemplatePicker
          onPick={(values, title) => setDialog({ kind: 'form', title, values, editingId: null })}
        />
      </AdminModal>

      <AdminModal
        open={dialog?.kind === 'form'}
        onClose={() => setDialog(null)}
        title={dialog?.kind === 'form' ? dialog.title : ''}
        wide
      >
        {dialog?.kind === 'form' ? (
          <AnnouncementForm
            key={`${dialog.editingId ?? 'new'}-${dialog.title}`}
            initial={dialog.values}
            editingId={dialog.editingId}
            onDone={done}
            onCancel={() => setDialog(null)}
          />
        ) : null}
      </AdminModal>
    </div>
  );
}
