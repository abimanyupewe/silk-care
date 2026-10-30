'use client';

import { useState } from 'react';
import { CheckCircle2, EyeOff, Plus } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminTableSkeleton } from '@/components/admin/AdminSkeleton';
import { AdminEmptyState, AdminErrorState } from '@/components/admin/AdminState';
import { fetchApi } from '@/lib/api-client';
import { useApiQuery } from '@/lib/api-swr';
import { formatAdminPriceRange } from '@/lib/admin-format';
import { cn } from '@/lib/utils';

type Service = {
  id: string;
  name: string;
  description: string | null;
  priceMin: number;
  priceMax: number | null;
  durationMinutes: number;
  active: boolean;
};

const fieldClass =
  'mt-1 w-full border border-border-strong bg-white px-3 py-2 text-base text-ink outline-none focus:border-primary';
const primaryBtn =
  'inline-flex h-11 items-center gap-2 bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60';
const outlineBtn =
  'inline-flex h-11 items-center border border-border-strong px-4 text-sm font-semibold text-ink hover:border-primary hover:bg-primary-tint disabled:opacity-60';

function ServiceForm({
  service,
  onDone,
  onCancel
}: {
  service?: Service;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const text = (key: string) => String(form.get(key) ?? '').trim() || null;
    const priceMax = String(form.get('priceMax') ?? '').trim();

    setSaving(true);
    setError('');
    try {
      await fetchApi(service ? `/facility/services/${service.id}` : '/facility/services', {
        method: service ? 'PATCH' : 'POST',
        body: JSON.stringify({
          name: text('name'),
          description: text('description'),
          priceMin: Number(form.get('priceMin')),
          priceMax: priceMax ? Number(priceMax) : null,
          durationMinutes: Number(form.get('durationMinutes')),
          active: form.get('active') === 'on'
        })
      });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan layanan.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 border border-border bg-white p-4">
      <label className="block text-sm font-medium text-ink">
        Nama layanan
        <input
          name="name"
          required
          minLength={2}
          maxLength={150}
          defaultValue={service?.name ?? ''}
          className={cn(fieldClass, 'h-11 py-0')}
        />
      </label>
      <label className="block text-sm font-medium text-ink">
        Deskripsi
        <textarea
          name="description"
          maxLength={2000}
          rows={3}
          defaultValue={service?.description ?? ''}
          className={fieldClass}
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block text-sm font-medium text-ink">
          Harga mulai dari (Rp)
          <input
            type="number"
            name="priceMin"
            required
            min={0}
            max={100000000}
            step={1}
            defaultValue={service?.priceMin ?? ''}
            className={cn(fieldClass, 'h-11 py-0')}
          />
        </label>
        <label className="block text-sm font-medium text-ink">
          Harga sampai (Rp, opsional)
          <input
            type="number"
            name="priceMax"
            min={0}
            max={100000000}
            step={1}
            defaultValue={service?.priceMax ?? ''}
            className={cn(fieldClass, 'h-11 py-0')}
          />
        </label>
        <label className="block text-sm font-medium text-ink">
          Durasi (menit)
          <input
            type="number"
            name="durationMinutes"
            required
            min={5}
            max={480}
            step={5}
            defaultValue={service?.durationMinutes ?? 30}
            className={cn(fieldClass, 'h-11 py-0')}
          />
        </label>
      </div>
      <label className="flex min-h-11 items-center gap-2 text-sm font-medium text-ink">
        <input
          type="checkbox"
          name="active"
          defaultChecked={service?.active ?? true}
          className="h-5 w-5"
        />
        Tampilkan di halaman fasilitas
      </label>
      {error ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={saving} className={primaryBtn}>
          {saving ? 'Menyimpan...' : 'Simpan layanan'}
        </button>
        <button type="button" onClick={onCancel} className={outlineBtn}>
          Batal
        </button>
      </div>
    </form>
  );
}

function ServiceRow({
  service,
  onChanged,
  onEdit
}: {
  service: Service;
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

  const toggleActive = () =>
    run(
      () =>
        fetchApi(`/facility/services/${service.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ active: !service.active })
        }),
      'Gagal mengubah status layanan.'
    );

  const remove = () =>
    window.confirm(`Hapus "${service.name}"?`) &&
    run(
      () => fetchApi(`/facility/services/${service.id}`, { method: 'DELETE' }),
      'Gagal menghapus layanan.'
    );

  const StatusIcon = service.active ? CheckCircle2 : EyeOff;

  return (
    <li className="border border-border bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-ink">{service.name}</p>
          <p className="text-sm text-ink-muted">
            {formatAdminPriceRange(service.priceMin, service.priceMax)} · {service.durationMinutes}{' '}
            menit
          </p>
        </div>
        <span
          className={cn(
            'inline-flex min-h-7 items-center gap-1.5 border px-2 text-sm font-medium',
            service.active
              ? 'border-primary bg-primary-tint text-primary-hover'
              : 'border-border-strong bg-white text-ink'
          )}
        >
          <StatusIcon className="h-4 w-4" aria-hidden="true" />
          {service.active ? 'Aktif' : 'Nonaktif'}
        </span>
      </div>
      {service.description ? <p className="mt-2 text-sm text-ink">{service.description}</p> : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={onEdit} className={outlineBtn}>
          Edit
        </button>
        <button type="button" disabled={busy} onClick={toggleActive} className={outlineBtn}>
          {service.active ? 'Nonaktifkan' : 'Aktifkan'}
        </button>
        <button type="button" disabled={busy} onClick={remove} className={outlineBtn}>
          Hapus
        </button>
      </div>
      {error ? (
        <p role="alert" className="mt-3 text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </li>
  );
}

export function FacilityServices() {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  // 'new' = form tambah, string lain = id layanan yang sedang diedit.
  const [editing, setEditing] = useState<string | null>(null);
  const params = new URLSearchParams({ page: String(page) });

  if (q.trim()) params.set('q', q.trim());

  const {
    data = [],
    meta,
    loading,
    error,
    reload
  } = useApiQuery<Service[]>(`/facility/services?${params.toString()}`, 0);

  const done = () => {
    setEditing(null);
    reload();
  };

  return (
    <div>
      <AdminPageHeader
        eyebrow="Panel fasilitas"
        title="Layanan"
        description="Kelola daftar layanan dan harga yang tampil di halaman fasilitas Anda."
      />

      <div className="mt-6 flex flex-wrap items-end justify-between gap-3">
        <label className="block text-sm font-medium text-ink sm:w-64">
          Cari layanan
          <input
            type="search"
            value={q}
            onChange={(event) => {
              setQ(event.target.value);
              setPage(1);
            }}
            maxLength={100}
            className="mt-1 h-11 w-full border border-border-strong bg-white px-3 text-base text-ink outline-none focus:border-primary"
          />
        </label>
        <button type="button" onClick={() => setEditing('new')} className={primaryBtn}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Tambah layanan
        </button>
      </div>

      {editing === 'new' ? (
        <div className="mt-4">
          <ServiceForm onDone={done} onCancel={() => setEditing(null)} />
        </div>
      ) : null}

      <div className="mt-4">
        {loading && data.length === 0 ? (
          <AdminTableSkeleton rows={4} columns={3} />
        ) : error ? (
          <AdminErrorState message={error} onRetry={reload} />
        ) : data.length === 0 ? (
          <AdminEmptyState
            title="Belum ada layanan"
            description="Tambahkan layanan pertama Anda agar pasien tahu apa yang tersedia."
          />
        ) : (
          <ul className="space-y-3">
            {data.map((service) =>
              editing === service.id ? (
                <li key={service.id}>
                  <ServiceForm service={service} onDone={done} onCancel={() => setEditing(null)} />
                </li>
              ) : (
                <ServiceRow
                  key={service.id}
                  service={service}
                  onChanged={reload}
                  onEdit={() => setEditing(service.id)}
                />
              )
            )}
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
