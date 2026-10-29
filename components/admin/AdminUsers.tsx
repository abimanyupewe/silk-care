'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { AdminAccountStatusBadge } from '@/components/admin/AdminAccountStatusBadge';
import { useAdminQuery } from '@/lib/admin-swr';
import { AdminUserCreateModal } from '@/components/admin/AdminUserCreateModal';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { AdminTableSkeleton } from '@/components/admin/AdminSkeleton';
import { AdminEmptyState, AdminErrorState } from '@/components/admin/AdminState';
import { adminUserRoleLabels, type AdminUser, type AdminUserRole } from '@/lib/admin-api';
import { formatAdminDate } from '@/lib/admin-format';

export type AdminUserFilters = {
  q: string;
  role: string;
  status: string;
  page: number;
};

const statusOptions = [
  { value: '', label: 'Semua status' },
  { value: 'active', label: 'Aktif' },
  { value: 'deleted', label: 'Nonaktif' }
];

export function AdminUsers({ filters }: { filters: AdminUserFilters }) {
  const router = useRouter();
  const { q, role, status, page } = filters;
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState(q);
  const [userRole, setUserRole] = useState(role);
  const [accountStatus, setAccountStatus] = useState(status);

  useEffect(() => {
    setSearch(q);
    setUserRole(role);
    setAccountStatus(status);
  }, [q, role, status]);

  const params = new URLSearchParams();

  if (q) params.set('q', q);
  if (role) params.set('role', role);
  if (status === 'active') params.set('deleted', 'false');
  if (status === 'deleted') params.set('deleted', 'true');
  params.set('page', String(page));

  const {
    data: users = [],
    meta,
    loading,
    error,
    reload
  } = useAdminQuery<AdminUser[]>(`/admin/users?${params.toString()}`);

  const applyFilters = (next: {
    search?: string;
    role?: string;
    status?: string;
    page?: number;
  }) => {
    const nextSearch = next.search ?? search;
    const nextRole = next.role ?? userRole;
    const nextStatus = next.status ?? accountStatus;
    const nextPage = next.page ?? 1;
    const params = new URLSearchParams();

    if (nextSearch.trim()) params.set('q', nextSearch.trim());
    if (nextRole) params.set('role', nextRole);
    if (nextStatus) params.set('status', nextStatus);
    if (nextPage > 1) params.set('page', String(nextPage));

    const query = params.toString();
    router.push(query ? `/admin/users?${query}` : '/admin/users');
  };

  const resetFilters = () => {
    setSearch('');
    setUserRole('');
    setAccountStatus('');
    router.push('/admin/users');
  };

  return (
    <div>
      <AdminPageHeader
        eyebrow="Manajemen"
        title="Pengguna"
        description="Cari akun, periksa peran, dan kelola status aktif pengguna."
        action={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="btn btn-primary min-h-11 border border-primary"
            >
              Buat pengguna
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
          Cari pengguna
          <span className="relative mt-1 block">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nama, email, atau telepon"
              className="h-11 w-full border border-border-strong bg-white pl-9 pr-3 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-primary"
            />
          </span>
        </label>

        <label className="text-sm font-medium text-ink">
          Peran
          <select
            value={userRole}
            onChange={(event) => {
              setUserRole(event.target.value);
              applyFilters({ role: event.target.value, page: 1 });
            }}
            className="mt-1 h-11 w-full border border-border-strong bg-white px-3 text-sm text-ink outline-none focus:border-primary"
          >
            <option value="">Semua peran</option>
            {Object.entries(adminUserRoleLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-ink">
          Status akun
          <select
            value={accountStatus}
            onChange={(event) => {
              setAccountStatus(event.target.value);
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

      <p className="mt-4 text-sm text-ink-muted">
        {meta
          ? `${meta.total.toLocaleString('id-ID')} pengguna ditemukan`
          : 'Memuat data pengguna...'}
      </p>

      <div className="mt-3">
        {loading ? (
          <AdminTableSkeleton rows={7} columns={6} />
        ) : error ? (
          <AdminErrorState message={error} onRetry={reload} />
        ) : users.length === 0 ? (
          <AdminEmptyState
            title="Tidak ada pengguna"
            description="Coba ubah kata kunci, peran, atau status akun."
          />
        ) : (
          <div className="overflow-x-auto border border-border bg-white">
            <table className="w-full min-w-[880px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-surface text-xs text-ink-faint">
                  <th className="px-4 py-3 font-medium">Pengguna</th>
                  <th className="px-4 py-3 font-medium">Peran</th>
                  <th className="px-4 py-3 font-medium">Telepon</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Terdaftar</th>
                  <th className="px-4 py-3 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-surface">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-ink">{user.name}</p>
                      <p className="text-xs text-ink-faint">{user.email}</p>
                    </td>
                    <td className="px-4 py-3 text-ink-muted">
                      {adminUserRoleLabels[user.role as AdminUserRole] ?? user.role}
                    </td>
                    <td className="px-4 py-3 text-ink-muted">{user.phone || '—'}</td>
                    <td className="px-4 py-3">
                      <AdminAccountStatusBadge active={!user.deletedAt} />
                    </td>
                    <td className="px-4 py-3 text-ink-muted">{formatAdminDate(user.createdAt)}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="inline-flex min-h-11 items-center border border-border-strong px-3 text-sm font-semibold text-primary-hover hover:border-primary hover:bg-primary-tint"
                      >
                        Kelola
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
            basePath="/admin/users"
            page={meta.page}
            totalPages={meta.totalPages}
            total={meta.total}
            limit={meta.limit}
            query={{ q, role, status }}
          />
        </div>
      ) : null}
      <AdminUserCreateModal
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
