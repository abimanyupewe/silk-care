'use client';

import { useState } from 'react';
import { MapPin, Phone, Star } from 'lucide-react';
import { AdminTableSkeleton } from '@/components/admin/AdminSkeleton';
import { AdminEmptyState, AdminErrorState } from '@/components/admin/AdminState';
import { useApiQuery } from '@/lib/api-swr';
import { facilityTypeLabels, type FacilityTypeValue } from '@/lib/facility-types';

type Facility = {
  id: string;
  name: string;
  type: FacilityTypeValue;
  city: string | null;
  address: string | null;
  phone: string | null;
  photoUrl: string | null;
  rating: number | null;
  reviewCount: number;
};

const outlineBtn =
  'inline-flex h-11 items-center border border-border-strong px-4 text-sm font-semibold text-ink hover:border-primary hover:bg-primary-tint disabled:opacity-60';

// Halaman induk memberi key={type}, jadi page kembali ke 1 setiap filter berganti.
export function FacilityDirectory({ type }: { type?: FacilityTypeValue }) {
  const [page, setPage] = useState(1);
  const params = new URLSearchParams({ page: String(page), limit: '12' });

  if (type) params.set('type', type);

  const {
    data = [],
    meta,
    loading,
    error,
    reload
  } = useApiQuery<Facility[]>(`/facilities?${params.toString()}`, 0);

  if (loading && data.length === 0) return <AdminTableSkeleton rows={4} columns={3} />;
  if (error) return <AdminErrorState message={error} onRetry={reload} />;
  if (data.length === 0) {
    return (
      <AdminEmptyState
        title="Belum ada fasilitas"
        description={
          type
            ? `Belum ada ${facilityTypeLabels[type].toLowerCase()} yang terverifikasi.`
            : 'Fasilitas terverifikasi akan muncul di sini.'
        }
      />
    );
  }

  return (
    <div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((facility) => (
          <li key={facility.id} className="flex gap-4 border border-border bg-white p-4">
            {facility.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={facility.photoUrl}
                alt=""
                className="h-20 w-20 shrink-0 border border-border object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center border border-border bg-surface text-sm text-ink-muted">
                Foto
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium text-primary-hover">
                {facilityTypeLabels[facility.type] ?? facility.type}
              </p>
              <h2 className="font-bold text-ink">{facility.name}</h2>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-muted">
                <Star className="h-4 w-4 shrink-0" aria-hidden="true" />
                {facility.rating != null
                  ? `${facility.rating.toFixed(1)} · ${facility.reviewCount} ulasan`
                  : 'Belum ada ulasan'}
              </p>
              {facility.city ? (
                <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-muted">
                  <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {facility.city}
                </p>
              ) : null}
              {facility.phone ? (
                <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-muted">
                  <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {facility.phone}
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>

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
