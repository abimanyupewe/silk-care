import type { Metadata } from 'next';
import Link from 'next/link';
import { Stethoscope } from 'lucide-react';
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
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-4 py-12">
      <div className="border border-border bg-white p-6 md:p-8">
        <p className="text-sm font-semibold text-primary-hover">SILK untuk mitra</p>
        <h1 className="mt-2 text-2xl font-bold text-ink md:text-[32px]">Harga langganan mitra</h1>
        <p className="mt-2 max-w-2xl text-base text-ink-muted">
          Direktori SILK menayangkan profil layanan kesehatan Anda. Setiap mitra baru mulai dengan
          masa gratis {TRIAL_MONTHS} bulan — tanpa kartu kredit. Perpanjangan pakai harga di bawah;
          memperpanjang sebelum masa aktif habis menyambung dari sisa masa aktif, bukan mulai dari
          tanggal bayar.
        </p>

        <div className="mt-6">
          <Link
            href="/mitra/daftar"
            className="inline-flex min-h-11 items-center bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-hover"
          >
            Daftar dan coba gratis {TRIAL_MONTHS} bulan
          </Link>
          <p className="mt-2 text-sm text-ink-muted">
            Masa gratis aktif otomatis begitu pendaftaran mitra lengkap.
          </p>
        </div>

        <ul className="mt-8 divide-y divide-border border border-border bg-white">
          {rows.map((row) => (
            <li
              key={row.key}
              className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"
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
                className="inline-flex min-h-11 items-center border border-border-strong px-4 text-sm font-semibold text-ink hover:border-primary hover:bg-primary-tint"
              >
                Daftar sebagai {row.label.toLowerCase()}
              </Link>
            </li>
          ))}
        </ul>

        {!priceSet ? (
          <p className="mt-3 text-sm text-ink-muted">
            Harga per tipe mitra belum ditetapkan admin; angka di atas adalah placeholder
            {DEFAULT_SUBSCRIPTION_DURATION_MONTHS} bulan dan bisa berubah.
          </p>
        ) : null}

        <p className="mt-6 text-sm text-ink-muted">
          Sudah menjadi mitra? Kelola langganan dari panel Anda — menu{' '}
          <span className="font-semibold text-ink">Langganan</span> di sisi kiri, termasuk
          perpanjangan via Duitku.
        </p>
      </div>
    </main>
  );
}
