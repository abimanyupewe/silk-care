'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { useAdminQuery } from '@/lib/admin-swr';
import { AdminFacilityCreateModal } from '@/components/admin/AdminFacilityCreateModal';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { AdminTableSkeleton } from '@/components/admin/AdminSkeleton';
import { AdminEmptyState, AdminErrorState } from '@/components/admin/AdminState';
import { AdminStatusBadge } from '@/components/admin/AdminStatusBadge';
import { adminFacilityTypeLabels, type AdminFacility } from '@/lib/admin-api';
import { formatAdminDate } from '@/lib/admin-format';

export type AdminFacilityFilters = {
  q: string;
  verificationStatus: string;
  type: string;
  page: number;
};

const statusOptions = [
  { value: '', label: 'Semua status' },
  { value: 'PENDING', label: 'Menunggu' },
  { value: 'VERIFIED', label: 'Terverifikasi' },
  { value: 'REJECTED', label: 'Ditolak' }
];

export function AdminFacilities({ filters }: { filters: AdminFacilityFilters }) {
  const router = useRouter();
  const { q, verificationStatus, type, page } = filters;
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState(q);
  const [status, setStatus] = useState(verificationStatus);
  const [facilityType, setFacilityType] = useState(type);

  useEffect(() => {
    setSearch(q);
    setStatus(verificationStatus);
    setFacilityType(type);
  }, [q, verificationStatus, type]);

  const params = new URLSearchParams();

  if (q) params.set('q', q);
  if (verificationStatus) params.set('verificationStatus', verificationStatus);
  if (type) params.set('type', type);
  params.set('page', String(page));

  const {
    data: facilities = [],
    meta,
    loading,
    error,
    reload
  } = useAdminQuery<AdminFacility[]>(`/admin/facilities?${params.toString()}`);

  const applyFilters = (next: {
    search?: string;
    status?: string;
    type?: string;
    page?: number;
  }) => {
    const nextSearch = next.search ?? search;
    const nextStatus = next.status ?? status;
    const nextType = next.type ?? facilityType;
    const nextPage = next.page ?? 1;
    const params = new URLSearchParams();

    if (nextSearch.trim()) params.set('q', nextSearch.trim());
    if (nextStatus) params.set('verificationStatus', nextStatus);
    if (nextType) params.set('type', nextType);
    if (nextPage > 1) params.set('page', String(nextPage));

    const query = params.toString();
    router.push(query ? `/admin/facilities?${query}` : '/admin/facilities');
  };

  const resetFilters = () => {
    setSearch('');
    setStatus('');
    setFacilityType('');
    router.push('/admin/facilities');
  };

  return (
    <div>
      <AdminPageHeader
        eyebrow="Verifikasi"
        title="Fasilitas"
        description="Tinjau data fasilitas kesehatan dan tentukan status verifikasi mitra."
        action={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="btn btn-primary min-h-11 border border-primary"
            >
              Buat fasilitas / apotek
            </button>
          </div>
        }
      />

      <form
        onSubmit={(event) => {
          event.preventDefault();
          applyFilters({ page: 1 });
        }}
        className="mt-6 grid gap-3 border border-border bg-white p-4 md:grid-cols-[1fr_180px_190px_auto] md:items-end"
      >
        <label className="text-sm font-medium text-ink">
          Cari fasilitas
          <span className="relative mt-1 block">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nama, kota, atau email"
              className="h-11 w-full border border-border-strong bg-white pl-9 pr-3 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-primary"
            />
          </span>
        </label>

        <label className="text-sm font-medium text-ink">
          Status
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              applyFilters({ status: event.target.value, page: 1 });
            }}
            className="mt-1 h-11 w-full border border-border-strong bg-white px-3 text-sm text-ink outline-none focus:border-primary"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-ink">
          Tipe
          <select
            value={facilityType}
            onChange={(event) => {
              setFacilityType(event.target.value);
              applyFilters({ type: event.target.value, page: 1 });
            }}
            className="mt-1 h-11 w-full border border-border-strong bg-white px-3 text-sm text-ink outline-none focus:border-primary"
          >
            <option value="">Semua tipe</option>
            {Object.entries(adminFacilityTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <div className="flex gap-2">
          <button
            type="submit"
            className="inline-flex h-11 items-center bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover"
          >
            Terapkan
          </button>
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex h-11 items-center border border-border-strong px-4 text-sm font-semibold text-ink hover:border-primary hover:bg-primary-tint"
          >
            Reset
          </button>
        </div>
      </form>

      <p className="mt-4 text-sm text-ink-muted">
        {meta
          ? `${meta.total.toLocaleString('id-ID')} fasilitas ditemukan`
          : 'Memuat data fasilitas...'}
      </p>

      <div className="mt-3">
        {loading ? (
          <AdminTableSkeleton rows={7} columns={7} />
        ) : error ? (
          <AdminErrorState message={error} onRetry={reload} />
        ) : facilities.length === 0 ? (
          <AdminEmptyState
            title="Tidak ada fasilitas"
            description="Coba ubah kata kunci, tipe, atau filter status verifikasi."
          />
        ) : (
          <div className="overflow-x-auto border border-border bg-white">
            <table className="w-full min-w-[980px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-surface text-xs text-ink-faint">
                  <th className="px-4 py-3 font-medium">Nama</th>
                  <th className="px-4 py-3 font-medium">Tipe</th>
                  <th className="px-4 py-3 font-medium">Kota</th>
                  <th className="px-4 py-3 font-medium">Kontak</th>
                  <th className="px-4 py-3 font-medium">Produk</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Terdaftar</th>
                  <th className="px-4 py-3 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {facilities.map((facility) => (
                  <tr key={facility.id} className="hover:bg-surface">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-ink">{facility.name}</p>
                      <p className="text-xs text-ink-faint">{facility.user.email}</p>
                    </td>
                    <td className="px-4 py-3 text-ink-muted">
                      {adminFacilityTypeLabels[facility.type] ?? facility.type}
                    </td>
                    <td className="px-4 py-3 text-ink-muted">{facility.city || '—'}</td>
                    <td className="px-4 py-3 text-ink-muted">
                      {facility.phone || facility.user.phone || '—'}
                    </td>
                    <td className="px-4 py-3 text-ink-muted">{facility._count.products}</td>
                    <td className="px-4 py-3">
                      <AdminStatusBadge status={facility.verificationStatus} />
                    </td>
                    <td className="px-4 py-3 text-ink-muted">
                      {formatAdminDate(facility.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/facilities/${facility.id}`}
                        className="inline-flex min-h-11 items-center border border-border-strong px-3 text-sm font-semibold text-primary-hover hover:border-primary hover:bg-primary-tint"
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
            basePath="/admin/facilities"
            page={meta.page}
            totalPages={meta.totalPages}
            total={meta.total}
            limit={meta.limit}
            query={{ q, verificationStatus, type }}
          />
        </div>
      ) : null}
      <AdminFacilityCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          setCreateOpen(false);
          reload();
        }}
      />
    </div>
  );
}
