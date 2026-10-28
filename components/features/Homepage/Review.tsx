import { ArrowRight, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const reviewData = [
  {
    name: "Suryanto",
    service: "Layanan Apositik",
    avatar: "/assets/home/review/user.png",
    rating: 4.9,
    date: "05 Agustus 2025",
    comment:
      "“Saya sudah lansia, kadang bingung cari apotek yang punya stok obat. Tapi lewat fitur pencarian apotek di SILK, saya bisa tahu lokasi dan harga obat tanpa harus keliling. Sangat membantu!”",
  },
  {
    name: "Alya",
    service: "Layanan Apositik",
    avatar: "/assets/home/review/user.png",
    rating: 4.9,
    date: "05 Agustus 2025",
    comment:
      "“Saya tinggal di kos dan jauh dari keluarga. Pas butuh layanan ambulans untuk teman saya, saya pakai fitur SILK HOP. Dalam hitungan menit, ambulans datang ke lokasi. Fitur panggil ambulansnya cepat banget!”",
  },
  {
    name: "Joko",
    service: "Layanan Apositik",
    avatar: "/assets/home/review/user.png",
    rating: 4.9,
    date: "05 Agustus 2025",
    comment:
      "“Sebagai tenaga medis, saya merasa SILK sangat membantu dalam mengatur jadwal konsultasi dan memantau rekam medis pasien secara digital. Kolaborasi antara pasien dan dokter jadi lebih efektif.”",
  },
];

// Sub-komponen untuk setiap kartu ulasan
const ReviewCard = ({ review }: { review: (typeof reviewData)[0] }) => (
  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col h-full">
    {/* Rating */}
    <div className="flex justify-end items-center gap-1 mb-3">
      <Star className="w-4 h-4 text-yellow-400 fill-current" />
      <span className="font-bold text-sm text-gray-800">{review.rating}</span>
    </div>

    {/* Komentar */}
    <p className="text-gray-600 text-sm leading-relaxed flex-grow">
      {review.comment}
    </p>

    {/* Info Pengguna */}
    <div className="mt-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Image
          src={review.avatar}
          alt={review.name}
          width={40}
          height={40}
          className="rounded-full object-cover"
        />
        <div>
          <p className="font-semibold text-gray-900">{review.name}</p>
          <p className="text-xs text-gray-500">{review.service}</p>
        </div>
      </div>
      <p className="text-xs text-gray-500">{review.date}</p>
    </div>
  </div>
);

export const Review = () => {
  return (
    <section className="w-full py-16">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Ulasan Silk</h2>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-yellow-500 font-semibold">4.9</span>
              <span className="text-gray-600">dari</span>
              <span className="text-yellow-500 font-semibold"> 5.0 </span>
              <span className="text-gray-600"> - 102 Ulasan</span>
            </div>
          </div>
          <Link
            href="/ulasan"
            className="flex items-center gap-1 text-sm font-medium text-[#00A991] hover:text-[#008774] transition-colors"
          >
            Lihat semua Ulasan
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Grid untuk Kartu Ulasan */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviewData.map((review, index) => (
            <ReviewCard key={index} review={review} />
          ))}
        </div>
      </div>
    </section>
  );
};
