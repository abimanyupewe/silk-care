'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { fetchApi } from '@/lib/api-client';
import { facilityTypeLabels, facilityTypes } from '@/lib/facility-types';

const fieldClass =
  'mt-2 w-full border border-border-strong bg-white px-3 text-base text-ink outline-none placeholder:text-ink-faint focus:border-primary';

export function FacilityRegisterForm() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const text = (key: string) => String(form.get(key) ?? '').trim() || null;

    setError('');
    setSubmitting(true);
    try {
      await fetchApi('/partner/facility', {
        method: 'POST',
        body: JSON.stringify({
          name: text('name'),
          type: text('type'),
          city: text('city'),
          phone: text('phone'),
          address: text('address'),
          description: text('description')
        })
      });

      // Role akun sudah berubah di DB; layout panel membacanya ulang, jadi cukup pindah.
      router.replace('/dashboard/fasilitas');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Pendaftaran gagal. Coba lagi.');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="facility-name" className="text-sm font-semibold text-ink">
          Nama fasilitas
        </label>
        <input
          id="facility-name"
          name="name"
          required
          minLength={2}
          maxLength={150}
          className={`${fieldClass} h-12`}
        />
      </div>

      <div>
        <label htmlFor="facility-type" className="text-sm font-semibold text-ink">
          Jenis fasilitas
        </label>
        <select
          id="facility-type"
          name="type"
          required
          defaultValue=""
          aria-describedby="facility-type-help"
          className={`${fieldClass} h-12`}
        >
          <option value="" disabled>
            Pilih jenis fasilitas
          </option>
          {facilityTypes.map((value) => (
            <option key={value} value={value}>
              {facilityTypeLabels[value]}
            </option>
          ))}
        </select>
        <p id="facility-type-help" className="mt-1 text-sm text-ink-muted">
          Jenis tidak bisa diubah sendiri setelah mendaftar. Hubungi admin bila salah pilih.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="facility-city" className="text-sm font-semibold text-ink">
            Kota
          </label>
          <input id="facility-city" name="city" maxLength={100} className={`${fieldClass} h-12`} />
        </div>
        <div>
          <label htmlFor="facility-phone" className="text-sm font-semibold text-ink">
            Nomor telepon
          </label>
          <input
            id="facility-phone"
            name="phone"
            type="tel"
            minLength={8}
            maxLength={20}
            className={`${fieldClass} h-12`}
          />
        </div>
      </div>

      <div>
        <label htmlFor="facility-address" className="text-sm font-semibold text-ink">
          Alamat
        </label>
        <textarea
          id="facility-address"
          name="address"
          rows={2}
          maxLength={500}
          className={`${fieldClass} py-2`}
        />
      </div>

      <div>
        <label htmlFor="facility-description" className="text-sm font-semibold text-ink">
          Deskripsi singkat
        </label>
        <textarea
          id="facility-description"
          name="description"
          rows={3}
          maxLength={2000}
          className={`${fieldClass} py-2`}
        />
      </div>

      {error ? (
        <p className="flex items-start gap-2 text-sm text-destructive" aria-live="polite">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex min-h-12 w-full items-center justify-center bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? 'Mengirim...' : 'Daftarkan fasilitas'}
      </button>
    </form>
  );
}
