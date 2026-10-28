'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Search, Star } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { AdminTableSkeleton } from '@/components/admin/AdminSkeleton';
import { AdminEmptyState, AdminErrorState } from '@/components/admin/AdminState';
import { AdminStatusBadge } from '@/components/admin/AdminStatusBadge';
import {
  AdminApiError,
  adminReviewTargetLabels,
  fetchAdmin,
  type AdminPaginationMeta,
  type AdminReview,
  type AdminReviewTargetType
} from '@/lib/admin-api';
import { formatAdminDate } from '@/lib/admin-format';

export type AdminReviewFilters = {
  q: string;
  status: string;
  targetType: string;
  rating: string;
  isNegative: string;
  page: number;
};

const statusOptions = [
  { value: '', label: 'Semua status' },
  { value: 'PENDING', label: 'Menunggu' },
  { value: 'APPROVED', label: 'Disetujui' },
  { value: 'REJECTED', label: 'Ditolak' }
];

const targetOptions: Array<{ value: string; label: string }> = [
  { value: '', label: 'Semua target' },
  { value: 'doctor', label: 'Dokter' },
  { value: 'facility', label: 'Fasilitas' },
  { value: 'product', label: 'Produk' }
];

function targetName(review: AdminReview) {
  if (review.doctorProfile) return review.doctorProfile.user.name;
  if (review.facility) return review.facility.name;
  if (review.product) return review.product.name;
  return '—';
}

export function AdminReviews({ filters }: { filters: AdminReviewFilters }) {
  const router = useRouter();
  const { q, status, targetType, rating, isNegative, page } = filters;
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [meta, setMeta] = useState<AdminPaginationMeta>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [search, setSearch] = useState(q);
  const [reviewStatus, setReviewStatus] = useState(status);
  const [reviewTarget, setReviewTarget] = useState(targetType);
  const [reviewRating, setReviewRating] = useState(rating);
  const [negative, setNegative] = useState(isNegative);

  useEffect(() => {
    setSearch(q);
    setReviewStatus(status);
    setReviewTarget(targetType);
    setReviewRating(rating);
    setNegative(isNegative);
  }, [q, status, targetType, rating, isNegative]);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();

    if (q) params.set('q', q);
    if (status) params.set('status', status);
    if (targetType) params.set('targetType', targetType);
    if (rating) params.set('rating', rating);
    if (isNegative) params.set('isNegative', isNegative);
    params.set('page', String(page));

    setLoading(true);
    setError('');

    fetchAdmin<AdminReview[]>(`/admin/reviews?${params.toString()}`, {
      signal: controller.signal
    })
      .then((response) => {
        setReviews(response.data);
        setMeta(response.meta as AdminPaginationMeta | undefined);
      })
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === 'AbortError') return;

        if (cause instanceof AdminApiError && cause.status === 401) {
          window.location.href = '/login?callbackUrl=/admin/reviews';
          return;
        }

        setError(cause instanceof Error ? cause.message : 'Gagal memuat data ulasan.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [q, status, targetType, rating, isNegative, page, attempt]);

  const applyFilters = (next: {
    search?: string;
    status?: string;
    targetType?: string;
    rating?: string;
    isNegative?: string;
    page?: number;
  }) => {
    const nextSearch = next.search ?? search;
    const nextStatus = next.status ?? reviewStatus;
    const nextTarget = next.targetType ?? reviewTarget;
    const nextRating = next.rating ?? reviewRating;
    const nextNegative = next.isNegative ?? negative;
    const nextPage = next.page ?? 1;
    const params = new URLSearchParams();

    if (nextSearch.trim()) params.set('q', nextSearch.trim());
    if (nextStatus) params.set('status', nextStatus);
    if (nextTarget) params.set('targetType', nextTarget);
    if (nextRating) params.set('rating', nextRating);
    if (nextNegative) params.set('isNegative', nextNegative);
    if (nextPage > 1) params.set('page', String(nextPage));

    const query = params.toString();
    router.push(query ? `/admin/reviews?${query}` : '/admin/reviews');
  };

  const resetFilters = () => {
    setSearch('');
    setReviewStatus('');
    setReviewTarget('');
    setReviewRating('');
    setNegative('');
    router.push('/admin/reviews');
  };

  return (
    <div>
      <AdminPageHeader
        eyebrow="Moderasi"
        title="Ulasan"
        description="Tinjau ulasan pengguna sebelum ditayangkan di halaman publik."
        action={
          <button
            type="button"
            onClick={() => setAttempt((value) => value + 1)}
            className="inline-flex min-h-11 items-center rounded-md border border-border-strong px-3 text-sm font-semibold text-ink hover:border-primary hover:bg-primary-tint"
          >
            Muat ulang
          </button>
        }
      />

      <form
        onSubmit={(event) => {
          event.preventDefault();
          applyFilters({ page: 1 });
        }}
        className="mt-6 grid gap-3 border border-border bg-white p-4 md:grid-cols-2 xl:grid-cols-[1fr_150px_160px_120px_130px_auto] xl:items-end"
      >
        <label className="text-sm font-medium text-ink">
          Cari ulasan
          <span className="relative mt-1 block">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Komentar, nama, atau email penulis"
              className="h-11 w-full rounded-md border border-border-strong bg-white pl-9 pr-3 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-primary"
            />
          </span>
        </label>

        <label className="text-sm font-medium text-ink">
          Status
          <select
            value={reviewStatus}
            onChange={(event) => {
              setReviewStatus(event.target.value);
              applyFilters({ status: event.target.value, page: 1 });
            }}
            className="mt-1 h-11 w-full rounded-md border border-border-strong bg-white px-3 text-sm text-ink outline-none focus:border-primary"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-ink">
          Target
          <select
            value={reviewTarget}
            onChange={(event) => {
              setReviewTarget(event.target.value);
              applyFilters({ targetType: event.target.value, page: 1 });
            }}
            className="mt-1 h-11 w-full rounded-md border border-border-strong bg-white px-3 text-sm text-ink outline-none focus:border-primary"
          >
            {targetOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-ink">
          Rating
          <select
            value={reviewRating}
            onChange={(event) => {
              setReviewRating(event.target.value);
              applyFilters({ rating: event.target.value, page: 1 });
            }}
            className="mt-1 h-11 w-full rounded-md border border-border-strong bg-white px-3 text-sm text-ink outline-none focus:border-primary"
          >
            <option value="">Semua</option>
            {[5, 4, 3, 2, 1].map((value) => (
              <option key={value} value={value}>
                {value} bintang
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-ink">
          Negatif
          <select
            value={negative}
            onChange={(event) => {
              setNegative(event.target.value);
              applyFilters({ isNegative: event.target.value, page: 1 });
            }}
            className="mt-1 h-11 w-full rounded-md border border-border-strong bg-white px-3 text-sm text-ink outline-none focus:border-primary"
          >
            <option value="">Semua</option>
            <option value="true">Ya</option>
            <option value="false">Tidak</option>
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
        {meta ? `${meta.total.toLocaleString('id-ID')} ulasan ditemukan` : 'Memuat data ulasan...'}
      </p>

      <div className="mt-3">
        {loading ? (
          <AdminTableSkeleton rows={7} columns={7} />
        ) : error ? (
          <AdminErrorState message={error} onRetry={() => setAttempt((value) => value + 1)} />
        ) : reviews.length === 0 ? (
          <AdminEmptyState
            title="Tidak ada ulasan"
            description="Coba ubah kata kunci atau filter moderasi."
          />
        ) : (
          <div className="overflow-x-auto border border-border bg-white">
            <table className="w-full min-w-[980px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-surface text-xs text-ink-faint">
                  <th className="px-4 py-3 font-medium">Penulis</th>
                  <th className="px-4 py-3 font-medium">Rating</th>
                  <th className="px-4 py-3 font-medium">Ulasan</th>
                  <th className="px-4 py-3 font-medium">Target</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Tanggal</th>
                  <th className="px-4 py-3 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reviews.map((review) => (
                  <tr key={review.id} className="hover:bg-surface">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-ink">{review.author.name}</p>
                      <p className="text-xs text-ink-faint">{review.author.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 font-semibold text-ink">
                        <Star className="h-4 w-4 text-amber" aria-hidden="true" />
                        {review.rating} / 5
                      </span>
                    </td>
                    <td className="max-w-xs px-4 py-3">
                      <p className="line-clamp-2 text-ink-muted">
                        {review.comment || 'Tanpa komentar.'}
                      </p>
                      {review.isNegative ? (
                        <span className="mt-1 inline-block text-xs font-semibold text-destructive">
                          Ditandai negatif
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink">{targetName(review)}</p>
                      <p className="text-xs text-ink-faint">
                        {adminReviewTargetLabels[review.targetType as AdminReviewTargetType] ??
                          review.targetType}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <AdminStatusBadge status={review.status} />
                    </td>
                    <td className="px-4 py-3 text-ink-muted">
                      {formatAdminDate(review.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/reviews/${review.id}`}
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
            basePath="/admin/reviews"
            page={meta.page}
            totalPages={meta.totalPages}
            total={meta.total}
            limit={meta.limit}
            query={{ q, status, targetType, rating, isNegative }}
          />
        </div>
      ) : null}
    </div>
  );
}
