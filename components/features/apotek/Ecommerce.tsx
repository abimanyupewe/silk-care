'use client';

import { Search, Star } from 'lucide-react';
import React from 'react';
import Image from 'next/image'; // Import Image

// Data dummy untuk kategori (UPDATED)
const categoryData = [
  { name: 'Vitamin & Suplemen', icon: '/assets/apotek/Drugs.png' },
  { name: 'Perawatan Diri', icon: '/assets/apotek/Self Love.png' },
  { name: 'Kesehatan Seksual', icon: '/assets/apotek/Sexual infection.png' },
  { name: 'Susu', icon: '/assets/apotek/Milk.png' },
  { name: 'Ibu & Anak', icon: '/assets/apotek/Mother.png' },
  { name: 'Ibu', icon: '/assets/apotek/Mother.png' } // Menggunakan ikon yang sama sebagai contoh
];

// Data dummy untuk produk (UPDATED)
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

// Sub-komponen untuk Kartu Produk (UPDATED)
const ProductCard = ({ product }: { product: (typeof productData)[0] }) => (
  <div className="bg-white rounded-lg border border-border overflow-hidden flex flex-col">
    <div className="relative aspect-[1/1] w-full">
      {/* Gambar Produk Ditampilkan Di Sini */}
      <Image
        src={product.image}
        alt={product.name}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
      />
      {/* Discount Badge */}
      <div className="absolute top-2 left-2 bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded">
        {product.discount}%
      </div>
    </div>
    <div className="p-3 flex flex-col flex-grow">
      <h3 className="font-semibold text-sm text-gray-800 flex-grow">{product.name}</h3>
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
        <p className="font-bold text-gray-900">
          Rp. {product.price_discount.toLocaleString('id-ID')}
        </p>
      </div>
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

export const Ecommerce = () => {
  return (
    <main className="bg-white">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        {/* Search Bar */}
        <div className="relative flex items-center mb-6">
          <Search className="absolute left-4 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Cari kebutuhan Anda seperti obat, rumah sakit terdekat dan lainnya"
            className="w-full pl-12 pr-24 py-3 border border-border rounded-full focus:ring-2 focus:ring-primary focus:outline-none"
          />
          <button className="absolute right-2 px-8 py-2 text-sm font-semibold bg-primary text-white rounded-full hover:bg-primary-hover transition">
            Cari
          </button>
        </div>

        {/* Categories (UPDATED) */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Kategori</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {categoryData.map((category) => (
              <button
                key={category.name}
                className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-200 transition"
              >
                {/* Ikon Kategori Ditampilkan Di Sini */}
                <Image src={category.icon} alt={category.name} width={24} height={24} />
                {category.name}
              </button>
            ))}
          </div>
        </section>

        {/* Prescription Upload */}
        <section className="mb-8 p-4 bg-gray-50 rounded-lg flex justify-between items-center">
          <div>
            <h3 className="font-bold text-gray-900">Punya Resep Obat?</h3>
            <p className="text-sm text-gray-600">Upload resep dan Temukan obat anda sekarang</p>
          </div>
          <button className="px-6 py-2 text-sm font-semibold bg-primary text-white rounded-lg hover:bg-primary-hover transition">
            Upload Resep
          </button>
        </section>

        {/* Product Grid */}
        <section>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {productData.map((product, index) => (
              <ProductCard key={index} product={product} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
};
