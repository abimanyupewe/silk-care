'use client';

import Image from 'next/image';
import { BadgeCheck, CalendarDays, ChevronDown, MapPin, Search, Star } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

type Tag = 'verified' | 'open' | 'nearby';

type Clinic = {
  name: string;
  tags: Tag[];
  address: string;
  rating: number;
  reviews: number;
  scheduleAvailable: boolean;
  operatingHours?: string;
  image: string;
};

type SearchDropdownProps = {
  value: string;
  setValue: (value: string) => void;
  options: string[];
  icon?: ReactNode;
};

const clinicData: Clinic[] = [
  {
    name: 'RSUD Dr. Saiful Anwar',
    tags: ['verified', 'nearby', 'open'],
    address: 'Jl. Jaksa Agung Suprapto No. 2, Klojen, Kota Malang',
    rating: 4.9,
    reviews: 96,
    scheduleAvailable: true,
    operatingHours: 'Buka sampai 21.00',
    image: '/assets/home/rumah-sakit/rs1.png'
  },
  {
    name: 'Klinik Sehat Bandulan',
    tags: ['verified', 'nearby', 'open'],
    address: 'Jl. Bandulan, Sukun, Kota Malang',
    rating: 4.8,
    reviews: 71,
    scheduleAvailable: true,
    operatingHours: 'Buka sampai 17.00',
    image: '/assets/home/rumah-sakit/rs2.png'
  },
  {
    name: 'Kimia Farma Klojen',
    tags: ['verified', 'nearby'],
    address: 'Jl. Jaksa Agung Suprapto No. 2, Klojen, Kota Malang',
    rating: 4.7,
    reviews: 54,
    scheduleAvailable: false,
    operatingHours: 'Buka besok 08.00',
    image: '/assets/home/rumah-sakit/rs3.png'
  },
  {
    name: 'Klinik Utama Malang',
    tags: ['verified', 'open'],
    address: 'Jl. Buring No. 12, Kedungkandang, Kota Malang',
    rating: 4.8,
    reviews: 63,
    scheduleAvailable: true,
    operatingHours: 'Buka sampai 20.00',
    image: '/assets/home/rumah-sakit/rs4.png'
  }
];

const SearchDropdown = ({ value, setValue, options, icon }: SearchDropdownProps) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <button className="flex h-12 w-full items-center justify-between rounded-md border border-border-strong bg-white px-3 text-sm font-semibold text-ink focus-visible:border-primary">
        <span className="flex min-w-0 items-center gap-2">
          {icon}
          <span className="truncate">{value}</span>
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-ink-muted" />
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
      {options.map((option) => (
        <DropdownMenuItem key={option} onSelect={() => setValue(option)}>
          {option}
        </DropdownMenuItem>
      ))}
    </DropdownMenuContent>
  </DropdownMenu>
);

export const ClinicSearch = () => {
  const [category, setCategory] = useState('Semua layanan');
  const [service, setService] = useState('Jenis layanan');
  const [sort, setSort] = useState('Urutkan');
  const [location, setLocation] = useState('Malang');

  return (
    <section id="cari-layanan" className="w-full bg-primary-deep py-12 md:py-16">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="mb-6 max-w-3xl">
          <h2 className="text-2xl font-bold text-white md:text-[28px]">
            Cari klinik, rumah sakit, apotek, atau dokter
          </h2>
          <p className="mt-2 text-white/80">
            Gunakan filter untuk menemukan layanan yang sesuai dengan lokasi dan kebutuhan Anda.
          </p>
        </div>
        <div className="grid gap-3 rounded-xl border border-white/20 bg-white p-3 md:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr_auto]">
          <SearchDropdown
            value={category}
            setValue={setCategory}
            options={['Semua layanan', 'Klinik', 'Rumah sakit', 'Apotek', 'Dokter']}
          />
          <SearchDropdown
            value={service}
            setValue={setService}
            options={['Jenis layanan', 'Konsultasi', 'Pemeriksaan', 'Obat']}
          />
          <SearchDropdown
            value={sort}
            setValue={setSort}
            options={['Urutkan', 'Terdekat', 'Rating tertinggi']}
          />
          <SearchDropdown
            value={location}
            setValue={setLocation}
            options={['Malang', 'Surabaya', 'Jakarta']}
            icon={<MapPin className="h-4 w-4 shrink-0 text-primary" />}
          />
          <button className="flex h-12 items-center justify-center gap-2 rounded-md bg-amber px-6 font-semibold text-ink hover:bg-[#e69900]">
            <Search className="h-4 w-4" />
            Cari
          </button>
        </div>
      </div>
    </section>
  );
};

const InfoTag = ({ tag }: { tag: Tag }) => {
  const tags: Record<Tag, { label: string; icon: ReactNode; className: string }> = {
    verified: {
      label: 'Terverifikasi',
      icon: <BadgeCheck className="h-3.5 w-3.5" />,
      className: 'border-primary-hover text-primary-hover'
    },
    open: {
      label: 'Buka',
      icon: <span className="h-2 w-2 bg-success" />,
      className: 'border-success text-success'
    },
    nearby: {
      label: 'Dekat Anda',
      icon: <MapPin className="h-3.5 w-3.5" />,
      className: 'border-border-strong text-ink-muted'
    }
  };
  const item = tags[tag];
  return (
    <span
      className={`inline-flex h-6 items-center gap-1 rounded-md border px-2 text-sm font-semibold ${item.className}`}
    >
      {item.icon}
      {item.label}
    </span>
  );
};

const ClinicCard = ({ clinic }: { clinic: Clinic }) => (
  <article className="rounded-xl border border-border bg-white p-4 hover:border-border-strong">
    <div className="flex gap-4">
      <Image
        src={clinic.image}
        alt={clinic.name}
        width={96}
        height={72}
        className="h-[72px] w-24 shrink-0 rounded-md border border-border object-cover"
      />
      <div className="min-w-0">
        <h3 className="text-lg font-semibold leading-tight text-ink">{clinic.name}</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {clinic.tags.map((tag) => (
            <InfoTag key={tag} tag={tag} />
          ))}
        </div>
      </div>
    </div>
    <p className="mt-4 line-clamp-1 text-sm text-ink-muted">{clinic.address}</p>
    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
      <span className="flex items-center gap-1">
        <Star className="h-4 w-4 fill-amber text-amber" aria-hidden="true" />
        <strong>{clinic.rating.toFixed(1).replace('.', ',')}</strong>{' '}
        <span className="text-ink-muted">({clinic.reviews} ulasan)</span>
      </span>
      {clinic.operatingHours && (
        <span className="flex items-center gap-1 text-ink-muted">
          <CalendarDays className="h-4 w-4 text-primary" />
          {clinic.operatingHours}
        </span>
      )}
    </div>
    <div className="mt-4 flex gap-2">
      {clinic.scheduleAvailable && (
        <button className="flex h-11 flex-1 items-center justify-center gap-2 rounded-md border border-border-strong px-3 text-sm font-semibold hover:border-border-strong hover:bg-surface">
          <CalendarDays className="h-4 w-4" />
          Lihat jadwal
        </button>
      )}
      <button className="h-11 flex-1 rounded-md bg-primary px-3 text-sm font-semibold text-white hover:bg-primary-hover">
        Lihat profil
      </button>
    </div>
  </article>
);

export const RecomendationClinic = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 4;

  return (
    <>
      <ClinicSearch />
      <section className="w-full bg-white py-12 md:py-16">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-ink md:text-[28px]">Rekomendasi terdekat</h2>
            <p className="mt-1 text-ink-muted">
              Layanan kesehatan yang mudah dijangkau dari lokasi Anda.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {clinicData.map((clinic) => (
              <ClinicCard key={clinic.name} clinic={clinic} />
            ))}
          </div>
          <div className="mt-8 flex justify-center gap-2" aria-label="Pagination rekomendasi">
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentPage(index + 1)}
                className={`flex h-11 w-11 items-center justify-center rounded-md border text-sm font-semibold ${currentPage === index + 1 ? 'border-primary bg-primary text-white' : 'border-border-strong bg-white text-ink hover:border-border-strong'}`}
                aria-label={`Halaman ${index + 1}`}
                aria-current={currentPage === index + 1}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};
