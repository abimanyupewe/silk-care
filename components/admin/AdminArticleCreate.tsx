'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { AdminApiError, fetchAdmin, type AdminArticle } from '@/lib/admin-api';

export function AdminArticleCreate() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError('');

    try {
      const response = await fetchAdmin<AdminArticle>('/admin/articles', {
        method: 'POST',
        body: JSON.stringify({
          title: form.get('title'),
          excerpt: form.get('excerpt') || null,
          content: form.get('content'),
          status: form.get('status')
        })
      });
      router.push(`/admin/articles/${response.data.id}`);
    } catch (cause) {
      if (cause instanceof AdminApiError && cause.status === 401) {
        window.location.href = '/login?callbackUrl=/admin/articles/new';
        return;
      }
      setError(cause instanceof Error ? cause.message : 'Gagal membuat artikel.');
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <Link
        href="/admin/articles"
        className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-ink-muted hover:text-primary-hover"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Kembali ke daftar artikel
      </Link>
      <div className="mt-3 border-b border-border pb-6">
        <p className="text-sm font-semibold text-primary-hover">Konten</p>
        <h1 className="mt-1 text-2xl font-bold text-ink md:text-[32px]">Buat artikel</h1>
        <p className="mt-2 text-ink-muted">Simpan sebagai draf atau terbitkan langsung.</p>
      </div>
      <form onSubmit={submit} className="mt-6 space-y-5 border border-border bg-white p-5">
        <fieldset className="fieldset">
          <legend className="fieldset-legend text-ink">Judul</legend>
          <input
            name="title"
            required
            minLength={2}
            maxLength={200}
            className="input input-primary h-11 w-full bg-white text-ink"
          />
        </fieldset>
        <fieldset className="fieldset">
          <legend className="fieldset-legend text-ink">Ringkasan</legend>
          <p className="label text-ink-faint">Opsional</p>
          <textarea
            name="excerpt"
            maxLength={500}
            rows={3}
            className="textarea textarea-primary w-full bg-white text-ink"
          />
        </fieldset>
        <fieldset className="fieldset">
          <legend className="fieldset-legend text-ink">Isi artikel</legend>
          <textarea
            name="content"
            required
            minLength={20}
            maxLength={50000}
            rows={14}
            className="textarea textarea-primary w-full bg-white text-ink"
          />
        </fieldset>
        <fieldset className="fieldset">
          <legend className="fieldset-legend text-ink">Status</legend>
          <select
            name="status"
            defaultValue="DRAFT"
            className="select select-primary h-11 w-full bg-white text-ink"
          >
            <option value="DRAFT">Simpan sebagai draf</option>
            <option value="PUBLISHED">Terbitkan sekarang</option>
          </select>
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
          {pending ? 'Menyimpan...' : 'Simpan artikel'}
        </button>
      </form>
    </div>
  );
}
