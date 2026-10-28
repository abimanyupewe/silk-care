'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { AdminArticleStatusBadge } from '@/components/admin/AdminArticleBadges';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { AdminTableSkeleton } from '@/components/admin/AdminSkeleton';
import { AdminEmptyState, AdminErrorState } from '@/components/admin/AdminState';
import {
  AdminApiError,
  adminArticleStatusLabels,
  fetchAdmin,
  type AdminArticle,
  type AdminArticleStatus,
  type AdminPaginationMeta
} from '@/lib/admin-api';
import { formatAdminDate } from '@/lib/admin-format';

export type AdminArticleFilters = {
  q: string;
  status: string;
  deleted: string;
  page: number;
};

export function AdminArticles({ filters }: { filters: AdminArticleFilters }) {
  const router = useRouter();
  const { q, status, deleted, page } = filters;
  const [articles, setArticles] = useState<AdminArticle[]>([]);
  const [meta, setMeta] = useState<AdminPaginationMeta>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [search, setSearch] = useState(q);
  const [articleStatus, setArticleStatus] = useState(status);
  const [visibility, setVisibility] = useState(deleted);

  useEffect(() => {
    setSearch(q);
    setArticleStatus(status);
    setVisibility(deleted);
  }, [q, status, deleted]);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();

    if (q) params.set('q', q);
    if (status) params.set('status', status);
    if (deleted === 'active') params.set('deleted', 'false');
    if (deleted === 'deleted') params.set('deleted', 'true');
    params.set('page', String(page));

    setLoading(true);
    setError('');

    fetchAdmin<AdminArticle[]>(`/admin/articles?${params.toString()}`, {
      signal: controller.signal
    })
      .then((response) => {
        setArticles(response.data);
        setMeta(response.meta as AdminPaginationMeta | undefined);
      })
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === 'AbortError') return;

        if (cause instanceof AdminApiError && cause.status === 401) {
          window.location.href = '/login?callbackUrl=/admin/articles';
          return;
        }

        setError(cause instanceof Error ? cause.message : 'Gagal memuat data artikel.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [q, status, deleted, page, attempt]);

  const applyFilters = (next: {
    search?: string;
    status?: string;
    deleted?: string;
    page?: number;
  }) => {
    const nextSearch = next.search ?? search;
    const nextStatus = next.status ?? articleStatus;
    const nextDeleted = next.deleted ?? visibility;
    const nextPage = next.page ?? 1;
    const params = new URLSearchParams();

    if (nextSearch.trim()) params.set('q', nextSearch.trim());
    if (nextStatus) params.set('status', nextStatus);
    if (nextDeleted) params.set('deleted', nextDeleted);
    if (nextPage > 1) params.set('page', String(nextPage));

    const query = params.toString();
    router.push(query ? `/admin/articles?${query}` : '/admin/articles');
  };

  const resetFilters = () => {
    setSearch('');
    setArticleStatus('');
    setVisibility('');
    router.push('/admin/articles');
  };

  return (
    <div>
      <AdminPageHeader
        eyebrow="Konten"
        title="Artikel"
        description="Moderasi kiriman mitra dan kelola status terbit artikel."
        action={
          <div className="flex gap-2">
            <Link
              href="/admin/articles/new"
              className="inline-flex min-h-11 items-center border border-primary bg-primary px-3 text-sm font-semibold text-white hover:bg-primary-hover"
            >
              Buat artikel
            </Link>
            <button
              type="button"
              onClick={() => setAttempt((value) => value + 1)}
              className="inline-flex min-h-11 items-center border border-border-strong px-3 text-sm font-semibold text-ink hover:border-primary hover:bg-primary-tint"
            >
              Muat ulang
            </button>
          </div>
        }
      />

      <form
        onSubmit={(event) => {
          event.preventDefault();
          applyFilters({ page: 1 });
        }}
        className="mt-6 grid gap-3 border border-border bg-white p-4 md:grid-cols-[1fr_170px_170px_auto] md:items-end"
      >
        <label className="text-sm font-medium text-ink">
          Cari artikel
          <span className="relative mt-1 block">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Judul, slug, atau ringkasan"
              className="h-11 w-full rounded-md border border-border-strong bg-white pl-9 pr-3 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-primary"
            />
          </span>
        </label>

        <label className="text-sm font-medium text-ink">
          Status
          <select
            value={articleStatus}
            onChange={(event) => {
              setArticleStatus(event.target.value);
              applyFilters({ status: event.target.value, page: 1 });
            }}
            className="mt-1 h-11 w-full rounded-md border border-border-strong bg-white px-3 text-sm text-ink outline-none focus:border-primary"
          >
            <option value="">Semua status</option>
            {(Object.keys(adminArticleStatusLabels) as AdminArticleStatus[]).map((value) => (
              <option key={value} value={value}>
                {adminArticleStatusLabels[value]}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-ink">
          Visibilitas
          <select
            value={visibility}
            onChange={(event) => {
              setVisibility(event.target.value);
              applyFilters({ deleted: event.target.value, page: 1 });
            }}
            className="mt-1 h-11 w-full rounded-md border border-border-strong bg-white px-3 text-sm text-ink outline-none focus:border-primary"
          >
            <option value="">Aktif</option>
            <option value="deleted">Dihapus</option>
          </select>
        </label>

        <div className="flex gap-2">
          <button
            type="submit"
            className="inline-flex h-11 items-center rounded-md bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover"
          >
            Terapkan
          </button>
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex h-11 items-center rounded-md border border-border-strong px-4 text-sm font-semibold text-ink hover:border-primary hover:bg-primary-tint"
          >
            Reset
          </button>
        </div>
      </form>

      <p className="mt-4 text-sm text-ink-muted">
        {meta
          ? `${meta.total.toLocaleString('id-ID')} artikel ditemukan`
          : 'Memuat data artikel...'}
      </p>

      <div className="mt-3">
        {loading ? (
          <AdminTableSkeleton rows={7} columns={5} />
        ) : error ? (
          <AdminErrorState message={error} onRetry={() => setAttempt((value) => value + 1)} />
        ) : articles.length === 0 ? (
          <AdminEmptyState
            title="Tidak ada artikel"
            description="Coba ubah kata kunci, status, atau visibilitas artikel."
          />
        ) : (
          <div className="overflow-x-auto border border-border bg-white">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-surface text-xs text-ink-faint">
                  <th className="px-4 py-3 font-medium">Artikel</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Catatan review</th>
                  <th className="px-4 py-3 font-medium">Diperbarui</th>
                  <th className="px-4 py-3 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {articles.map((article) => (
                  <tr key={article.id} className="hover:bg-surface">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-ink">{article.title}</p>
                      <p className="text-xs text-ink-faint">
                        {article.author.name} · {article.slug}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <AdminArticleStatusBadge status={article.status} />
                        {article.deletedAt ? (
                          <span className="text-xs font-semibold text-destructive">Dihapus</span>
                        ) : null}
                      </div>
                    </td>
                    <td className="max-w-xs px-4 py-3 text-ink-muted">
                      <p className="line-clamp-2">{article.reviewNote || '—'}</p>
                    </td>
                    <td className="px-4 py-3 text-ink-muted">
                      {formatAdminDate(article.updatedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/articles/${article.id}`}
                        className="inline-flex min-h-11 items-center rounded-md border border-border-strong px-3 text-sm font-semibold text-primary-hover hover:border-primary hover:bg-primary-tint"
                      >
                        Tinjau
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && !error && meta ? (
        <div className="mt-4">
          <AdminPagination
            basePath="/admin/articles"
            page={meta.page}
            totalPages={meta.totalPages}
            total={meta.total}
            limit={meta.limit}
            query={{ q, status, deleted }}
          />
        </div>
      ) : null}
    </div>
  );
}
