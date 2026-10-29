'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { ArrowLeft, AlertCircle, Eye } from 'lucide-react';
import { AdminModal } from '@/components/admin/AdminModal';
import { AdminApiError, fetchAdmin, type AdminArticle } from '@/lib/admin-api';

export function AdminArticleCreate() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const formRef = useRef<HTMLFormElement>(null);
  const [preview, setPreview] = useState<{
    title: string;
    excerpt: string;
    content: string;
    status: string;
  } | null>(null);

  // Pratinjau membaca isi form saat ini; tidak ada yang disimpan ke server.
  const openPreview = () => {
    if (!formRef.current) return;

    const form = new FormData(formRef.current);

    setPreview({
      title: String(form.get('title') ?? '').trim(),
      excerpt: String(form.get('excerpt') ?? '').trim(),
      content: String(form.get('content') ?? ''),
      status: String(form.get('status') ?? 'DRAFT')
    });
  };

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
      <form
        ref={formRef}
        onSubmit={submit}
        className="mt-6 space-y-5 border border-border bg-white p-5"
      >
        <fieldset className="fieldset">
          <legend className="fieldset-legend text-ink">Judul</legend>
          <input
            name="title"
            required
            minLength={2}
            maxLength={200}
            className="h-11 w-full border border-border-strong bg-white px-3 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-primary"
          />
        </fieldset>
        <fieldset className="fieldset">
          <legend className="fieldset-legend text-ink">Ringkasan</legend>
          <p className="label text-ink-faint">Opsional</p>
          <textarea
            name="excerpt"
            maxLength={500}
            rows={3}
            className="py-2 w-full border border-border-strong bg-white px-3 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-primary"
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
            className="py-2 w-full border border-border-strong bg-white px-3 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-primary"
          />
        </fieldset>
        <fieldset className="fieldset">
          <legend className="fieldset-legend text-ink">Status</legend>
          <select
            name="status"
            defaultValue="DRAFT"
            className="h-11 w-full border border-border-strong bg-white px-3 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-primary"
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
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="submit"
            disabled={pending}
            className="btn btn-primary min-h-11 border border-primary"
          >
            {pending ? 'Menyimpan...' : 'Simpan artikel'}
          </button>
          <button
            type="button"
            onClick={openPreview}
            disabled={pending}
            className="inline-flex min-h-11 items-center justify-center gap-2 border border-border-strong px-4 text-sm font-semibold text-ink hover:border-primary hover:bg-primary-tint disabled:opacity-50"
          >
            <Eye className="h-4 w-4" aria-hidden="true" />
            Pratinjau
          </button>
        </div>
      </form>

      <AdminModal
        open={preview !== null}
        onClose={() => setPreview(null)}
        wide
        title="Pratinjau artikel"
        description="Tampilan perkiraan sebelum disimpan. Belum ada yang tersimpan."
      >
        {preview ? (
          <article>
            <p className="text-sm font-semibold text-primary-hover">
              {preview.status === 'PUBLISHED' ? 'Akan diterbitkan' : 'Draf'}
            </p>
            <h1 className="mt-1 text-2xl font-bold text-ink">
              {preview.title || <span className="text-ink-faint">(Judul kosong)</span>}
            </h1>
            {preview.excerpt ? (
              <p className="mt-3 text-base text-ink-muted">{preview.excerpt}</p>
            ) : null}
            <div className="mt-4 whitespace-pre-wrap border-t border-border pt-4 text-base text-ink">
              {preview.content.trim() || (
                <span className="text-ink-faint">(Isi artikel kosong)</span>
              )}
            </div>
          </article>
        ) : null}
      </AdminModal>
    </div>
  );
}
