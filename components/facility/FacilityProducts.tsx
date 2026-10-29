'use client';

import { useState } from 'react';
import { CheckCircle2, EyeOff, Plus } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminTableSkeleton } from '@/components/admin/AdminSkeleton';
import { AdminEmptyState, AdminErrorState } from '@/components/admin/AdminState';
import { fetchApi } from '@/lib/api-client';
import { useApiQuery } from '@/lib/api-swr';
import { formatAdminCurrency } from '@/lib/admin-format';
import { cn } from '@/lib/utils';

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  image: string | null;
  category: string | null;
  active: boolean;
};

const fieldClass =
  'mt-1 w-full border border-border-strong bg-white px-3 py-2 text-base text-ink outline-none focus:border-primary';
const primaryBtn =
  'inline-flex h-11 items-center gap-2 bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60';
const outlineBtn =
  'inline-flex h-11 items-center border border-border-strong px-4 text-sm font-semibold text-ink hover:border-primary hover:bg-primary-tint disabled:opacity-60';

function ProductForm({
  product,
  onDone,
  onCancel
}: {
  product?: Product;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const text = (key: string) => String(form.get(key) ?? '').trim() || null;

    setSaving(true);
    setError('');
    try {
      await fetchApi(product ? `/facility/products/${product.id}` : '/facility/products', {
        method: product ? 'PATCH' : 'POST',
        body: JSON.stringify({
          name: text('name'),
          description: text('description'),
          price: Number(form.get('price')),
          stock: Number(form.get('stock')),
          image: text('image'),
          category: text('category'),
          active: form.get('active') === 'on'
        })
      });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan produk.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 border border-border bg-white p-4">
      <label className="block text-sm font-medium text-ink">
        Nama produk
        <input
          name="name"
          required
          minLength={2}
          maxLength={150}
          defaultValue={product?.name ?? ''}
          className={cn(fieldClass, 'h-11 py-0')}
        />
      </label>
      <label className="block text-sm font-medium text-ink">
        Deskripsi
        <textarea
          name="description"
          maxLength={2000}
          rows={3}
          defaultValue={product?.description ?? ''}
          className={fieldClass}
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block text-sm font-medium text-ink">
          Harga (Rp)
          <input
            type="number"
            name="price"
            required
            min={1}
            max={100000000}
            step={1}
            defaultValue={product?.price ?? ''}
            className={cn(fieldClass, 'h-11 py-0')}
          />
        </label>
        <label className="block text-sm font-medium text-ink">
          Stok
          <input
            type="number"
            name="stock"
            required
            min={0}
            max={1000000}
            step={1}
            defaultValue={product?.stock ?? 0}
            className={cn(fieldClass, 'h-11 py-0')}
          />
        </label>
        <label className="block text-sm font-medium text-ink">
          Kategori
          <input
            name="category"
            maxLength={100}
            defaultValue={product?.category ?? ''}
            className={cn(fieldClass, 'h-11 py-0')}
          />
        </label>
      </div>
      <label className="block text-sm font-medium text-ink">
        URL gambar
        <input
          type="url"
          name="image"
          maxLength={500}
          defaultValue={product?.image ?? ''}
          className={cn(fieldClass, 'h-11 py-0')}
        />
      </label>
      <label className="flex min-h-11 items-center gap-2 text-sm font-medium text-ink">
        <input
          type="checkbox"
          name="active"
          defaultChecked={product?.active ?? true}
          className="h-5 w-5"
        />
        Tampilkan di katalog
      </label>
      {error ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={saving} className={primaryBtn}>
          {saving ? 'Menyimpan...' : 'Simpan produk'}
        </button>
        <button type="button" onClick={onCancel} className={outlineBtn}>
          Batal
        </button>
      </div>
    </form>
  );
}

function ProductRow({
  product,
  onChanged,
  onEdit
}: {
  product: Product;
  onChanged: () => void;
  onEdit: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function run(request: () => Promise<unknown>, fallback: string) {
    setBusy(true);
    setError('');
    try {
      await request();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : fallback);
    } finally {
      setBusy(false);
    }
  }

  const toggleActive = () =>
    run(
      () =>
        fetchApi(`/facility/products/${product.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ active: !product.active })
        }),
      'Gagal mengubah status produk.'
    );

  const remove = () =>
    window.confirm(`Hapus "${product.name}"?`) &&
    run(
      () => fetchApi(`/facility/products/${product.id}`, { method: 'DELETE' }),
      'Gagal menghapus produk.'
    );

  const StatusIcon = product.active ? CheckCircle2 : EyeOff;

  return (
    <li className="border border-border bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-ink">{product.name}</p>
          <p className="text-sm text-ink-muted">
            {formatAdminCurrency(product.price)} · Stok {product.stock}
            {product.category ? ` · ${product.category}` : ''}
          </p>
        </div>
        <span
          className={cn(
            'inline-flex min-h-7 items-center gap-1.5 border px-2 text-sm font-medium',
            product.active
              ? 'border-primary bg-primary-tint text-primary-hover'
              : 'border-border-strong bg-white text-ink'
          )}
        >
          <StatusIcon className="h-4 w-4" aria-hidden="true" />
          {product.active ? 'Aktif' : 'Nonaktif'}
        </span>
      </div>
      {product.stock === 0 ? (
        <p className="mt-2 text-sm font-medium text-destructive">Stok habis</p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={onEdit} className={outlineBtn}>
          Edit
        </button>
        <button type="button" disabled={busy} onClick={toggleActive} className={outlineBtn}>
          {product.active ? 'Nonaktifkan' : 'Aktifkan'}
        </button>
        <button type="button" disabled={busy} onClick={remove} className={outlineBtn}>
          Hapus
        </button>
      </div>
      {error ? (
        <p role="alert" className="mt-3 text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </li>
  );
}

export function FacilityProducts() {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  // 'new' = form tambah, string lain = id produk yang sedang diedit.
  const [editing, setEditing] = useState<string | null>(null);
  const params = new URLSearchParams({ page: String(page) });

  if (q.trim()) params.set('q', q.trim());

  const {
    data = [],
    meta,
    loading,
    error,
    reload
  } = useApiQuery<Product[]>(`/facility/products?${params.toString()}`, 0);

  const done = () => {
    setEditing(null);
    reload();
  };

  return (
    <div>
      <AdminPageHeader
        eyebrow="Panel fasilitas"
        title="Produk"
        description="Kelola produk yang dijual di katalog fasilitas Anda."
      />

      <div className="mt-6 flex flex-wrap items-end justify-between gap-3">
        <label className="block text-sm font-medium text-ink sm:w-64">
          Cari produk
          <input
            type="search"
            value={q}
            onChange={(event) => {
              setQ(event.target.value);
              setPage(1);
            }}
            maxLength={100}
            className="mt-1 h-11 w-full border border-border-strong bg-white px-3 text-base text-ink outline-none focus:border-primary"
          />
        </label>
        <button type="button" onClick={() => setEditing('new')} className={primaryBtn}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Tambah produk
        </button>
      </div>

      {editing === 'new' ? (
        <div className="mt-4">
          <ProductForm onDone={done} onCancel={() => setEditing(null)} />
        </div>
      ) : null}

      <div className="mt-4">
        {loading && data.length === 0 ? (
          <AdminTableSkeleton rows={4} columns={3} />
        ) : error ? (
          <AdminErrorState message={error} onRetry={reload} />
        ) : data.length === 0 ? (
          <AdminEmptyState
            title="Belum ada produk"
            description="Tambahkan produk pertama Anda agar tampil di katalog."
          />
        ) : (
          <ul className="space-y-3">
            {data.map((product) =>
              editing === product.id ? (
                <li key={product.id}>
                  <ProductForm product={product} onDone={done} onCancel={() => setEditing(null)} />
                </li>
              ) : (
                <ProductRow
                  key={product.id}
                  product={product}
                  onChanged={reload}
                  onEdit={() => setEditing(product.id)}
                />
              )
            )}
          </ul>
        )}
      </div>

      {meta && meta.totalPages > 1 ? (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className={outlineBtn}
          >
            Sebelumnya
          </button>
          <span className="text-sm text-ink-muted">
            Halaman {meta.page} dari {meta.totalPages}
          </span>
          <button
            type="button"
            disabled={page >= meta.totalPages}
            onClick={() => setPage(page + 1)}
            className={outlineBtn}
          >
            Berikutnya
          </button>
        </div>
      ) : null}
    </div>
  );
}
