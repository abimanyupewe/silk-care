'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AlertCircle, ArrowLeft, CheckCircle2, ExternalLink } from 'lucide-react';
import { AdminConfirmDialog } from '@/components/admin/AdminModal';
import { AdminUserActivity } from '@/components/admin/AdminUserActivity';
import { AdminAccountStatusBadge } from '@/components/admin/AdminAccountStatusBadge';
import { useAdminQuery } from '@/lib/admin-swr';
import { AdminDetailSkeleton } from '@/components/admin/AdminSkeleton';
import { AdminErrorState } from '@/components/admin/AdminState';
import { AdminStatusBadge } from '@/components/admin/AdminStatusBadge';
import {
  AdminApiError,
  adminUserRoleLabels,
  fetchAdmin,
  type AdminUser,
  type AdminUserRole
} from '@/lib/admin-api';
import { formatAdminDateTime } from '@/lib/admin-format';

function DetailItem({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-ink-faint">{label}</dt>
      <dd className="mt-1 text-sm text-ink">{value || '—'}</dd>
    </div>
  );
}

function AdminUserEditForm({
  user,
  onUpdated
}: {
  user: AdminUser;
  onUpdated: (user: AdminUser) => void;
}) {
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone ?? '');
  const [role, setRole] = useState<AdminUserRole>(user.role);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setName(user.name);
    setPhone(user.phone ?? '');
    setRole(user.role);
  }, [user]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();

    if (trimmedName.length < 2) {
      setError('Nama minimal 2 karakter.');
      setSuccess('');
      return;
    }

    if (trimmedPhone && (trimmedPhone.length < 8 || trimmedPhone.length > 20)) {
      setError('Nomor telepon harus 8–20 karakter.');
      setSuccess('');
      return;
    }

    setPending(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetchAdmin<AdminUser>(`/admin/users/${user.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: trimmedName,
          phone: trimmedPhone || null,
          role
        })
      });

      onUpdated(response.data);
      setSuccess('Data pengguna berhasil disimpan.');
    } catch (cause) {
      if (cause instanceof AdminApiError && cause.status === 401) {
        window.location.href = '/login?callbackUrl=/admin/users';
        return;
      }

      setError(cause instanceof Error ? cause.message : 'Gagal menyimpan data pengguna.');
    } finally {
      setPending(false);
    }
  };

  return (
    <section className="border border-border bg-white p-5">
      <h2 className="text-lg font-bold text-ink">Edit data pengguna</h2>
      <p className="mt-1 text-sm text-ink-muted">
        Perubahan peran langsung berlaku setelah disimpan.
      </p>

      <form onSubmit={submit} className="mt-4 space-y-4">
        <label className="block text-sm font-medium text-ink">
          Nama
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={100}
            required
            minLength={2}
            className="mt-1 h-11 w-full border border-border-strong bg-white px-3 text-sm text-ink outline-none focus:border-primary"
          />
        </label>

        <label className="block text-sm font-medium text-ink">
          Telepon
          <input
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            maxLength={20}
            placeholder="Opsional"
            className="mt-1 h-11 w-full border border-border-strong bg-white px-3 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-primary"
          />
        </label>

        <label className="block text-sm font-medium text-ink">
          Peran
          <select
            value={role}
            onChange={(event) => setRole(event.target.value as AdminUserRole)}
            className="mt-1 h-11 w-full border border-border-strong bg-white px-3 text-sm text-ink outline-none focus:border-primary"
          >
            {Object.entries(adminUserRoleLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        {error ? (
          <p className="flex items-start gap-2 text-sm text-destructive" aria-live="polite">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {error}
          </p>
        ) : null}

        {success ? (
          <p className="flex items-start gap-2 text-sm text-primary-hover" aria-live="polite">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {success}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          aria-busy={pending}
          className="inline-flex min-h-11 items-center justify-center bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? 'Menyimpan...' : 'Simpan perubahan'}
        </button>
      </form>
    </section>
  );
}

function AdminUserAccountActions({
  user,
  onUpdated
}: {
  user: AdminUser;
  onUpdated: (user: AdminUser) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState<'delete' | 'restore' | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const active = !user.deletedAt;

  const updateAccount = async (action: 'delete' | 'restore') => {
    setPending(action);
    setError('');
    setSuccess('');

    try {
      const response =
        action === 'delete'
          ? await fetchAdmin<AdminUser>(`/admin/users/${user.id}`, { method: 'DELETE' })
          : await fetchAdmin<AdminUser>(`/admin/users/${user.id}/restore`, { method: 'POST' });

      onUpdated(response.data);
      setConfirming(false);
      setSuccess(
        action === 'delete'
          ? 'Akun berhasil dinonaktifkan.'
          : 'Akun berhasil dipulihkan dan dapat digunakan kembali.'
      );
    } catch (cause) {
      if (cause instanceof AdminApiError && cause.status === 401) {
        window.location.href = '/login?callbackUrl=/admin/users';
        return;
      }

      setError(cause instanceof Error ? cause.message : 'Gagal memperbarui status akun.');
    } finally {
      setPending(null);
      setConfirming(false);
    }
  };

  return (
    <section className="border border-border bg-white p-5">
      <h2 className="text-lg font-bold text-ink">Status akun</h2>
      <p className="mt-1 text-sm text-ink-muted">
        {active
          ? 'Menonaktifkan akun mencabut sesi aktif dan mencegah pengguna masuk kembali. Data tetap tersimpan.'
          : 'Pulihkan akun agar pengguna dapat masuk dan menggunakan layanan kembali.'}
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

      {active ? (
        <>
          <button
            type="button"
            onClick={() => {
              setConfirming(true);
              setError('');
              setSuccess('');
            }}
            className="mt-4 inline-flex min-h-11 items-center border border-destructive px-4 text-sm font-semibold text-destructive hover:bg-surface"
          >
            Nonaktifkan akun
          </button>
          <AdminConfirmDialog
            open={confirming}
            title="Nonaktifkan akun ini?"
            description={`${user.name} (${user.email}) tidak bisa masuk lagi dan sesi aktifnya dicabut. Data tetap tersimpan dan akun bisa dipulihkan.`}
            confirmLabel="Ya, nonaktifkan"
            pendingLabel="Menonaktifkan..."
            pending={pending === 'delete'}
            onConfirm={() => updateAccount('delete')}
            onCancel={() => setConfirming(false)}
          />
        </>
      ) : (
        <button
          type="button"
          onClick={() => updateAccount('restore')}
          disabled={pending !== null}
          aria-busy={pending === 'restore'}
          className="mt-4 inline-flex min-h-11 items-center justify-center bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending === 'restore' ? 'Memulihkan...' : 'Pulihkan akun'}
        </button>
      )}
    </section>
  );
}

export function AdminUserDetail({ id }: { id: string }) {
  const {
    data: user,
    loading,
    error,
    reload,
    update: setUser
  } = useAdminQuery<AdminUser>(`/admin/users/${id}`, 30000);

  if (loading) return <AdminDetailSkeleton />;
  if (error) return <AdminErrorState message={error} onRetry={reload} />;
  if (!user) return null;

  const linkedProfile = user.doctorProfile
    ? {
        href: `/admin/doctors/${user.doctorProfile.id}`,
        label: 'Dokter',
        name: user.doctorProfile.specialty,
        status: user.doctorProfile.verificationStatus
      }
    : user.facility
      ? {
          href: `/admin/facilities/${user.facility.id}`,
          label: 'Fasilitas',
          name: user.facility.name,
          status: user.facility.verificationStatus
        }
      : null;

  return (
    <div>
      <Link
        href="/admin/users"
        className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-ink-muted hover:text-primary-hover"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Kembali ke daftar pengguna
      </Link>

      <div className="mt-3 flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary-hover">Manajemen pengguna</p>
          <h1 className="mt-1 text-2xl font-bold text-ink md:text-[32px]">{user.name}</h1>
          <p className="mt-2 text-ink-muted">
            {user.email} · {adminUserRoleLabels[user.role] ?? user.role}
          </p>
          <p className="mt-1 text-sm text-ink-faint">
            Terdaftar {formatAdminDateTime(user.createdAt)} · Diperbarui{' '}
            {formatAdminDateTime(user.updatedAt)}
          </p>
        </div>
        <AdminAccountStatusBadge active={!user.deletedAt} className="self-start" />
      </div>

      {user.deletedAt ? (
        <p className="mt-4 border border-destructive bg-white p-3 text-sm text-destructive">
          Akun ini sedang nonaktif. Sesi lama sudah dicabut dan pengguna tidak dapat masuk sampai
          akun dipulihkan.
        </p>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <section className="border border-border bg-white p-5">
            <h2 className="text-lg font-bold text-ink">Data akun</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <DetailItem label="Nama" value={user.name} />
              <DetailItem label="Email" value={user.email} />
              <DetailItem label="Telepon" value={user.phone} />
              <DetailItem label="Peran" value={adminUserRoleLabels[user.role] ?? user.role} />
              <DetailItem
                label="Email terverifikasi"
                value={user.emailVerified ? formatAdminDateTime(user.emailVerified) : null}
              />
              <DetailItem
                label="Status akun"
                value={user.deletedAt ? formatAdminDateTime(user.deletedAt) : 'Aktif'}
              />
            </dl>
          </section>

          <section className="border border-border bg-white p-5">
            <h2 className="text-lg font-bold text-ink">Profil mitra</h2>
            {linkedProfile ? (
              <div className="mt-4 flex flex-col gap-3 border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {linkedProfile.label} · {linkedProfile.name}
                  </p>
                  <div className="mt-2">
                    <AdminStatusBadge status={linkedProfile.status} />
                  </div>
                </div>
                <Link
                  href={linkedProfile.href}
                  className="inline-flex min-h-11 items-center gap-2 border border-border-strong px-3 text-sm font-semibold text-primary-hover hover:border-primary hover:bg-primary-tint"
                >
                  Tinjau profil
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            ) : (
              <p className="mt-3 text-sm text-ink-muted">
                Pengguna ini tidak memiliki profil dokter atau fasilitas.
              </p>
            )}
          </section>

          <section className="border border-border bg-white p-5">
            <h2 className="text-lg font-bold text-ink">Media akun</h2>
            {user.image ? (
              <a
                href={user.image}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm text-primary-hover hover:underline"
              >
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                Lihat foto profil
              </a>
            ) : (
              <p className="mt-3 text-sm text-ink-muted">Foto profil belum diunggah.</p>
            )}
          </section>
        </div>

        <div className="space-y-4">
          <AdminUserEditForm user={user} onUpdated={setUser} />
          <AdminUserAccountActions user={user} onUpdated={setUser} />
        </div>
      </div>
      <div className="mt-6">
        <AdminUserActivity userId={user.id} />
      </div>
    </div>
  );
}
