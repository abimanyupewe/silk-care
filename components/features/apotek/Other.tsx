'use client';

import { Star, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import React from 'react';
import Image from 'next/image'; // Import Image

// Data dummy untuk produk
const productData = [
  {
    name: 'Amoxicillin 500mg',
    image: '/assets/apotek/alat1.png', // Path diperbarui
    discount: 50,
    price_original: 12000,
    price_discount: 6000,
    rating: 4.9,
    sold: 112,
    stock: 120
  },
  {
    name: 'Amoxicillin 500mg',
    image: '/assets/apotek/alat2.png', // Path diperbarui
    discount: 50,
    price_original: 12000,
    price_discount: 6000,
    rating: 4.9,
    sold: 112,
    stock: 120
  },
  {
    name: 'Amoxicillin 500mg',
    image: '/assets/apotek/alat3.png', // Path diperbarui
    discount: 50,
    price_original: 12000,
    price_discount: 6000,
    rating: 4.9,
    sold: 112,
    stock: 120
  },
  {
    name: 'Amoxicillin 500mg',
    image: '/assets/apotek/alat4.png', // Path diperbarui
    discount: 50,
    price_original: 12000,
    price_discount: 6000,
    rating: 4.9,
    sold: 112,
    stock: 120
  },
  {
    name: 'Amoxicillin 500mg',
    image: '/assets/apotek/alat5.png', // Path diperbarui
    discount: 50,
    price_original: 12000,
    price_discount: 6000,
    rating: 4.9,
    sold: 112,
    stock: 120
  }
];

// Sub-komponen untuk Kartu Produk
const ProductCard = ({ product }: { product: (typeof productData)[0] }) => (
  <div className="rounded-xl overflow-hidden flex flex-col">
    {/* Gambar Produk */}
    <div className="relative aspect-square w-full rounded-xl overflow-hidden">
      <Image
        src={product.image}
        alt={product.name}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
      />
      <div className="absolute top-2 left-2 bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded">
        {product.discount}%
      </div>
    </div>

    {/* Konten Teks */}
    <div className="p-1 pt-2 flex flex-col flex-grow">
      <h3 className="font-semibold text-sm text-gray-800">{product.name}</h3>
      <div className="text-xs text-gray-500 flex items-center gap-2 my-1">
        <div className="flex items-center gap-1">
          <Star className="w-3 h-3 text-yellow-400 fill-current" />
          <span>{product.rating}</span>
        </div>
        <span>{product.sold} Terjual</span>
        <span>Stock: {product.stock}</span>
      </div>
      <div className="my-1 flex flex-row gap-3 justify-start items-center">
        <span className="text-xs text-gray-400 line-through">
          Rp. {product.price_original.toLocaleString('id-ID')}
        </span>
        <p className="font-bold text-primary">
          Rp. {product.price_discount.toLocaleString('id-ID')}
        </p>
      </div>
      {/* Tombol Aksi */}
      <div className="flex gap-2 mt-2">
        <button className="flex-1 px-3 py-1.5 text-xs font-semibold bg-white border border-border text-gray-700 rounded-lg hover:bg-gray-50 transition">
          Cart
        </button>
        <button className="flex-1 px-3 py-1.5 text-xs font-semibold bg-primary text-white rounded-lg hover:bg-primary-hover transition">
          Beli
        </button>
      </div>
    </div>
  </div>
);

export const Other = () => {
  return (
    <section className="bg-slate-50 py-12">
      <div className="container mx-auto max-w-7xl px-4">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Rekomendasi Produk Lain</h2>
          <Link
            href="/produk"
            className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-hover transition-colors"
          >
            Lihat semua
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Grid untuk Produk */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {productData.map((product, index) => (
            <ProductCard key={index} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
};
