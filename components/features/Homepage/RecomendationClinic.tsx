import Link from 'next/link';
import { Building2, ChevronRight, MapPin, Search, Star } from 'lucide-react';
import { SmartImage } from '@/components/shared/SmartImage';
import { facilityTypeLabels, facilityTypes } from '@/lib/facility-types';
import { formatRatingId } from '@/lib/format';
import type { HomeFacility } from '@/lib/home/types';

// Form GET biasa ke /fasilitas: berfungsi tanpa JavaScript. id="cari-layanan" dipakai tautan di
// Hero dan Promo, jadi bagian ini selalu tampil walau belum ada fasilitas.
const FacilitySearch = () => (
  <section id="cari-layanan" className="w-full bg-primary-deep py-12 md:py-16">
    <div className="container mx-auto max-w-7xl px-4">
      <div className="mb-6 max-w-3xl">
        <h2 className="text-2xl font-bold text-white md:text-[28px]">Cari fasilitas kesehatan</h2>
        <p className="mt-2 text-white/80">
          Pilih jenis fasilitas yang Anda butuhkan, lalu telusuri fasilitas mitra SILK.
        </p>
      </div>
      <form
        action="/fasilitas"
        method="get"
        className="grid gap-3 rounded-xl border border-white/20 bg-white p-3 sm:grid-cols-[1fr_auto]"
      >
        <label htmlFor="home-facility-type" className="sr-only">
          Jenis fasilitas
        </label>
        <select
          id="home-facility-type"
          name="type"
          defaultValue=""
          className="h-12 w-full rounded-md border border-border-strong bg-white px-3 text-base text-ink outline-none focus:border-primary"
        >
          <option value="">Semua jenis fasilitas</option>
          {facilityTypes.map((type) => (
            <option key={type} value={type}>
              {facilityTypeLabels[type]}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="flex h-12 items-center justify-center gap-2 rounded-md bg-amber px-6 font-semibold text-ink hover:bg-[#e69900]"
        >
          <Search className="h-4 w-4" aria-hidden="true" />
          Cari
        </button>
      </form>
    </div>
  </section>
);

const FacilityCard = ({ facility }: { facility: HomeFacility }) => (
  <article className="flex flex-col rounded-xl border border-border bg-white p-4 hover:border-border-strong">
    <div className="flex gap-4">
      <div className="relative flex h-[72px] w-24 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-surface">
        {facility.photoUrl ? (
          <SmartImage
            src={facility.photoUrl}
            alt={facility.name}
            fill
            sizes="96px"
            className="object-cover"
          />
        ) : (
          <Building2 className="h-8 w-8 text-ink-faint" aria-label="Tanpa foto" />
        )}
      </div>
      <div className="min-w-0">
        <h3 className="text-lg font-semibold leading-tight text-ink">{facility.name}</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          <span className="inline-flex h-6 items-center rounded-md border border-border-strong px-2 text-sm font-semibold text-ink-muted">
            {facilityTypeLabels[facility.type]}
          </span>
        </div>
      </div>
    </div>

    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
      {facility.city ? (
        <span className="flex items-center gap-1 text-ink-muted">
          <MapPin className="h-4 w-4 text-primary" aria-hidden="true" />
          {facility.city}
        </span>
      ) : null}
      <span className="flex items-center gap-1">
        {facility.rating !== null ? (
          <>
            <Star className="h-4 w-4 fill-amber text-amber" aria-hidden="true" />
            <strong>{formatRatingId(facility.rating)}</strong>
            <span className="text-ink-muted">({facility.reviewCount} ulasan)</span>
          </>
        ) : (
          <span className="text-ink-muted">Belum ada ulasan</span>
        )}
      </span>
    </div>

    <Link
      href={`/fasilitas?type=${facility.type}`}
      className="mt-4 flex h-11 items-center justify-center gap-1 rounded-md border border-border-strong px-3 text-sm font-semibold text-ink hover:bg-surface"
    >
      Lihat fasilitas sejenis
      <ChevronRight className="h-4 w-4" aria-hidden="true" />
    </Link>
  </article>
);

export const RecomendationClinic = ({ facilities }: { facilities: HomeFacility[] }) => (
  <>
    <FacilitySearch />
    {facilities.length > 0 ? (
      <section className="w-full bg-white py-12 md:py-16">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-ink md:text-[28px]">Fasilitas pilihan</h2>
            <p className="mt-1 text-ink-muted">
              Fasilitas mitra dengan penilaian terbaik dari pengguna.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {facilities.map((facility) => (
              <FacilityCard key={facility.slug} facility={facility} />
            ))}
          </div>
        </div>
      </section>
    ) : null}
  </>
);
