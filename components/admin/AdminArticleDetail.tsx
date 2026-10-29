'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AlertCircle, ArrowLeft, CheckCircle2, ExternalLink } from 'lucide-react';
import { AdminConfirmDialog } from '@/components/admin/AdminModal';
import { AdminActionPanel } from '@/components/admin/AdminActionPanel';
import { AdminArticleStatusBadge } from '@/components/admin/AdminArticleBadges';
import { AdminDetailSkeleton } from '@/components/admin/AdminSkeleton';
import { AdminErrorState } from '@/components/admin/AdminState';
import { AdminApiError, fetchAdmin, type AdminArticle } from '@/lib/admin-api';
import { formatAdminDateTime } from '@/lib/admin-format';

function AdminArticleStatusPanel({
  article,
  onUpdated
}: {
  article: AdminArticle;
  onUpdated: (article: AdminArticle) => void;
}) {
  const [pending, setPending] = useState<'status' | 'delete' | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const nextStatus = article.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';

  const toggleStatus = async () => {
    setPending('status');
    setError('');
    setSuccess('');

    try {
      const response = await fetchAdmin<AdminArticle>(`/admin/articles/${article.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus })
      });

      onUpdated(response.data);
      setSuccess(
        nextStatus === 'PUBLISHED'
          ? 'Artikel berhasil diterbitkan.'
          : 'Artikel berhasil dijadikan draf.'
      );
    } catch (cause) {
      if (cause instanceof AdminApiError && cause.status === 401) {
        window.location.href = '/login?callbackUrl=/admin/articles';
        return;
      }

      setError(cause instanceof Error ? cause.message : 'Gagal memperbarui status artikel.');
    } finally {
      setPending(null);
    }
  };

  const deleteArticle = async () => {
    setPending('delete');
    setError('');
    setSuccess('');

    try {
      const response = await fetchAdmin<{ id: string; deletedAt: string }>(
        `/admin/articles/${article.id}`,
        { method: 'DELETE' }
      );

      onUpdated({ ...article, status: 'DRAFT', deletedAt: response.data.deletedAt });
      setConfirming(false);
      setSuccess('Artikel berhasil dihapus dan dapat dipulihkan dari filter Dihapus.');
    } catch (cause) {
      if (cause instanceof AdminApiError && cause.status === 401) {
        window.location.href = '/login?callbackUrl=/admin/articles';
        return;
      }

      setError(cause instanceof Error ? cause.message : 'Gagal menghapus artikel.');
    } finally {
      setPending(null);
      setConfirming(false);
    }
  };

  return (
    <section className="border border-border bg-white p-5">
      <h2 className="text-lg font-bold text-ink">Kelola artikel</h2>
      <p className="mt-1 text-sm text-ink-muted">
        Terbitkan atau tarik artikel dari halaman publik. Artikel yang dihapus dapat dipulihkan.
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

      <div className="mt-4 flex flex-col gap-2">
        <button
          type="button"
          onClick={toggleStatus}
          disabled={pending !== null}
          aria-busy={pending === 'status'}
          className="inline-flex min-h-11 items-center justify-center bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending === 'status'
            ? 'Menyimpan...'
            : nextStatus === 'PUBLISHED'
              ? 'Terbitkan artikel'
              : 'Jadikan draf'}
        </button>

        <button
          type="button"
          onClick={() => {
            setConfirming(true);
            setError('');
            setSuccess('');
          }}
          className="inline-flex min-h-11 items-center justify-center border border-destructive px-4 text-sm font-semibold text-destructive hover:bg-surface"
        >
          Hapus artikel
        </button>
        <AdminConfirmDialog
          open={confirming}
          title="Hapus artikel ini?"
          description="Artikel disembunyikan dari halaman publik. Anda masih bisa memulihkannya dari filter Dihapus."
          confirmLabel="Ya, hapus"
          pendingLabel="Menghapus..."
          pending={pending === 'delete'}
          onConfirm={deleteArticle}
          onCancel={() => setConfirming(false)}
        />
      </div>
    </section>
  );
}

function AdminArticleRestorePanel({
  article,
  onUpdated
}: {
  article: AdminArticle;
  onUpdated: (article: AdminArticle) => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  const restore = async () => {
    setPending(true);
    setError('');

    try {
      const response = await fetchAdmin<AdminArticle>(`/admin/articles/${article.id}/restore`, {
        method: 'POST'
      });
      onUpdated(response.data);
    } catch (cause) {
      if (cause instanceof AdminApiError && cause.status === 401) {
        window.location.href = '/login?callbackUrl=/admin/articles';
        return;
      }

      setError(cause instanceof Error ? cause.message : 'Gagal memulihkan artikel.');
    } finally {
      setPending(false);
    }
  };

  return (
    <section className="border border-destructive bg-white p-5">
      <h2 className="text-lg font-bold text-ink">Artikel dihapus</h2>
      <p className="mt-1 text-sm text-ink-muted">
        Pulihkan artikel untuk mengembalikannya sebagai draf yang dapat diedit dan diterbitkan lagi.
      </p>
      {error ? (
        <p className="mt-3 flex items-start gap-2 text-sm text-destructive" aria-live="polite">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : null}
      <button
        type="button"
        onClick={restore}
        disabled={pending}
        aria-busy={pending}
        className="mt-4 inline-flex min-h-11 items-center justify-center bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? 'Memulihkan...' : 'Pulihkan artikel'}
      </button>
    </section>
  );
}

export function AdminArticleDetail({ id }: { id: string }) {
  const [article, setArticle] = useState<AdminArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    setLoading(true);
    setError('');

    fetchAdmin<AdminArticle>(`/admin/articles/${id}`, { signal: controller.signal })
      .then((response) => setArticle(response.data))
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === 'AbortError') return;

        if (cause instanceof AdminApiError && cause.status === 401) {
          window.location.href = '/login?callbackUrl=/admin/articles';
          return;
        }

        setError(cause instanceof Error ? cause.message : 'Gagal memuat detail artikel.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [id, attempt]);

  if (loading) return <AdminDetailSkeleton />;
  if (error)
    return <AdminErrorState message={error} onRetry={() => setAttempt((value) => value + 1)} />;
  if (!article) return null;

  return (
    <div>
      <Link
        href="/admin/articles"
        className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-ink-muted hover:text-primary-hover"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Kembali ke daftar artikel
      </Link>

      <div className="mt-3 flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary-hover">Manajemen artikel</p>
          <h1 className="mt-1 text-2xl font-bold text-ink md:text-[32px]">{article.title}</h1>
          <p className="mt-2 text-ink-muted">
            {article.author.name} · {article.author.email}
          </p>
          <p className="mt-1 text-sm text-ink-faint">
            Diperbarui {formatAdminDateTime(article.updatedAt)}
          </p>
        </div>
        <AdminArticleStatusBadge status={article.status} className="self-start" />
      </div>

      {article.deletedAt ? (
        <p className="mt-4 border border-destructive bg-white p-3 text-sm text-destructive">
          Artikel ini sudah dihapus pada {formatAdminDateTime(article.deletedAt)}.
        </p>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <section className="border border-border bg-white p-5">
            <h2 className="text-lg font-bold text-ink">Ringkasan</h2>
            <p className="mt-3 text-sm text-ink-muted">{article.excerpt || 'Tanpa ringkasan.'}</p>
            <p className="mt-3 text-xs text-ink-faint">Slug: {article.slug}</p>
            <div className="mt-4 border-t border-border pt-4">
              <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">
                Isi artikel
              </p>
              <div className="mt-2 max-h-96 overflow-y-auto whitespace-pre-wrap border border-border bg-surface p-4 text-sm text-ink">
                {article.content}
              </div>
            </div>
          </section>

          <section className="border border-border bg-white p-5">
            <h2 className="text-lg font-bold text-ink">Review</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-ink-faint">
                  Status
                </dt>
                <dd className="mt-1 text-sm text-ink">
                  <AdminArticleStatusBadge status={article.status} />
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-ink-faint">
                  Direview
                </dt>
                <dd className="mt-1 text-sm text-ink">
                  {article.reviewedAt ? formatAdminDateTime(article.reviewedAt) : '—'}
                </dd>
              </div>
            </dl>
            <p className="mt-4 text-xs font-medium uppercase tracking-wide text-ink-faint">
              Catatan review
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-ink">
              {article.reviewNote || 'Tidak ada catatan review.'}
            </p>
          </section>

          <section className="border border-border bg-white p-5">
            <h2 className="text-lg font-bold text-ink">Media</h2>
            {article.coverImage ? (
              <a
                href={article.coverImage}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm text-primary-hover hover:underline"
              >
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                Lihat gambar sampul
              </a>
            ) : (
              <p className="mt-3 text-sm text-ink-muted">Gambar sampul belum diunggah.</p>
            )}
          </section>
        </div>

        <div className="space-y-4">
          {article.deletedAt ? (
            <AdminArticleRestorePanel article={article} onUpdated={setArticle} />
          ) : article.status === 'PENDING' ? (
            <AdminActionPanel
              title="Moderasi artikel"
              description="Setujui untuk menerbitkan artikel, atau tolak dengan catatan yang jelas."
              currentStatus={article.status}
              endpoint={`/admin/articles/${article.id}/moderate`}
              approveStatus="PUBLISHED"
              rejectStatus="REJECTED"
              noteMaxLength={1000}
              approveLabel="Setujui & terbitkan"
              rejectLabel="Tolak artikel"
              method="POST"
              onUpdated={() => setAttempt((value) => value + 1)}
            />
          ) : (
            <AdminArticleStatusPanel article={article} onUpdated={setArticle} />
          )}
        </div>
      </div>
    </div>
  );
}
