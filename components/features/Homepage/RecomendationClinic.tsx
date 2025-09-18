'use client';

import { useState } from 'react';
import { Star, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChevronDown, MapPin, Search } from 'lucide-react';
import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import Image from 'next/image';

type Tag = {
  text: string;
  color: 'blue' | 'pink' | 'purple' | 'teal' | 'gray' | 'green';
};

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
  icon?: React.ReactNode;
};

const clinicData: Clinic[] = [
  {
    name: 'RSUD DR. Saiful anwar',
    tags: [
      { text: 'Rumah Sakit Umum', color: 'blue' },
      { text: 'Dekat Anda', color: 'gray' },
      { text: 'BPJS', color: 'green' }
    ],
    address: 'Jl. Jaksa Agung Suprapto No.2, Klojen, Kec. Klojen, Kota Malang, Jawa Timur 65112',
    rating: 4.9,
    reviews: 96,
    scheduleAvailable: true,
    image: '/assets/home/rumah-sakit/rs1.png'
  },
  {
    name: 'Dr. Subandi, M.KES, DHAK., PAK',
    tags: [
      { text: 'Dokter Umum', color: 'pink' },
      { text: 'Dekat Anda', color: 'gray' },
      { text: 'Buka', color: 'teal' }
    ],
    address: 'Jl. Bandulan, Bandulan, Kec. Sukun, Kota Malang, Jawa Timur 65146',
    rating: 4.9,
    reviews: 96,
    scheduleAvailable: true,
    operatingHours: '08.00 - 17.00',
    image: '/assets/home/rumah-sakit/rs2.png'
  },
  {
    name: 'Kimia Farma',
    tags: [
      { text: 'Umum', color: 'blue' },
      { text: 'Dekat Anda', color: 'gray' },
      { text: 'Buka', color: 'teal' }
    ],
    address: 'Jl. Jaksa Agung Suprapto No.2, Klojen, Kec. Klojen, Kota Malang, Jawa Timur 65112',
    rating: 4.9,
    reviews: 96,
    scheduleAvailable: false,
    image: '/assets/home/rumah-sakit/rs3.png'
  },
  {
    name: 'RSUD DR. Saiful anwar',
    tags: [
      { text: 'Rumah Sakit Swasta', color: 'blue' },
      { text: 'Dekat Anda', color: 'gray' },
      { text: 'BPJS', color: 'green' }
    ],
    address: 'Jl. Jaksa Agung Suprapto No.2, Klojen, Kec. Klojen, Kota Malang, Jawa Timur 65112',
    rating: 4.9,
    reviews: 96,
    scheduleAvailable: true,
    image: '/assets/home/rumah-sakit/rs4.png'
  }
];

const SearchDropdown = ({ value, setValue, options, icon }: SearchDropdownProps) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <button className="flex items-center justify-between w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#00A991]">
        <div className="flex items-center gap-2">
          {icon}
          <span className="truncate">{value}</span>
        </div>
        <ChevronDown className="h-4 w-4 text-gray-500 flex-shrink-0" />
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
  const [category, setCategory] = useState('All');
  const [option1, setOption1] = useState('Pilih');
  const [option2, setOption2] = useState('Pilih');
  const [location, setLocation] = useState('Jl. Talunggung');

  return (
    <section className="w-full py-10 bg-[#FAFAFA]">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="text-start mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Temukan Klinik, Rumah Sakit, Apotek dan Dokter didekat anda
          </h1>
          <p className="mt-2 text-gray-600 max-w-2xl">
            Cari klinik, rumah sakit, atau apotek di sekitar Anda secara cepat, lengkap dengan
            informasi alamat, jam operasional, hingga kontak.
          </p>
        </div>

        <div className="bg-white p-4 mx-auto rounded-lg border-[1px] border-slate-200">
          <div className="flex flex-row justify-between items-center">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-center">
              <div className="md:col-span-1">
                <SearchDropdown
                  value={category}
                  setValue={setCategory}
                  options={['All', 'Klinik', 'Rumah Sakit', 'Apotek', 'Dokter']}
                />
              </div>
              <div className="md:col-span-1">
                <SearchDropdown
                  value={option1}
                  setValue={setOption1}
                  options={['Pilih', 'Opsi A', 'Opsi B']}
                />
              </div>
              <div className="md:col-span-1">
                <SearchDropdown
                  value={option2}
                  setValue={setOption2}
                  options={['Pilih', 'Opsi C', 'Opsi D']}
                />
              </div>
              <div className="md:col-span-1">
                <SearchDropdown
                  value={location}
                  setValue={setLocation}
                  options={['Jl. Talunggung', 'Malang', 'Surabaya', 'Jakarta']}
                  icon={<MapPin className="h-4 w-4 text-gray-400" />}
                />
              </div>
            </div>
            <button className="md:col-span-1 w-fit flex items-center justify-center gap-2 px-8 py-2 text-sm font-semibold bg-[#00A991] text-white rounded-lg hover:bg-opacity-90 transition">
              <Search className="h-4 w-4" />
              Cari
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
const InfoTag = ({ text, color }: Tag) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-800',
    pink: 'bg-pink-100 text-pink-800',
    purple: 'bg-purple-100 text-purple-800',
    teal: 'bg-teal-100 text-teal-800',
    gray: 'bg-slate-100 text-slate-800',
    green: 'bg-green-100 text-green-800'
  };
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded ${colorClasses[color]}`}>{text}</span>
  );
};

const ClinicCard = ({ clinic }: { clinic: (typeof clinicData)[0] }) => (
  <div className="bg-white p-4 flex flex-col gap-3">
    {/* Bagian Atas: Gambar + Nama */}
    <div className="flex items-start gap-4">
      {/* Image Placeholder */}
      <div className="relative w-20 h-20 rounded-lg flex-shrink-0 overflow-hidden">
        <Image src={clinic.image} alt={clinic.name} className="object-cover" fill priority />
      </div>
      <div className="flex flex-col justify-start gap-3">
        <div className="flex-grow">
          <h2 className="font-bold text-gray-900 text-base leading-tight">{clinic.name}</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {clinic.tags.map((tag) => (
            <InfoTag key={tag.text} {...tag} />
          ))}
        </div>
      </div>
    </div>

    <div className="flex flex-col gap-3">
      <p className="text-xs text-gray-500">{clinic.address}</p>
      <div className="flex items-center gap-2 text-sm">
        <div className="flex flex-row gap-2 justify-start items-center">
          <Star className="w-4 h-4 text-yellow-400 fill-current" />
          <p className="font-semibold">{clinic.rating} </p>
          {clinic.operatingHours && (
            <p className="text-sm text-gray-700 font-medium mt-1">{clinic.operatingHours}</p>
          )}
        </div>
        <p className="text-gray-500">({clinic.reviews} reviews)</p>
      </div>

      <div className="mt-1 flex gap-2">
        {clinic.scheduleAvailable && (
          <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold bg-slate-50 text-gray-700 rounded-lg hover:bg-slate-100 transition">
            <Calendar className="w-4 h-4" />
            Atur Jadwal
          </button>
        )}
        <button className="flex-1 px-3 py-2 text-sm font-semibold bg-[#00A991] text-white rounded-lg hover:bg-opacity-90 transition">
          Lihat Detail
        </button>
      </div>
    </div>
  </div>
);

export const RecomendationClinic = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 4;

  return (
    <section className="w-full py-12">
      <ClinicSearch />
      <div className="container mx-auto max-w-7xl px-4 py-5">
        <h2 className="text-lg font-semibold text-gray-800 mb-6">
          20 Rekomedasi terdekat dengan Anda
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clinicData.map((clinic, index) => (
            <ClinicCard key={index} clinic={clinic} />
          ))}
        </div>

        <div className="flex justify-center items-center gap-2 mt-10">
          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(index + 1)}
              className={cn('w-8 h-8 rounded-md text-sm font-medium transition-colors', {
                'bg-[#00A991] text-white': currentPage === index + 1,
                'bg-white text-gray-700 hover:bg-gray-100': currentPage !== index + 1
              })}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
