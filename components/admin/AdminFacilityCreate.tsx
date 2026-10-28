'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import {
  AdminApiError,
  adminFacilityTypeLabels,
  fetchAdmin,
  type AdminFacility
} from '@/lib/admin-api';

function optionalText(form: FormData, name: string) {
  const value = String(form.get(name) ?? '').trim();

  return value || undefined;
}

export function AdminFacilityCreate() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError('');

    try {
      const response = await fetchAdmin<AdminFacility>('/admin/facilities', {
        method: 'POST',
        body: JSON.stringify({
          owner: {
            name: form.get('ownerName'),
            email: form.get('ownerEmail'),
            phone: optionalText(form, 'ownerPhone'),
            password: form.get('password')
          },
          facility: {
            name: form.get('name'),
            type: form.get('type'),
            description: optionalText(form, 'description'),
            address: optionalText(form, 'address'),
            city: optionalText(form, 'city'),
            phone: optionalText(form, 'phone')
          }
        })
      });
      router.push(`/admin/facilities/${response.data.id}`);
    } catch (cause) {
      if (cause instanceof AdminApiError && cause.status === 401) {
        window.location.href = '/login?callbackUrl=/admin/facilities/new';
        return;
      }
      setError(cause instanceof Error ? cause.message : 'Gagal membuat fasilitas.');
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <Link
        href="/admin/facilities"
        className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-ink-muted hover:text-primary-hover"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Kembali ke daftar fasilitas
      </Link>
      <div className="mt-3 border-b border-border pb-6">
        <p className="text-sm font-semibold text-primary-hover">Verifikasi</p>
        <h1 className="mt-1 text-2xl font-bold text-ink md:text-[32px]">Buat fasilitas / apotek</h1>
        <p className="mt-2 text-ink-muted">
          Membuat akun pemilik dan profil sekaligus. Fasilitas langsung terverifikasi dan email akun
          sudah terverifikasi, jadi pemilik bisa langsung masuk.
        </p>
      </div>
      <form onSubmit={submit} className="mt-6 space-y-8 border border-border bg-white p-5">
        <section className="space-y-5" aria-labelledby="owner-heading">
          <h2 id="owner-heading" className="text-lg font-bold text-ink">
            Akun pemilik
          </h2>
          <fieldset className="fieldset">
            <legend className="fieldset-legend text-ink">Nama pemilik</legend>
            <input
              name="ownerName"
              required
              minLength={2}
              maxLength={100}
              autoComplete="off"
              className="input input-primary h-11 w-full bg-white text-ink"
            />
          </fieldset>
          <fieldset className="fieldset">
            <legend className="fieldset-legend text-ink">Email login</legend>
            <input
              name="ownerEmail"
              type="email"
              required
              autoComplete="off"
              className="input input-primary h-11 w-full bg-white text-ink"
            />
          </fieldset>
          <fieldset className="fieldset">
            <legend className="fieldset-legend text-ink">Telepon pemilik</legend>
            <p className="label text-ink-faint">Opsional</p>
            <input
              name="ownerPhone"
              type="tel"
              minLength={8}
              maxLength={20}
              autoComplete="off"
              className="input input-primary h-11 w-full bg-white text-ink"
            />
          </fieldset>
          <fieldset className="fieldset">
            <legend className="fieldset-legend text-ink">Password awal</legend>
            <p className="label text-ink-faint">8–72 karakter. Sampaikan ke pemilik secara aman.</p>
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
        </section>

        <section
          className="space-y-5 border-t border-border pt-6"
          aria-labelledby="facility-heading"
        >
          <h2 id="facility-heading" className="text-lg font-bold text-ink">
            Profil fasilitas
          </h2>
          <fieldset className="fieldset">
            <legend className="fieldset-legend text-ink">Nama fasilitas</legend>
            <input
              name="name"
              required
              minLength={2}
              maxLength={150}
              autoComplete="off"
              className="input input-primary h-11 w-full bg-white text-ink"
            />
          </fieldset>
          <fieldset className="fieldset">
            <legend className="fieldset-legend text-ink">Tipe</legend>
            <select
              name="type"
              defaultValue="PHARMACY"
              className="select select-primary h-11 w-full bg-white text-ink"
            >
              {Object.entries(adminFacilityTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </fieldset>
          <fieldset className="fieldset">
            <legend className="fieldset-legend text-ink">Kota</legend>
            <p className="label text-ink-faint">Opsional</p>
            <input
              name="city"
              maxLength={100}
              className="input input-primary h-11 w-full bg-white text-ink"
            />
          </fieldset>
          <fieldset className="fieldset">
            <legend className="fieldset-legend text-ink">Alamat</legend>
            <p className="label text-ink-faint">Opsional</p>
            <textarea
              name="address"
              maxLength={500}
              rows={3}
              className="textarea textarea-primary w-full bg-white text-ink"
            />
          </fieldset>
          <fieldset className="fieldset">
            <legend className="fieldset-legend text-ink">Telepon fasilitas</legend>
            <p className="label text-ink-faint">Opsional</p>
            <input
              name="phone"
              type="tel"
              minLength={8}
              maxLength={20}
              className="input input-primary h-11 w-full bg-white text-ink"
            />
          </fieldset>
          <fieldset className="fieldset">
            <legend className="fieldset-legend text-ink">Deskripsi</legend>
            <p className="label text-ink-faint">Opsional</p>
            <textarea
              name="description"
              maxLength={2000}
              rows={4}
              className="textarea textarea-primary w-full bg-white text-ink"
            />
          </fieldset>
        </section>

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
          {pending ? 'Menyimpan...' : 'Buat fasilitas'}
        </button>
      </form>
    </div>
  );
}
