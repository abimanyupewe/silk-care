import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Check, Stethoscope } from 'lucide-react';
import { prisma } from '@/lib/db';
import { facilityTypes, facilityTypeLabels } from '@/lib/facility-types';
import { facilityTypeIcons } from '@/components/shared/PartnerMenu';
import { formatRupiah } from '@/lib/format';
import {
  DEFAULT_SUBSCRIPTION_AMOUNT,
  DEFAULT_SUBSCRIPTION_DURATION_MONTHS,
  TRIAL_MONTHS
} from '@/lib/subscription';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Harga langganan mitra — SILK',
  description: 'Paket dan harga langganan untuk dokter dan fasilitas kesehatan di direktori SILK.'
};

// Harga per tipe mitra dibaca dari SubscriptionPrice; kegagalan baca tidak
// mematikan halaman — baris tanpa harga memakai placeholder sambil memberi catatan.
async function readPrices(): Promise<Record<string, number> | null> {
  try {
    const rows = await prisma.subscriptionPrice.findMany({
      select: { partnerType: true, amount: true }
    });

    return Object.fromEntries(rows.map((row) => [row.partnerType, row.amount]));
  } catch {
    return null;
  }
}

function PriceDisplay({ amount, priceSet }: { amount: number | null; priceSet: boolean }) {
  const value = priceSet && amount != null ? amount : DEFAULT_SUBSCRIPTION_AMOUNT;

  return (
    <p className="text-lg font-bold text-ink">
      {formatRupiah(value)}
      <span className="text-sm font-medium text-ink-muted">
        {' '}
        / {DEFAULT_SUBSCRIPTION_DURATION_MONTHS} bulan
      </span>
    </p>
  );
}

export default async function PartnerPricingPage() {
  const prices = await readPrices();
  const priceSet = prices !== null;

  const rows = [
    {
      key: 'DOCTOR' as const,
      label: 'Dokter',
      href: '/mitra/daftar?type=DOCTOR',
      icon: <Stethoscope className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />,
      amount: prices?.DOCTOR ?? null
    },
    ...facilityTypes.map((type) => ({
      key: type,
      label: facilityTypeLabels[type],
      href: `/mitra/daftar?type=${type}`,
      icon: (() => {
        const Icon = facilityTypeIcons[type];

        return <Icon className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />;
      })(),
      amount: prices?.[type] ?? null
    }))
  ];

  return (
    <main className="min-h-screen bg-surface py-10 md:py-16">
      <div className="mx-auto w-full max-w-5xl px-4">
        <section className="border border-primary-deep bg-primary-deep p-6 text-white md:p-8">
          <p className="text-sm font-semibold text-amber">SILK untuk mitra</p>
          <h1 className="mt-2 max-w-2xl text-3xl font-bold md:text-4xl">
            Tampil di direktori, mulai tanpa biaya
          </h1>
          <p className="mt-3 max-w-2xl text-base text-white/85">
            Profil layanan Anda tampil di katalog SILK. Mitra baru mendapat masa gratis{' '}
            {TRIAL_MONTHS} bulan tanpa kartu kredit.
          </p>
          <ul className="mt-5 grid gap-2 text-sm sm:grid-cols-2">
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-amber" aria-hidden="true" /> Profil layanan publik
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-amber" aria-hidden="true" /> Perpanjangan dari panel
              mitra
            </li>
          </ul>
          <div className="mt-6">
            <Link
              href="/mitra/daftar"
              className="btn min-h-11 rounded-none border-amber bg-amber px-5 text-sm font-semibold text-ink hover:border-white hover:bg-white"
            >
              Pilih jenis layanan <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>

        <section className="border-x border-b border-border bg-white" aria-labelledby="harga-title">
          <div className="border-b border-border p-6 md:flex md:items-end md:justify-between md:gap-6 md:p-8">
            <div>
              <p className="text-sm font-semibold text-primary-hover">Setelah masa gratis</p>
              <h2 id="harga-title" className="mt-1 text-2xl font-bold text-ink">
                Harga langganan per tahun
              </h2>
              <p className="mt-2 max-w-2xl text-base text-ink-muted">
                Perpanjangan sebelum habis menyambung dari sisa masa aktif, bukan mulai dari tanggal
                bayar.
              </p>
            </div>
            <p className="mt-3 text-sm text-ink-muted md:text-right">
              Aktif otomatis setelah pendaftaran selesai.
            </p>
          </div>
          <ul className="divide-y divide-border">
            {rows.map((row) => (
              <li
                key={row.key}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between md:px-8"
              >
                <div className="flex items-center gap-3">
                  {row.icon}
                  <div>
                    <p className="text-base font-semibold text-ink">{row.label}</p>
                    <PriceDisplay amount={row.amount} priceSet={priceSet} />
                  </div>
                </div>
                <Link
                  href={row.href}
                  className="btn min-h-11 rounded-none border-border-strong bg-white px-4 text-sm font-semibold text-ink hover:border-primary hover:bg-primary-tint"
                >
                  Daftar sebagai {row.label.toLowerCase()}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {!priceSet ? (
          <p className="mt-3 text-sm text-ink-muted">
            Harga per tipe mitra belum ditetapkan admin; angka di atas adalah placeholder
            {DEFAULT_SUBSCRIPTION_DURATION_MONTHS} bulan dan bisa berubah.
          </p>
        ) : null}

        <p className="border-x border-b border-border bg-white p-6 text-sm text-ink-muted md:px-8">
          Sudah menjadi mitra? Kelola langganan dari panel Anda — menu{' '}
          <span className="font-semibold text-ink">Langganan</span> di sisi kiri, termasuk
          perpanjangan via Duitku.
        </p>
      </div>
    </main>
  );
}
