'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, Star } from 'lucide-react';
import { AdminActionPanel } from '@/components/admin/AdminActionPanel';
import { AdminDetailSkeleton } from '@/components/admin/AdminSkeleton';
import { AdminErrorState } from '@/components/admin/AdminState';
import { AdminStatusBadge } from '@/components/admin/AdminStatusBadge';
import {
  AdminApiError,
  adminReviewTargetLabels,
  fetchAdmin,
  type AdminReview
} from '@/lib/admin-api';
import { formatAdminDateTime } from '@/lib/admin-format';

function targetName(review: AdminReview) {
  if (review.doctorProfile) return review.doctorProfile.user.name;
  if (review.facility) return review.facility.name;
  if (review.product) return review.product.name;
  return '—';
}

function targetMeta(review: AdminReview) {
  if (review.doctorProfile) return review.doctorProfile.specialty;
  if (review.facility) return review.facility.name;
  if (review.product) return review.product.facility.name;
  return '—';
}

export function AdminReviewDetail({ id }: { id: string }) {
  const [review, setReview] = useState<AdminReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    setLoading(true);
    setError('');

    fetchAdmin<AdminReview>(`/admin/reviews/${id}`, { signal: controller.signal })
      .then((response) => setReview(response.data))
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === 'AbortError') return;

        if (cause instanceof AdminApiError && cause.status === 401) {
          window.location.href = '/login?callbackUrl=/admin/reviews';
          return;
        }

        setError(cause instanceof Error ? cause.message : 'Gagal memuat detail ulasan.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [id, attempt]);

  if (loading) return <AdminDetailSkeleton />;
  if (error)
    return <AdminErrorState message={error} onRetry={() => setAttempt((value) => value + 1)} />;
  if (!review) return null;

  return (
    <div>
      <Link
        href="/admin/reviews"
        className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-ink-muted hover:text-primary-hover"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Kembali ke daftar ulasan
      </Link>

      <div className="mt-3 flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary-hover">Moderasi ulasan</p>
          <h1 className="mt-1 text-2xl font-bold text-ink md:text-[32px]">{targetName(review)}</h1>
          <p className="mt-2 text-ink-muted">
            {adminReviewTargetLabels[review.targetType] ?? review.targetType} · {targetMeta(review)}
          </p>
          <p className="mt-1 text-sm text-ink-faint">
            Ditulis {formatAdminDateTime(review.createdAt)} oleh {review.author.name}
          </p>
        </div>
        <AdminStatusBadge status={review.status} className="self-start" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <section className="border border-border bg-white p-5">
            <h2 className="text-lg font-bold text-ink">Isi ulasan</h2>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1 text-lg font-bold text-ink">
                <Star className="h-5 w-5 text-amber" aria-hidden="true" />
                {review.rating} / 5
              </span>
              {review.isNegative ? (
                <span className="rounded-md border border-destructive px-2 py-1 text-xs font-semibold text-destructive">
                  Ditandai negatif
                </span>
              ) : null}
            </div>
            <p className="mt-4 whitespace-pre-wrap text-ink">
              {review.comment || 'Ulasan tanpa komentar.'}
            </p>
          </section>

          <section className="border border-border bg-white p-5">
            <h2 className="text-lg font-bold text-ink">Penulis</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-ink-faint">Nama</dt>
                <dd className="mt-1 text-sm text-ink">{review.author.name}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-ink-faint">
                  Email
                </dt>
                <dd className="mt-1 text-sm text-ink">{review.author.email}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-ink-faint">
                  Status akun
                </dt>
                <dd className="mt-1 text-sm text-ink">
                  {review.author.deletedAt ? 'Nonaktif' : 'Aktif'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-ink-faint">
                  Diperbarui
                </dt>
                <dd className="mt-1 text-sm text-ink">{formatAdminDateTime(review.updatedAt)}</dd>
              </div>
            </dl>
          </section>

          {review.moderatedAt ? (
            <section className="border border-border bg-white p-5">
              <h2 className="text-lg font-bold text-ink">Riwayat moderasi</h2>
              <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-ink-faint">
                    Dimoderasi
                  </dt>
                  <dd className="mt-1 text-sm text-ink">
                    {formatAdminDateTime(review.moderatedAt)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-ink-faint">
                    Oleh
                  </dt>
                  <dd className="mt-1 text-sm text-ink">
                    {review.moderatedBy?.name || 'Administrator'}
                  </dd>
                </div>
              </dl>
              <p className="mt-4 text-xs font-medium uppercase tracking-wide text-ink-faint">
                Catatan
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-ink">
                {review.moderationNote || 'Tidak ada catatan.'}
              </p>
            </section>
          ) : null}
        </div>

        <div className="space-y-4">
          <AdminActionPanel
            title="Tindakan moderasi"
            description="Setujui ulasan untuk ditayangkan, atau tolak dengan catatan yang jelas."
            currentStatus={review.status}
            endpoint={`/admin/reviews/${review.id}/moderate`}
            approveStatus="APPROVED"
            rejectStatus="REJECTED"
            noteMaxLength={1000}
            approveLabel="Setujui ulasan"
            rejectLabel="Tolak ulasan"
            onUpdated={() => setAttempt((value) => value + 1)}
          />
        </div>
      </div>
    </div>
  );
}
