'use client';

import { useState } from 'react';
import { Star, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils'; // Pastikan path ini benar
import React from 'react';
import Image from 'next/image';

// --- DATA DUMMY ---

const doctorData = [
  {
    name: 'Dr. Clara',
    image: '/assets/doctor/Ambri.png',
    price_original: 50000,
    price_discount: 25000,
    discount_percentage: 50,
    tags: [
      { text: '5 Tahun', color: 'blue' },
      { text: 'Dokter Umum', color: 'pink' },
      { text: 'Dekat Anda', color: 'gray' },
      { text: 'Buka', color: 'teal' }
    ],
    rating: 4.9,
    patients: 102,
    hours: '08.00 - 17.00'
  },
  {
    name: 'Dr. Clara',
    image: '/assets/doctor/Ambri.png',
    price_original: 50000,
    price_discount: 25000,
    discount_percentage: 50,
    tags: [
      { text: '5 Tahun', color: 'blue' },
      { text: 'Dokter Umum', color: 'pink' },
      { text: 'Dekat Anda', color: 'gray' },
      { text: 'Buka', color: 'teal' }
    ],
    rating: 4.9,
    patients: 102,
    hours: '08.00 - 17.00'
  },
  {
    name: 'Dr. Clara',
    image: '/assets/doctor/Ambri.png',
    price_original: 50000,
    price_discount: 25000,
    discount_percentage: 50,
    tags: [
      { text: '5 Tahun', color: 'blue' },
      { text: 'Dokter Umum', color: 'pink' },
      { text: 'Dekat Anda', color: 'gray' },
      { text: 'Buka', color: 'teal' }
    ],
    rating: 4.9,
    patients: 102,
    hours: '08.00 - 17.00'
  }
];

const InfoTag = ({ text, color }: { text: string; color: string }) => {
  const colorClasses: { [key: string]: string } = {
    blue: 'bg-blue-100 text-blue-800',
    pink: 'bg-pink-100 text-pink-800',
    gray: 'bg-slate-200 text-slate-800',
    teal: 'bg-teal-100 text-teal-800'
  };
  return (
    <span
      className={`px-2 py-0.5 text-[10px] font-bold rounded ${colorClasses[color] || 'bg-gray-100 text-gray-800'}`}
    >
      {text}
    </span>
  );
};

// Kartu Dokter
const DoctorCard = ({ doctor }: { doctor: (typeof doctorData)[0] }) => (
  <div className="bg-white rounded-xl flex flex-col p-4 ">
    {/* Image Placeholder */}
    <div className="flex flex-row gap-4 justify-start">
      <div className="relative w-32 h-32 rounded-md overflow-hidden">
        <Image src={doctor.image} alt={doctor.name} fill className="object-cover" sizes="128px" />
      </div>
      <div>
        <h3 className="font-bold text-gray-900 text-2xl">{doctor.name}</h3>
        <div className="my-1">
          <span className="text-xs text-gray-400 line-through">
            Rp. {doctor.price_original.toLocaleString('id-ID')}
          </span>
          <span className="font-bold text-sm text-[#00A991] ml-1">
            Rp. {doctor.price_discount.toLocaleString('id-ID')}
          </span>
          <span className="ml-2 bg-red-100 text-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded">
            {doctor.discount_percentage}%
          </span>
        </div>
        <div className="pt-2 flex flex-col flex-grow">
          <div className="flex flex-wrap gap-1 my-1">
            {doctor.tags.map((tag) => (
              <InfoTag key={tag.text} text={tag.text} color={tag.color} />
            ))}
          </div>
          <div className="text-xs text-gray-500 flex justify-between items-center mt-1">
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-400 fill-current" />
              <span className="font-semibold text-gray-800">{doctor.rating}</span>
              <span>{doctor.patients} Pasien</span>
            </div>
            <span className="font-semibold text-gray-700">{doctor.hours}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// --- KOMPONEN UTAMA ---

export const Recomendation = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 2;

  return (
    <section className="bg-white py-12">
      <div className="container mx-auto max-w-7xl px-4">
        {/* Map Placeholder */}
        <div className="h-80 w-full bg-gray-200 rounded-2xl mb-8">
          {/* Di sini Anda akan mengintegrasikan komponen GoogleMap dari @react-google-maps/api */}
          <p className="text-center text-gray-500 pt-32">Google Maps Placeholder</p>
        </div>

        {/* Header Rekomendasi */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-900">3 Terdekat dengan Anda</h2>
          <Link
            href="/terdekat"
            className="flex items-center gap-1 text-sm font-medium text-[#00A991] hover:text-[#008774] transition-colors"
          >
            Lihat semua
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Grid Kartu Dokter */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {doctorData.map((doctor, index) => (
            <DoctorCard key={index} doctor={doctor} />
          ))}
        </div>

        {/* Paginasi */}
        <div className="flex justify-center items-center gap-2 mt-8">
          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(index + 1)}
              className={cn('w-8 h-8 rounded-md text-sm font-medium transition-colors', {
                'bg-[#00A991] text-white': currentPage === index + 1,
                'bg-gray-100 text-gray-700 hover:bg-gray-200': currentPage !== index + 1
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
