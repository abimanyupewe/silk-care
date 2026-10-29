'use client';

import Link from 'next/link';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminDetailSkeleton } from '@/components/admin/AdminSkeleton';
import { AdminErrorState } from '@/components/admin/AdminState';
import { VerificationBanner } from '@/components/panel/VerificationBanner';
import { useApiQuery } from '@/lib/api-swr';

type FacilityProfile = {
  name: string;
  description: string | null;
  address: string | null;
  city: string | null;
  phone: string | null;
  photoUrl: string | null;
  verificationStatus: string;
  operatingHours: Array<{ id: string }>;
};

type Product = { id: string; name: string; stock: number };

const LOW_STOCK = 5;

export function FacilityDashboard() {
  const profile = useApiQuery<FacilityProfile>('/facility/profile', 60000);
  const paid = useApiQuery<unknown[]>('/facility/orders?status=PAID&limit=1', 30000);
  const processing = useApiQuery<unknown[]>('/facility/orders?status=PROCESSING&limit=1', 30000);
  const activeProducts = useApiQuery<unknown[]>('/facility/products?active=true&limit=1', 60000);
  // shortcut: API tanpa filter stok; ambil 100 produk aktif lalu saring di klien, upgrade bila produk aktif >100.
  const products = useApiQuery<Product[]>('/facility/products?active=true&limit=100', 60000);
  const facility = profile.data;
  const lowStock = (products.data ?? [])
    .filter((item) => item.stock <= LOW_STOCK)
    .sort((a, b) => a.stock - b.stock);

  if (profile.loading && !facility) return <AdminDetailSkeleton />;
  if (profile.error) return <AdminErrorState message={profile.error} onRetry={profile.reload} />;
  if (!facility) return null;

  const checklist = [
    { label: 'Deskripsi', done: Boolean(facility.description) },
    { label: 'Alamat', done: Boolean(facility.address) },
    { label: 'Kota', done: Boolean(facility.city) },
    { label: 'Nomor telepon', done: Boolean(facility.phone) },
    { label: 'Foto fasilitas', done: Boolean(facility.photoUrl) },
    { label: 'Jam operasional', done: facility.operatingHours.length > 0 }
  ];
  const remaining = checklist.filter((item) => !item.done).length;

  const cards = [
    {
      label: 'Pesanan baru (dibayar)',
      value: paid.meta?.total,
      href: '/dashboard/fasilitas/pesanan'
    },
    {
      label: 'Sedang diproses',
      value: processing.meta?.total,
      href: '/dashboard/fasilitas/pesanan'
    },
    {
      label: 'Produk aktif',
      value: activeProducts.meta?.total,
      href: '/dashboard/fasilitas/produk'
    },
    {
      label: `Stok menipis (≤ ${LOW_STOCK})`,
      value: products.data ? lowStock.length : undefined,
      href: '/dashboard/fasilitas/produk'
    }
  ];

  return (
    <div>
      <AdminPageHeader
        eyebrow="Panel fasilitas"
        title={facility.name}
        description="Ringkasan pesanan, stok, dan kelengkapan profil fasilitas Anda."
      />

      <div className="mt-6">
        <VerificationBanner status={facility.verificationStatus} />
      </div>

      <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Ringkasan">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="block min-h-11 border border-border bg-white p-4 hover:border-primary"
          >
            <p className="text-sm font-medium text-ink-muted">{card.label}</p>
            <p className="mt-2 text-2xl font-bold text-ink">
              {card.value == null ? '–' : card.value.toLocaleString('id-ID')}
            </p>
          </Link>
        ))}
      </section>

      <section className="mt-6 border border-border bg-white p-4" aria-label="Stok menipis">
        <h2 className="text-lg font-bold text-ink">Stok menipis</h2>
        {lowStock.length === 0 ? (
          <p className="mt-1 text-sm text-ink-muted">Semua produk aktif stoknya aman.</p>
        ) : (
          <ul className="mt-4 divide-y divide-border border-y border-border">
            {lowStock.slice(0, 5).map((item) => (
              <li key={item.id} className="flex min-h-11 items-center gap-3 py-2 text-sm">
                <span className="flex-1 text-ink">{item.name}</span>
                <span
                  className={
                    item.stock === 0 ? 'font-semibold text-destructive' : 'font-semibold text-ink'
                  }
                >
                  {item.stock === 0 ? 'Habis' : `Sisa ${item.stock}`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6 border border-border bg-white p-4" aria-label="Kelengkapan profil">
        <h2 className="text-lg font-bold text-ink">Kelengkapan profil</h2>
        <p className="mt-1 text-sm text-ink-muted">
          {remaining === 0 ? 'Profil Anda sudah lengkap.' : `${remaining} bagian belum dilengkapi.`}
        </p>
        <ul className="mt-4 divide-y divide-border border-y border-border">
          {checklist.map((item) => (
            <li key={item.label} className="flex min-h-11 items-center gap-3 py-2 text-sm">
              {item.done ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 text-amber" aria-hidden="true" />
              )}
              <span className="flex-1 text-ink">{item.label}</span>
              <span className="font-semibold text-ink">
                {item.done ? 'Lengkap' : 'Belum diisi'}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
