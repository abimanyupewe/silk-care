'use client';

import { useState } from 'react';
import { CheckCircle2, Clock3, FileEdit, XCircle } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminTableSkeleton } from '@/components/admin/AdminSkeleton';
import { AdminEmptyState, AdminErrorState } from '@/components/admin/AdminState';
import { fetchApi } from '@/lib/api-client';
import { useApiQuery } from '@/lib/api-swr';
import { formatAdminDateTime } from '@/lib/admin-format';
import { cn } from '@/lib/utils';

type Status = 'DRAFT' | 'PENDING' | 'PUBLISHED' | 'REJECTED';

type Article = {
  id: string;
  title: string;
  excerpt: string | null;
  content: string;
  status: Status;
  reviewNote: string | null;
  updatedAt: string;
};

const statusLabels: Record<Status, string> = {
  DRAFT: 'Draf',
  PENDING: 'Menunggu tinjauan',
  PUBLISHED: 'Terbit',
  REJECTED: 'Ditolak'
};

const statusTone: Record<Status, string> = {
  DRAFT: 'border-border-strong bg-white text-ink',
  PENDING: 'border-amber bg-amber-tint text-amber-ink',
  PUBLISHED: 'border-primary bg-primary-tint text-primary-hover',
  REJECTED: 'border-destructive bg-white text-destructive'
};

const statusIcon: Record<Status, typeof Clock3> = {
  DRAFT: FileEdit,
  PENDING: Clock3,
  PUBLISHED: CheckCircle2,
  REJECTED: XCircle
};

const fieldClass =
  'mt-1 w-full border border-border-strong bg-white px-3 py-2 text-base text-ink outline-none focus:border-primary';
const primaryBtn =
  'inline-flex h-11 items-center bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60';
const outlineBtn =
  'inline-flex h-11 items-center border border-border-strong px-4 text-sm font-semibold text-ink hover:border-primary hover:bg-primary-tint disabled:opacity-60';

function ArticleForm({
  article,
  onDone,
  onCancel
}: {
  article?: Article;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const text = (key: string) => String(form.get(key) ?? '').trim();

    setSaving(true);
    setError('');
    try {
      await fetchApi(article ? `/partner/articles/${article.id}` : '/partner/articles', {
        method: article ? 'PATCH' : 'POST',
        body: JSON.stringify({
          title: text('title'),
          excerpt: text('excerpt') || null,
          content: text('content')
        })
      });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan artikel.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <label className="block text-sm font-medium text-ink">
        Judul
        <input
          name="title"
          required
          minLength={2}
          maxLength={200}
          defaultValue={article?.title ?? ''}
          className={cn(fieldClass, 'h-11 py-0')}
        />
      </label>
      <label className="block text-sm font-medium text-ink">
        Ringkasan
        <textarea
          name="excerpt"
          maxLength={500}
          rows={2}
          defaultValue={article?.excerpt ?? ''}
          className={fieldClass}
        />
      </label>
      <label className="block text-sm font-medium text-ink">
        Isi artikel
        <textarea
          name="content"
          required
          minLength={20}
          maxLength={50000}
          rows={10}
          defaultValue={article?.content ?? ''}
          className={fieldClass}
        />
      </label>
      {error ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={saving} className={primaryBtn}>
          {saving ? 'Menyimpan...' : 'Simpan draf'}
        </button>
        <button type="button" onClick={onCancel} className={outlineBtn}>
          Batal
        </button>
      </div>
    </form>
  );
}

function ArticleCard({ item, onChanged }: { item: Article; onChanged: () => void }) {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const Icon = statusIcon[item.status];
  const editable = item.status === 'DRAFT' || item.status === 'REJECTED';

  async function act(path: string, method: 'POST' | 'DELETE') {
    setBusy(true);
    setError('');
    try {
      await fetchApi(path, { method });
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Aksi gagal diproses.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="border border-border bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-ink">{item.title}</p>
          <p className="text-sm text-ink-muted">Diperbarui {formatAdminDateTime(item.updatedAt)}</p>
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

      {item.excerpt ? <p className="mt-2 text-base text-ink">{item.excerpt}</p> : null}
      {item.status === 'REJECTED' && item.reviewNote ? (
        <p className="mt-2 border border-destructive p-2 text-sm text-ink">
          Catatan peninjau: {item.reviewNote}
        </p>
      ) : null}

      {editing ? (
        <div className="mt-3 border-t border-border pt-3">
          <ArticleForm
            article={item}
            onCancel={() => setEditing(false)}
            onDone={() => {
              setEditing(false);
              onChanged();
            }}
          />
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          {editable ? (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={() => act(`/partner/articles/${item.id}/submit`, 'POST')}
                className={primaryBtn}
              >
                Ajukan untuk ditinjau
              </button>
              <button type="button" onClick={() => setEditing(true)} className={outlineBtn}>
                Ubah
              </button>
            </>
          ) : null}
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              if (window.confirm(`Hapus artikel "${item.title}"?`)) {
                void act(`/partner/articles/${item.id}`, 'DELETE');
              }
            }}
            className={outlineBtn}
          >
            Hapus
          </button>
        </div>
      )}

      {error ? (
        <p role="alert" className="mt-3 text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </li>
  );
}

export function DoctorArticles() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const params = new URLSearchParams({ page: String(page) });

  if (status) params.set('status', status);

  const {
    data = [],
    meta,
    loading,
    error,
    reload
  } = useApiQuery<Article[]>(`/partner/articles?${params.toString()}`, 0);

  return (
    <div>
      <AdminPageHeader
        eyebrow="Panel dokter"
        title="Artikel"
        description="Tulis artikel kesehatan, lalu ajukan agar ditinjau admin sebelum terbit."
      />

      <div className="mt-6 flex flex-wrap items-end gap-3">
        <label className="block text-sm font-medium text-ink sm:w-64">
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
        {creating ? null : (
          <button type="button" onClick={() => setCreating(true)} className={primaryBtn}>
            Tulis artikel
          </button>
        )}
      </div>

      {creating ? (
        <div className="mt-4 border border-border bg-white p-4">
          <ArticleForm
            onCancel={() => setCreating(false)}
            onDone={() => {
              setCreating(false);
              reload();
            }}
          />
        </div>
      ) : null}

      <div className="mt-4">
        {loading && data.length === 0 ? (
          <AdminTableSkeleton rows={4} columns={3} />
        ) : error ? (
          <AdminErrorState message={error} onRetry={reload} />
        ) : data.length === 0 ? (
          <AdminEmptyState
            title="Belum ada artikel"
            description="Artikel yang Anda tulis akan muncul di sini."
          />
        ) : (
          <ul className="space-y-3">
            {data.map((item) => (
              <ArticleCard key={item.id} item={item} onChanged={reload} />
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
