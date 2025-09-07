"use client";

import { Star, AlertTriangle } from "lucide-react";
import React from "react";

export const Hero = () => {
  return (
    <section className="bg-white py-12">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Kolom Kiri: Galeri Gambar */}
          <div className="flex gap-4">
            {/* Gambar Utama */}
            <div className="w-full aspect-square bg-gray-200 rounded-2xl flex-grow"></div>
            {/* Thumbnails */}
            <div className="flex flex-col gap-3">
              <div className="w-16 h-16 bg-gray-200 rounded-lg cursor-pointer"></div>
              <div className="w-16 h-16 bg-gray-200 rounded-lg cursor-pointer"></div>
              <div className="w-16 h-16 bg-gray-200 rounded-lg cursor-pointer"></div>
              <div className="w-16 h-16 bg-gray-200 rounded-lg cursor-pointer"></div>
            </div>
          </div>

          {/* Kolom Kanan: Detail Produk */}
          <div className="flex flex-col gap-4">
            {/* Judul & Info Rating */}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                Amoxicillin 500mg
              </h1>
              <div className="flex items-center gap-3 text-sm text-gray-600 mt-2">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="font-semibold text-gray-800">4.9</span>
                </div>
                <span>112 Terjual</span>
                <span>Stock : 120</span>
              </div>
            </div>

            {/* Banner Peringatan */}
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm rounded-lg p-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Obat ini memerlukan Resep Dokter</span>
            </div>

            {/* Spesifikasi Produk */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Per</span>
                <span className="font-semibold text-gray-800">Stripe</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Type Produk</span>
                <div className="flex items-center gap-2 font-semibold text-gray-800">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span>Obat Keras</span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">No. BPOM</span>
                <span className="font-semibold text-gray-800">GKL0506503604A1</span>
              </div>
            </div>

            {/* Garis Pemisah */}
            <hr className="border-gray-200" />

            {/* Harga */}
            <div className="flex items-center gap-3">
              <span className="text-2xl text-gray-400 line-through">Rp. 12.000</span>
              <span className="text-3xl font-bold text-[#00A991]">Rp. 6.000</span>
              <span className="bg-red-100 text-red-600 text-sm font-bold px-2 py-1 rounded">
                50%
              </span>
            </div>

            {/* Tombol Aksi */}
            <div className="grid grid-cols-2 gap-3 mt-2">
              <button className="w-full py-3 text-sm font-semibold bg-slate-100 text-gray-800 rounded-lg hover:bg-slate-200 transition">
                Keranjang
              </button>
              <button className="w-full py-3 text-sm font-semibold bg-[#00A991] text-white rounded-lg hover:bg-opacity-90 transition">
                Beli
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
