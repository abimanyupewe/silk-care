"use client";

import { useState } from "react";
import { Star, ChevronRight, Search } from "lucide-react";
import { cn } from "@/lib/utils"; // Pastikan path ini benar
import React from "react";
import Image from "next/image";

// --- DATA DUMMY ---

const categoryData = [
  { name: "Dokter" },
  { name: "Puskesmas" },
  { name: "Bidan" },
  { name: "Rumah Sakit" },
  { name: "Terapi" },
  { name: "Klinik" },
  { name: "Katering Sehat" },
];

type Tag = {
  text: string;
  color: "blue" | "pink" | "gray" | "teal";
};

type Doctor = {
  name: string;
  image: string;
  price_original: number;
  price_discount: number;
  discount_percentage: number;
  tags: Tag[];
  rating: number;
  patients: number;
  hours: string;
};

const doctorData = Array(9).fill({
    name: "Dr. Clara",
    image: '/assets/doctor/Ambri.png',
    price_original: 50000,
    price_discount: 25000,
    discount_percentage: 50,
    tags: [
        { text: "5 Tahun", color: "blue" },
        { text: "Dokter Umum", color: "pink" },
        { text: "Dekat Anda", color: "gray" },
        { text: "Buka", color: "teal" }
    ],
    rating: 4.9,
    patients: 102,
    hours: "08.00 - 17.00"
});

// --- SUB-KOMPONEN ---

// Tombol Kategori
const CategoryButton = ({ name }: { name: string, icon?: React.ReactNode }) => (
    <button className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition">
        <div className="w-6 h-6 bg-gray-200 rounded-md flex items-center justify-center">
            {/* Placeholder untuk ikon */}
        </div>
        {name}
    </button>
);

// Tag Info untuk Kartu Dokter
const InfoTag = ({ text, color }: { text: string; color: string }) => {
  const colorClasses: { [key: string]: string } = {
    blue: "bg-blue-100 text-blue-800",
    pink: "bg-pink-100 text-pink-800",
    gray: "bg-slate-100 text-slate-800",
    teal: "bg-teal-100 text-teal-800",
  };
  return (
    <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${colorClasses[color] || 'bg-gray-100 text-gray-800'}`}>
      {text}
    </span>
  );
};

// Kartu Dokter
const DoctorCard = ({ doctor }: { doctor: Doctor }) => (
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
        <div className="flex flex-col flex-grow">
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

export const Reference = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 4;

  return (
    <main className="bg-slate-50 py-12">
      <div className="container mx-auto max-w-7xl px-4">
        
        {/* Search Bar */}
        <div className="relative flex items-center mb-6">
          <Search className="absolute left-4 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Cari kebutuhan Anda seperti obat, rumah sakit terdekat dan lainnya"
            className="w-full pl-12 pr-24 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A991] focus:outline-none"
          />
          <button className="absolute right-2 px-8 py-2 text-sm font-semibold bg-[#00A991] text-white rounded-lg hover:bg-opacity-90 transition">
            Cari
          </button>
        </div>

        {/* Categories */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Kategori</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {categoryData.map((category) => (
              <CategoryButton key={category.name} name={category.name} />
            ))}
          </div>
        </section>

        {/* Grid Kartu Dokter */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
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
              className={cn(
                "w-8 h-8 rounded-md text-sm font-medium transition-colors",
                {
                  "bg-[#00A991] text-white": currentPage === index + 1,
                  "bg-white text-gray-700 border border-gray-200 hover:bg-gray-100": currentPage !== index + 1,
                }
              )}
            >
              {index + 1}
            </button>
          ))}
           <button className="w-8 h-8 flex justify-center items-center rounded-md text-sm font-medium transition-colors bg-white text-gray-700 border border-gray-200 hover:bg-gray-100">
              <ChevronRight className="w-4 h-4" />
            </button>
        </div>

      </div>
    </main>
  );
};
