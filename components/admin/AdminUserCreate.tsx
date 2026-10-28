'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { AdminApiError, fetchAdmin, type AdminUser } from '@/lib/admin-api';

export function AdminUserCreate() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [role, setRole] = useState('PATIENT');

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError('');

    try {
      const response = await fetchAdmin<AdminUser>('/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          name: form.get('name'),
          email: form.get('email'),
          phone: form.get('phone') || undefined,
          password: form.get('password'),
          role: form.get('role')
        })
      });
      router.push(`/admin/users/${response.data.id}`);
    } catch (cause) {
      if (cause instanceof AdminApiError && cause.status === 401) {
        window.location.href = '/login?callbackUrl=/admin/users/new';
        return;
      }
      setError(cause instanceof Error ? cause.message : 'Gagal membuat pengguna.');
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <Link
        href="/admin/users"
        className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-ink-muted hover:text-primary-hover"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Kembali ke daftar pengguna
      </Link>
      <div className="mt-3 border-b border-border pb-6">
        <p className="text-sm font-semibold text-primary-hover">Manajemen</p>
        <h1 className="mt-1 text-2xl font-bold text-ink md:text-[32px]">Buat pengguna</h1>
        <p className="mt-2 text-ink-muted">
          Email akun yang dibuat dari sini langsung terverifikasi. Dokter dan fasilitas mendaftar
          lewat onboarding partner.
        </p>
      </div>
      <form onSubmit={submit} className="mt-6 space-y-5 border border-border bg-white p-5">
        <fieldset className="fieldset">
          <legend className="fieldset-legend text-ink">Nama</legend>
          <input
            name="name"
            required
            minLength={2}
            maxLength={100}
            autoComplete="off"
            className="input input-primary h-11 w-full bg-white text-ink"
          />
        </fieldset>
        <fieldset className="fieldset">
          <legend className="fieldset-legend text-ink">Email</legend>
          <input
            name="email"
            type="email"
            required
            autoComplete="off"
            className="input input-primary h-11 w-full bg-white text-ink"
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
            className="input input-primary h-11 w-full bg-white text-ink"
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
            className="input input-primary h-11 w-full bg-white text-ink"
          />
        </fieldset>
        <fieldset className="fieldset">
          <legend className="fieldset-legend text-ink">Peran</legend>
          <select
            name="role"
            value={role}
            onChange={(event) => setRole(event.target.value)}
            className="select select-primary h-11 w-full bg-white text-ink"
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
          <p
            role="alert"
            className="alert alert-error alert-soft flex gap-2 text-sm"
            aria-live="polite"
          >
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="btn btn-primary min-h-11 border border-primary"
        >
          {pending ? 'Menyimpan...' : 'Buat pengguna'}
        </button>
      </form>
    </div>
  );
}
