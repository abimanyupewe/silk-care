'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminTableSkeleton } from '@/components/admin/AdminSkeleton';
import { AdminEmptyState, AdminErrorState } from '@/components/admin/AdminState';
import { useApiQuery } from '@/lib/api-swr';
import { formatAdminDate, formatAdminRating } from '@/lib/admin-format';

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  author: { name: string | null };
};

const outlineBtn =
  'inline-flex min-h-11 items-center border border-border-strong px-3 text-sm font-semibold text-ink hover:border-primary hover:bg-primary-tint disabled:opacity-50';

export function FacilityReviews() {
  const [page, setPage] = useState(1);
  const profile = useApiQuery<{ id: string }>('/facility/profile', 0);
  // Path null = tidak fetch sampai id fasilitas diketahui.
  const reviews = useApiQuery<Review[]>(
    profile.data ? `/reviews?targetType=facility&targetId=${profile.data.id}&page=${page}` : null,
    60000
  );
  const { data = [], meta, loading, error, reload } = reviews;
  const average = (meta as { averageRating?: number | null } | undefined)?.averageRating;

  return (
    <div>
      <AdminPageHeader
        eyebrow="Panel fasilitas"
        title="Ulasan"
        description="Ulasan dari pelanggan yang sudah disetujui admin dan tampil di halaman publik."
      />

      <div className="mt-6 inline-flex items-center gap-3 border border-border bg-white p-4">
        <Star className="h-5 w-5 text-amber" aria-hidden="true" />
        <div>
          <p className="text-sm font-medium text-ink-muted">Rating rata-rata</p>
          <p className="text-2xl font-bold text-ink">{formatAdminRating(average)}</p>
        </div>
        <p className="border-l border-border pl-3 text-sm text-ink-muted">
          {(meta?.total ?? 0).toLocaleString('id-ID')} ulasan
        </p>
      </div>

      <div className="mt-4">
        {profile.error ? (
          <AdminErrorState message={profile.error} onRetry={profile.reload} />
        ) : (loading || profile.loading) && data.length === 0 ? (
          <AdminTableSkeleton rows={4} columns={3} />
        ) : error ? (
          <AdminErrorState message={error} onRetry={reload} />
        ) : data.length === 0 ? (
          <AdminEmptyState
            title="Belum ada ulasan"
            description="Ulasan yang sudah disetujui akan muncul di sini."
          />
        ) : (
          <ul className="space-y-3">
            {data.map((review) => (
              <li key={review.id} className="border border-border bg-white p-4">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                  <span className="font-semibold text-ink">
                    {review.author.name || 'Pengguna SILK'}
                  </span>
                  <span className="inline-flex items-center gap-1 font-semibold text-ink">
                    <Star className="h-4 w-4 text-amber" aria-hidden="true" />
                    {review.rating} / 5
                  </span>
                  <span className="text-ink-muted">{formatAdminDate(review.createdAt)}</span>
                </div>
                <p className="mt-2 text-base text-ink">
                  {review.comment || <span className="text-ink-muted">Tanpa komentar.</span>}
                </p>
              </li>
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
