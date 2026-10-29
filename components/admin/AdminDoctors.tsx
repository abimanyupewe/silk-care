'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { useAdminQuery } from '@/lib/admin-swr';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { AdminTableSkeleton } from '@/components/admin/AdminSkeleton';
import { AdminEmptyState, AdminErrorState } from '@/components/admin/AdminState';
import { AdminStatusBadge } from '@/components/admin/AdminStatusBadge';
import { type AdminDoctor } from '@/lib/admin-api';
import { formatAdminDate } from '@/lib/admin-format';

export type AdminDoctorFilters = {
  q: string;
  verificationStatus: string;
  page: number;
};

const statusOptions = [
  { value: '', label: 'Semua status' },
  { value: 'PENDING', label: 'Menunggu' },
  { value: 'VERIFIED', label: 'Terverifikasi' },
  { value: 'REJECTED', label: 'Ditolak' }
];

export function AdminDoctors({ filters }: { filters: AdminDoctorFilters }) {
  const router = useRouter();
  const { q, verificationStatus, page } = filters;
  const [search, setSearch] = useState(q);
  const [status, setStatus] = useState(verificationStatus);

  useEffect(() => {
    setSearch(q);
    setStatus(verificationStatus);
  }, [q, verificationStatus]);

  const params = new URLSearchParams();

  if (q) params.set('q', q);
  if (verificationStatus) params.set('verificationStatus', verificationStatus);
  params.set('page', String(page));

  const {
    data: doctors = [],
    meta,
    loading,
    error,
    reload
  } = useAdminQuery<AdminDoctor[]>(`/admin/doctors?${params.toString()}`);

  const applyFilters = (next: { search?: string; status?: string; page?: number }) => {
    const nextSearch = next.search ?? search;
    const nextStatus = next.status ?? status;
    const nextPage = next.page ?? 1;
    const params = new URLSearchParams();

    if (nextSearch.trim()) params.set('q', nextSearch.trim());
    if (nextStatus) params.set('verificationStatus', nextStatus);
    if (nextPage > 1) params.set('page', String(nextPage));

    const query = params.toString();
    router.push(query ? `/admin/doctors?${query}` : '/admin/doctors');
  };

  const resetFilters = () => {
    setSearch('');
    setStatus('');
    router.push('/admin/doctors');
  };

  return (
    <div>
      <AdminPageHeader
        eyebrow="Verifikasi"
        title="Dokter"
        description="Tinjau profil dokter dan tentukan status verifikasi mitra."
      />

      <form
        onSubmit={(event) => {
          event.preventDefault();
          applyFilters({ page: 1 });
        }}
        className="mt-6 flex flex-col gap-3 border border-border bg-white p-4 md:flex-row md:items-end"
      >
        <label className="flex-1 text-sm font-medium text-ink">
          Cari dokter
          <span className="relative mt-1 block">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nama, email, spesialis, atau kota"
              className="h-11 w-full border border-border-strong bg-white pl-9 pr-3 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-primary"
            />
          </span>
        </label>

        <label className="text-sm font-medium text-ink md:w-48">
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

      <div className="mt-4 flex items-center justify-between gap-4">
        <p className="text-sm text-ink-muted">
          {meta
            ? `${meta.total.toLocaleString('id-ID')} dokter ditemukan`
            : 'Memuat data dokter...'}
        </p>
      </div>

      <div className="mt-3">
        {loading ? (
          <AdminTableSkeleton rows={7} columns={6} />
        ) : error ? (
          <AdminErrorState message={error} onRetry={reload} />
        ) : doctors.length === 0 ? (
          <AdminEmptyState
            title="Tidak ada dokter"
            description="Coba ubah kata kunci atau filter status verifikasi."
          />
        ) : (
          <div className="overflow-x-auto border border-border bg-white">
            <table className="w-full min-w-[820px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-surface text-xs text-ink-faint">
                  <th className="px-4 py-3 font-medium">Nama</th>
                  <th className="px-4 py-3 font-medium">Spesialis</th>
                  <th className="px-4 py-3 font-medium">Kota</th>
                  <th className="px-4 py-3 font-medium">Kontak</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Terdaftar</th>
                  <th className="px-4 py-3 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {doctors.map((doctor) => (
                  <tr key={doctor.id} className="hover:bg-surface">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-ink">{doctor.user.name}</p>
                      <p className="text-xs text-ink-faint">{doctor.user.email}</p>
                    </td>
                    <td className="px-4 py-3 text-ink-muted">{doctor.specialty}</td>
                    <td className="px-4 py-3 text-ink-muted">{doctor.city || '—'}</td>
                    <td className="px-4 py-3 text-ink-muted">{doctor.user.phone || '—'}</td>
                    <td className="px-4 py-3">
                      <AdminStatusBadge status={doctor.verificationStatus} />
                    </td>
                    <td className="px-4 py-3 text-ink-muted">
                      {formatAdminDate(doctor.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/doctors/${doctor.id}`}
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
            basePath="/admin/doctors"
            page={meta.page}
            totalPages={meta.totalPages}
            total={meta.total}
            limit={meta.limit}
            query={{ q, verificationStatus }}
          />
        </div>
      ) : null}
    </div>
  );
}
