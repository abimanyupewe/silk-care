import { ArrowRight, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const reviewData = [
  {
    name: 'Suryanto',
    service: 'Layanan Apositik',
    avatar: '/assets/home/review/user.png',
    rating: 4.9,
    date: '05 Agustus 2025',
    comment:
      '“Saya sudah lansia, kadang bingung cari apotek yang punya stok obat. Tapi lewat fitur pencarian apotek di SILK, saya bisa tahu lokasi dan harga obat tanpa harus keliling. Sangat membantu!”'
  },
  {
    name: 'Alya',
    service: 'Layanan Apositik',
    avatar: '/assets/home/review/user.png',
    rating: 4.9,
    date: '05 Agustus 2025',
    comment:
      '“Saya tinggal di kos dan jauh dari keluarga. Pas butuh layanan ambulans untuk teman saya, saya pakai fitur SILK HOP. Dalam hitungan menit, ambulans datang ke lokasi. Fitur panggil ambulansnya cepat banget!”'
  },
  {
    name: 'Joko',
    service: 'Layanan Apositik',
    avatar: '/assets/home/review/user.png',
    rating: 4.9,
    date: '05 Agustus 2025',
    comment:
      '“Sebagai tenaga medis, saya merasa SILK sangat membantu dalam mengatur jadwal konsultasi dan memantau rekam medis pasien secara digital. Kolaborasi antara pasien dan dokter jadi lebih efektif.”'
  }
];

// Sub-komponen untuk setiap kartu ulasan
const ReviewCard = ({ review }: { review: (typeof reviewData)[0] }) => (
  <div className="flex h-full flex-col rounded-xl border border-border bg-white p-6">
    {/* Rating */}
    <div className="mb-3 flex items-center gap-1">
      <Star className="h-4 w-4 fill-amber text-amber" />
      <span className="text-sm font-bold text-ink">
        {review.rating.toFixed(1).replace('.', ',')}
      </span>
      <span className="text-sm text-ink-muted">dari 5</span>
    </div>

    {/* Komentar */}
    <p className="flex-grow text-base leading-relaxed text-ink-muted">{review.comment}</p>

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
          <p className="font-semibold text-ink">{review.name}</p>
          <p className="text-sm text-ink-muted">{review.service}</p>
        </div>
      </div>
      <p className="text-sm text-ink-muted">{review.date}</p>
    </div>
  </div>
);

export const Review = () => {
  return (
    <section className="w-full bg-surface py-12 md:py-16">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-ink md:text-[28px]">Ulasan SILK</h2>
            <div className="mt-2 flex items-center gap-2 text-sm">
              <Star className="h-4 w-4 fill-amber text-amber" />
              <span className="font-semibold text-ink">4,9 dari 5</span>
              <span className="text-ink-muted">· 102 ulasan</span>
            </div>
          </div>
          <Link
            href="/ulasan"
            className="flex shrink-0 items-center gap-1 text-sm font-semibold text-primary-hover underline underline-offset-4"
          >
            Lihat semua
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
