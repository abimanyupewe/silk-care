'use client';

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { AdminModal } from '@/components/admin/AdminModal';
import { AdminApiError, fetchAdmin, type AdminUser } from '@/lib/admin-api';

function CreateUserForm({
  onCreated,
  onCancel,
  onBusy
}: {
  onCreated: () => void;
  onCancel: () => void;
  onBusy: (busy: boolean) => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [role, setRole] = useState('PATIENT');

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    setPending(true);
    onBusy(true);
    setError('');

    try {
      await fetchAdmin<AdminUser>('/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          name: form.get('name'),
          email: form.get('email'),
          phone: form.get('phone') || undefined,
          password: form.get('password'),
          role: form.get('role')
        })
      });
      onCreated();
    } catch (cause) {
      if (cause instanceof AdminApiError && cause.status === 401) {
        window.location.href = '/login?callbackUrl=/admin/users';
        return;
      }
      setError(cause instanceof Error ? cause.message : 'Gagal membuat pengguna.');
    } finally {
      setPending(false);
      onBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <fieldset className="fieldset">
        <legend className="fieldset-legend text-ink">Nama</legend>
        <input
          name="name"
          required
          minLength={2}
          maxLength={100}
          autoComplete="off"
          className="h-11 w-full border border-border-strong bg-white px-3 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-primary"
        />
      </fieldset>
      <fieldset className="fieldset">
        <legend className="fieldset-legend text-ink">Email</legend>
        <input
          name="email"
          type="email"
          required
          autoComplete="off"
          className="h-11 w-full border border-border-strong bg-white px-3 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-primary"
        />
      </fieldset>
      <fieldset className="fieldset">
        <legend className="fieldset-legend text-ink">Telepon</legend>
        <p className="label text-ink-faint">Opsional</p>
        <input
          name="phone"
          type="tel"
          minLength={8}
          maxLength={20}
          autoComplete="off"
          className="h-11 w-full border border-border-strong bg-white px-3 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-primary"
        />
      </fieldset>
      <fieldset className="fieldset">
        <legend className="fieldset-legend text-ink">Password awal</legend>
        <p className="label text-ink-faint">8–72 karakter. Sampaikan ke pengguna secara aman.</p>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          maxLength={72}
          autoComplete="new-password"
          className="h-11 w-full border border-border-strong bg-white px-3 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-primary"
        />
      </fieldset>
      <fieldset className="fieldset">
        <legend className="fieldset-legend text-ink">Peran</legend>
        <select
          name="role"
          value={role}
          onChange={(event) => setRole(event.target.value)}
          className="h-11 w-full border border-border-strong bg-white px-3 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-primary"
        >
          <option value="PATIENT">Pasien</option>
          <option value="ADMIN">Admin</option>
        </select>
        {role === 'ADMIN' ? (
          <p className="label text-amber-ink">
            Admin punya akses penuh ke panel ini, termasuk mengelola pengguna lain.
          </p>
        ) : null}
      </fieldset>
      {error ? (
        <p role="alert" className="alert alert-error alert-soft flex gap-2 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : null}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="inline-flex min-h-11 items-center justify-center border border-border-strong px-4 text-sm font-semibold text-ink hover:border-primary hover:bg-primary-tint disabled:opacity-50"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={pending}
          className="btn btn-primary min-h-11 border border-primary"
        >
          {pending ? 'Menyimpan...' : 'Buat pengguna'}
        </button>
      </div>
    </form>
  );
}

export function AdminUserCreateModal({
  open,
  onClose,
  onCreated
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [busy, setBusy] = useState(false);

  return (
    <AdminModal
      open={open}
      onClose={onClose}
      busy={busy}
      title="Tambah pengguna"
      description="Email akun yang dibuat dari sini langsung terverifikasi. Dokter dan fasilitas mendaftar lewat onboarding partner."
    >
      <CreateUserForm onCreated={onCreated} onCancel={onClose} onBusy={setBusy} />
    </AdminModal>
  );
}
