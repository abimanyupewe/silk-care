'use client';

import {
  Star,
  Heart,
  Calendar,
  Briefcase,
  GraduationCap,
  ThumbsUp,
  MessageCircle,
  MoreHorizontal,
  Send
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils'; // Pastikan path ini benar
import React, { useState } from 'react';

// --- SUB-KOMPONEN ---

// Bagian Info Ringkas (Lokasi, Jadwal, Pengalaman, dll.)
const InfoBlock = ({
  icon,
  title,
  children
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) => (
  <div className="border-b border-border pb-6 mb-6">
    <h3 className="font-bold text-gray-900 mb-3">{title}</h3>
    <div className="flex gap-4">
      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="text-sm text-gray-600">{children}</div>
    </div>
  </div>
);

// Ulasan (diambil dari komponen Review sebelumnya dan disesuaikan)
const ReviewItem = () => (
  <div className="py-4 border-b border-border last:border-b-0">
    <div className="flex justify-between items-start">
      <div className="flex items-center gap-3">
        <Image
          src="/assets/doctor/anisa.png"
          alt="Rizal"
          width={40}
          height={40}
          className="rounded-full"
        />
        <div>
          <p className="font-semibold text-gray-900 text-sm">Rizal Sadewa</p>
          <p className="text-xs text-gray-500">11 / 11 / 2025</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 text-yellow-400 fill-current" />
          <span className="font-semibold text-sm">5.0</span>
        </div>
        <button className="text-gray-500 hover:text-gray-800">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>
    </div>
    <p className="mt-3 text-sm text-gray-700">Lorem ipsum dolor sit amet consectetur...</p>
    <div className="mt-4 flex items-center gap-6 text-sm text-gray-600">
      <div className="flex items-center gap-2">
        <ThumbsUp className="w-4 h-4" />
        <span>10</span>
      </div>
      <div className="flex items-center gap-2">
        <MessageCircle className="w-4 h-4" />
        <span>2</span>
      </div>
      <a href="#" className="font-semibold hover:text-gray-900">
        Balas
      </a>
    </div>
  </div>
);

// --- KOMPONEN UTAMA ---

export const Detail = () => {
  const [currentPage, setCurrentPage] = useState(1);
  return (
    <section className="bg-white py-12">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* KOLOM KIRI */}
          <main className="lg:col-span-2">
            {/* Header Dokter */}
            <div className="flex items-center gap-4">
              <Image
                src="/assets/doctor/yuri.png"
                alt="Dr. Clara"
                width={64}
                height={64}
                className="rounded-full"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Dr. Clara</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-semibold px-2 py-0.5 bg-pink-100 text-pink-800 rounded">
                    Dokter Umum
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                    5 Tahun
                  </span>
                </div>
              </div>
              <div className="ml-auto flex items-center gap-4">
                <div className="flex items-center gap-1 text-sm">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="font-semibold">4.9</span>
                  <span className="text-gray-500">(102 Pasien)</span>
                </div>
                <button className="text-gray-500 hover:text-red-500">
                  <Heart className="w-6 h-6" />
                </button>
              </div>
            </div>

            <p className="text-gray-600 mt-4 border-b border-border pb-6">
              Lorem ipsum dolor sit amet consectetur. Magnis commodo eros penatibus. Lorem ipsum
              dolor sit amet consectetur. Ut faucibus egestas quam adipiscing suscipit nullam. Urna
              volutpat id nunc nulla montes faucibus. Orci sollicitudin sed ac in facilisi. Ut vitae
              est ante sagittis urna augue eleifend odio.
            </p>

            {/* Detail Section */}
            <div className="mt-6">
              <InfoBlock icon={<Briefcase className="w-6 h-6 text-gray-500" />} title="Lokasi">
                <p>Lorem ipsum dolor sit amet consectetur. Magnis commodo eros penatibus.</p>
              </InfoBlock>

              <div className="border-b border-border pb-6 mb-6">
                <h3 className="font-bold text-gray-900 mb-3">Jadwal Praktik</h3>
                <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="font-semibold text-gray-800">Senin</p>
                      <p className="text-gray-600">08.00 - 17.00</p>
                    </div>
                  </div>
                  <Link
                    href="#"
                    className="px-4 py-1.5 text-xs font-semibold bg-primary text-white rounded-md hover:bg-primary-hover"
                  >
                    Lihat Jadwal
                  </Link>
                </div>
              </div>

              <InfoBlock icon={<Briefcase className="w-6 h-6 text-gray-500" />} title="Pengalaman">
                <p className="font-semibold text-gray-800">Dr. Umum</p>
                <p>Lorem ipsum dolor sit amet consectetur. Magnis commodo eros penatibus.</p>
                <p className="text-xs text-gray-400 mt-1">11 / 11 / 2025 - 11 / 11 / 2025</p>
              </InfoBlock>

              <InfoBlock
                icon={<GraduationCap className="w-6 h-6 text-gray-500" />}
                title="Riwayat Pendidikan"
              >
                <p className="font-semibold text-gray-800">Universitas Brawijaya</p>
                <p>Lorem ipsum dolor sit amet consectetur. Magnis commodo eros penatibus.</p>
                <p className="text-xs text-gray-400 mt-1">11 / 11 / 2025 - 11 / 11 / 2025</p>
              </InfoBlock>

              {/* Author Box */}
              <div className="flex items-center gap-4 mt-6">
                <Image
                  src="/assets/doctor/yuri.png"
                  alt="Dr. Clara"
                  width={48}
                  height={48}
                  className="rounded-full"
                />
                <div>
                  <h4 className="font-bold text-gray-900">Dr. Clara</h4>
                  <p className="text-sm text-gray-500">102 Pengikut - 2 Mengikuti</p>
                </div>
                <button className="ml-auto px-6 py-2 text-sm font-semibold bg-primary text-white rounded-full hover:bg-primary-hover">
                  Ikuti
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-2">10 Artikel</p>
            </div>
          </main>

          {/* KOLOM KANAN - PERBAIKAN DI SINI */}
          <aside className="lg:col-span-1">
            <div className="sticky top-6 space-y-6">
              {/* Video, Biaya, dan Penanganan sekarang jadi satu grup */}
              <div>
                <div className="aspect-video w-full bg-gray-200 rounded-xl mb-4">
                  <p className="text-center text-gray-500 pt-20">Video profile doctor jika ada</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900">Biaya Konsultasi</h3>
                  <div className="flex items-end gap-2 mt-1">
                    <span className="text-xs text-gray-400 line-through">Rp 50.000</span>
                    <span className="text-xl font-bold text-primary">Rp. 25.000</span>
                    <span className="text-xs font-bold px-1.5 py-0.5 bg-red-100 text-red-600 rounded">
                      50%
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">*Diskon sampai 10/09/2025</p>
                  <button className="w-full mt-3 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary-hover">
                    Buat Janji
                  </button>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg mt-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Penanganan</h3>
                  <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                    <li>Cek Gula darah</li>
                    <li>Konsultasi Kesehatan</li>
                  </ul>
                </div>
              </div>

              {/* Ulasan dipindahkan ke dalam wrapper sticky */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-bold text-gray-900 mb-2">Ulasan</h3>
                <div className="flex items-center gap-3">
                  <Image
                    src="/assets/doctor/yuri.png"
                    alt="Abimanyu"
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                  <div className="relative flex-grow">
                    <input
                      type="text"
                      placeholder="Ingin memberi tanggapan?"
                      className="w-full bg-white rounded-full py-1.5 pl-3 pr-8 text-sm border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <Send className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
                <div className="mt-4">
                  <ReviewItem />
                  <ReviewItem />
                </div>
                <div className="flex justify-center items-center gap-2 mt-4">
                  {Array.from({ length: 2 }).map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentPage(index + 1)}
                      className={cn('w-7 h-7 rounded-md text-xs font-medium', {
                        'bg-primary text-white': currentPage === index + 1,
                        'bg-white text-gray-600 border border-border': currentPage !== index + 1
                      })}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
};
