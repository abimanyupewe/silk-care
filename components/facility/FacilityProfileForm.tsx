'use client';

import { useState } from 'react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminDetailSkeleton } from '@/components/admin/AdminSkeleton';
import { AdminErrorState } from '@/components/admin/AdminState';
import { fetchApi } from '@/lib/api-client';
import { useApiQuery } from '@/lib/api-swr';
import { cn } from '@/lib/utils';

type Profile = {
  name: string;
  description: string | null;
  address: string | null;
  city: string | null;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
  photoUrl: string | null;
};

type UploadSignature = {
  apiKey: string;
  signature: string;
  timestamp: number;
  folder: string;
  allowedFormats: string;
  uploadPreset: string | null;
  uploadUrl: string;
};

const fieldClass =
  'mt-1 w-full border border-border-strong bg-white px-3 py-2 text-base text-ink outline-none focus:border-primary';

export function FacilityProfileForm() {
  // Tanpa polling: refetch saat mengetik akan menimpa isian yang belum disimpan.
  const profile = useApiQuery<Profile>('/facility/profile', 0);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const facility = profile.data;

  if (profile.loading && !facility) return <AdminDetailSkeleton />;
  if (profile.error) return <AdminErrorState message={profile.error} onRetry={profile.reload} />;
  if (!facility) return null;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const text = (key: string) => String(form.get(key) ?? '').trim() || null;
    const number = (key: string) => {
      const value = text(key);

      return value === null ? null : Number(value);
    };

    setSaving(true);
    setSaved(false);
    setError('');
    try {
      const result = await fetchApi<Profile>('/facility/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          name: text('name'),
          description: text('description'),
          address: text('address'),
          city: text('city'),
          phone: text('phone'),
          latitude: number('latitude'),
          longitude: number('longitude')
        })
      });

      profile.update(result.data);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan profil.');
    } finally {
      setSaving(false);
    }
  }

  // Unggah langsung ke Cloudinary dengan tanda tangan server, lalu simpan URL + publicId.
  async function uploadPhoto(file: File) {
    setUploading(true);
    setPhotoError('');
    try {
      const { data: sig } = await fetchApi<UploadSignature>('/uploads/signature', {
        method: 'POST',
        body: JSON.stringify({ purpose: 'facility-profile-photo' })
      });
      const body = new FormData();

      body.set('file', file);
      body.set('api_key', sig.apiKey);
      body.set('timestamp', String(sig.timestamp));
      body.set('signature', sig.signature);
      body.set('folder', sig.folder);
      body.set('allowed_formats', sig.allowedFormats);
      if (sig.uploadPreset) body.set('upload_preset', sig.uploadPreset);

      const response = await fetch(sig.uploadUrl, { method: 'POST', body });
      const uploaded = (await response.json().catch(() => null)) as {
        secure_url?: string;
        public_id?: string;
        error?: { message?: string };
      } | null;

      if (!response.ok || !uploaded?.secure_url || !uploaded.public_id) {
        throw new Error(uploaded?.error?.message ?? 'Unggahan foto gagal.');
      }

      const result = await fetchApi<Profile>('/facility/profile', {
        method: 'PATCH',
        body: JSON.stringify({ photoUrl: uploaded.secure_url, photoPublicId: uploaded.public_id })
      });

      profile.update(result.data);
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Unggahan foto gagal.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <AdminPageHeader
        eyebrow="Panel fasilitas"
        title="Profil"
        description="Data ini tampil di halaman publik fasilitas Anda."
      />

      <section
        className="mt-6 flex max-w-2xl items-center gap-4 border border-border bg-white p-4"
        aria-label="Foto fasilitas"
      >
        {facility.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={facility.photoUrl}
            alt="Foto fasilitas"
            className="h-24 w-24 shrink-0 border border-border object-cover"
          />
        ) : (
          <div className="flex h-24 w-24 shrink-0 items-center justify-center border border-border bg-surface text-sm text-ink-muted">
            Belum ada
          </div>
        )}
        <div>
          <label className="inline-flex h-11 cursor-pointer items-center border border-border-strong px-4 text-sm font-semibold text-ink hover:border-primary hover:bg-primary-tint">
            {uploading ? 'Mengunggah...' : facility.photoUrl ? 'Ganti foto' : 'Unggah foto'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={uploading}
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];

                event.target.value = '';
                if (file) void uploadPhoto(file);
              }}
            />
          </label>
          <p className="mt-1 text-sm text-ink-muted">JPG, PNG, atau WebP.</p>
          {photoError ? (
            <p role="alert" className="mt-1 text-sm font-medium text-destructive">
              {photoError}
            </p>
          ) : null}
        </div>
      </section>

      <form
        onSubmit={submit}
        className="mt-6 max-w-2xl space-y-4 border border-border bg-white p-4"
      >
        <label className="block text-sm font-medium text-ink">
          Nama fasilitas
          <input
            name="name"
            required
            minLength={2}
            maxLength={150}
            defaultValue={facility.name}
            className={cn(fieldClass, 'h-11 py-0')}
          />
        </label>
        <label className="block text-sm font-medium text-ink">
          Deskripsi
          <textarea
            name="description"
            maxLength={2000}
            rows={4}
            defaultValue={facility.description ?? ''}
            className={fieldClass}
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-ink">
            Kota
            <input
              name="city"
              maxLength={100}
              defaultValue={facility.city ?? ''}
              className={cn(fieldClass, 'h-11 py-0')}
            />
          </label>
          <label className="block text-sm font-medium text-ink">
            Nomor telepon
            <input
              type="tel"
              name="phone"
              minLength={8}
              maxLength={20}
              defaultValue={facility.phone ?? ''}
              className={cn(fieldClass, 'h-11 py-0')}
            />
          </label>
        </div>
        <label className="block text-sm font-medium text-ink">
          Alamat
          <textarea
            name="address"
            maxLength={500}
            rows={2}
            defaultValue={facility.address ?? ''}
            className={fieldClass}
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-ink">
            Latitude
            <input
              type="number"
              name="latitude"
              min={-90}
              max={90}
              step="any"
              defaultValue={facility.latitude ?? ''}
              className={cn(fieldClass, 'h-11 py-0')}
            />
          </label>
          <label className="block text-sm font-medium text-ink">
            Longitude
            <input
              type="number"
              name="longitude"
              min={-180}
              max={180}
              step="any"
              defaultValue={facility.longitude ?? ''}
              className={cn(fieldClass, 'h-11 py-0')}
            />
          </label>
        </div>

        {error ? (
          <p role="alert" className="text-sm font-medium text-destructive">
            {error}
          </p>
        ) : null}
        {saved ? (
          <p role="status" className="text-sm font-medium text-primary-hover">
            Profil tersimpan.
          </p>
        ) : null}

        <button
          type="submit"
          disabled={saving}
          className="inline-flex h-11 items-center bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
        >
          {saving ? 'Menyimpan...' : 'Simpan profil'}
        </button>
      </form>
    </div>
  );
}
