import {
  ThumbsUp,
  MessageCircle,
  Bookmark,
  ChevronRight,
  Facebook,
  Share2, // Mengganti ikon tidak jelas dengan ikon 'Share' umum
  Twitter // Asumsi ikon WhatsApp tidak tersedia, pakai Twitter sbg contoh
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

// --- DATA DUMMY ---

const popularAuthors = [
  { name: 'Dr. Clara', specialty: 'Dokter Spesialis Anak', avatar: '/assets/article/clara.png' },
  { name: 'Dr. Indah', specialty: 'Dokter Umum', avatar: '/assets/article/indah.png' },
  { name: 'Dr. Thomas', specialty: 'Dokter Gizi', avatar: '/assets/article/thomas.png' }
];

const trendingTopics = ['Kesehatan Digital', 'Olahraga', 'Kesehatan Mental', 'Diet'];
const articleTags = ['#kesehatamental', '#mentalhealth', '#trending'];

// --- SUB-KOMPONEN ---

// Widget Sidebar
const SidebarWidget = ({
  title,
  children,
  viewMoreLink,
  noPadding
}: {
  title: string;
  children: React.ReactNode;
  viewMoreLink?: string;
  noPadding?: boolean;
}) => (
  <div className={!noPadding ? 'bg-gray-50 p-4 rounded-xl' : ''}>
    <h3 className="font-bold text-gray-900 mb-4">{title}</h3>
    {children}
    {viewMoreLink && (
      <Link
        href={viewMoreLink}
        className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-hover transition-colors mt-4"
      >
        Lihat selengkapnya <ChevronRight className="w-3 h-3" />
      </Link>
    )}
  </div>
);

// Item Penulis (di Sidebar)
const AuthorItem = ({ author }: { author: (typeof popularAuthors)[0] }) => (
  <div className="flex justify-between items-center py-2">
    <div className="flex items-center gap-3">
      <Image
        src={author.avatar}
        alt={author.name}
        width={40}
        height={40}
        className="rounded-full"
      />
      <div>
        <p className="font-semibold text-sm text-gray-900">{author.name}</p>
        <p className="text-xs text-gray-500">{author.specialty}</p>
      </div>
    </div>
    <button className="px-4 py-1 text-xs font-semibold bg-primary text-white rounded-full hover:bg-primary-hover transition">
      Ikuti
    </button>
  </div>
);

// --- KOMPONEN UTAMA ---

export const Detail = () => {
  return (
    <section className="bg-white py-12">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Kolom Kiri: Konten Artikel */}
          <main className="lg:col-span-2">
            <article className="prose prose-lg max-w-none text-gray-700">
              <h1 className="text-4xl font-bold text-gray-900 leading-tight">
                Kelelahan Berlebihan Meski Sudah Tidur
              </h1>

              {/* Info Penulis & Interaksi */}
              <div className="flex justify-between items-center my-6 border-b border-border pb-6">
                <div className="flex items-center gap-3">
                  <Image
                    src="/assets/article/clara.png"
                    alt="Dr. Clara"
                    width={48}
                    height={48}
                    className="rounded-full"
                  />
                  <div>
                    <p className="font-semibold text-gray-900">Dr. Clara</p>
                    <p className="text-sm text-gray-500">11 / 11 / 2025</p>
                  </div>
                  <button className="ml-4 px-5 py-1.5 text-sm font-semibold bg-primary text-white rounded-full hover:bg-primary-hover transition">
                    Ikuti
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-6 text-gray-600">
                <div className="flex items-center gap-2">
                  <ThumbsUp className="w-5 h-5" />
                  <span>102</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  <span>20</span>
                </div>
                <div className="flex items-center gap-2">
                  <Share2 className="w-5 h-5" />
                  <span>10</span>
                </div>
                <button className="ml-auto text-gray-500 hover:text-gray-800">
                  <Bookmark className="w-5 h-5" />
                </button>
              </div>

              {/* Konten Artikel */}
              <p className="lead mt-6">
                Merasa lelah terus-menerus meskipun sudah tidur cukup bisa menjadi tanda tubuh
                mengalami kelelahan fisik atau mental.
              </p>

              <figure className="my-8">
                <div className="relative aspect-video w-full rounded-xl overflow-hidden">
                  <Image
                    src="/assets/article/blog1.png"
                    alt="Kelelahan Berlebihan"
                    fill
                    className="object-cover"
                  />
                </div>
              </figure>

              <p>
                Kesehatan adalah aset paling berharga yang sering kali baru kita sadari ketika sakit
                datang. Di era modern ini, menjaga kesehatan bukan hanya soal mengobati penyakit,
                tetapi juga bagaimana kita menerapkan pola hidup sehat sejak dini. Mulai dari
                mengatur pola makan bergizi, menjaga kebersihan lingkungan, hingga rutin berolahraga
                dapat membantu tubuh tetap bugar. Selain itu, kesadaran akan kesehatan mental juga
                semakin penting karena tubuh yang sehat perlu didukung dengan pikiran yang tenang.
                Dengan langkah kecil yang konsisten, kita bisa mencegah banyak penyakit serius di
                masa depan dan menikmati hidup yang lebih berkualitas.
              </p>

              <h2 className="font-bold text-gray-900">Kesehatan Mental di Era Digital</h2>
              <p>
                Penggunaan gadget yang berlebihan sering kali berdampak pada kesehatan mental.
                Banyak orang mulai menyadari pentingnya menjaga keseimbangan antara aktivitas
                digital dan kehidupan nyata. Istirahat dari media sosial, melakukan meditasi, dan
                memperbanyak interaksi langsung dengan orang sekitar dapat membantu menjaga
                kesehatan mental tetap stabil.
              </p>
            </article>

            <div className="mt-12 p-6">
              <div className="flex justify-between items-start gap-4">
                <div className="flex items-start gap-4">
                  <Image
                    src="/assets/article/clara.png"
                    alt="Dr. Clara"
                    width={64}
                    height={64}
                    className="rounded-full"
                  />
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Ditulis oleh Dr. Clara</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      102 Pengikut - 2 Mengikuti · 11 / 11 / 2025
                    </p>
                    <p className="text-base text-gray-800 mt-3">
                      Saya Seorang Dokter Spesialis dengan 12 Tahun Pengalaman dibidang ke Dokteran
                    </p>
                  </div>
                </div>
                <button className="px-5 py-1.5 text-sm font-semibold bg-primary text-white rounded-full hover:bg-primary-hover transition flex-shrink-0">
                  Ikuti
                </button>
              </div>
              <div className="flex items-center gap-6 text-gray-600 mt-4 pt-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <ThumbsUp className="w-5 h-5" />
                  <span>102</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  <span>20</span>
                </div>
                <div className="flex items-center gap-2">
                  <Share2 className="w-5 h-5" />
                  <span>10</span>
                </div>
                <button className="ml-auto text-gray-500 hover:text-gray-800">
                  <Bookmark className="w-5 h-5" />
                </button>
              </div>
            </div>
          </main>

          {/* Kolom Kanan: Sidebar */}
          <aside className="lg:col-span-1 space-y-8">
            <SidebarWidget title="Trending Topik">
              <div className="flex flex-wrap gap-2">
                {trendingTopics.map((topic) => (
                  <button
                    key={topic}
                    className="px-3 py-1.5 bg-gray-100 border border-border rounded-full text-xs font-medium text-gray-700 hover:bg-gray-200 transition"
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </SidebarWidget>

            <SidebarWidget title="Shere" noPadding>
              <div className="flex items-center gap-3">
                <button className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200">
                  <Twitter className="w-5 h-5" />
                </button>
                <button className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200">
                  <Facebook className="w-5 h-5" />
                </button>
                <button className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </SidebarWidget>

            <SidebarWidget title="Tags" noPadding>
              <div className="flex flex-wrap gap-2">
                {articleTags.map((tag) => (
                  <Link href="#" key={tag} className="text-sm text-gray-600 hover:text-gray-900">
                    {tag}
                  </Link>
                ))}
              </div>
            </SidebarWidget>

            <SidebarWidget title="Penulis Populer" viewMoreLink="#" noPadding>
              <div className="space-y-2">
                {popularAuthors.map((author, index) => (
                  <AuthorItem key={index} author={author} />
                ))}
              </div>
            </SidebarWidget>

            <SidebarWidget title="Rekomendasi" viewMoreLink="#" noPadding>
              <div className="space-y-2">
                {popularAuthors.map((author, index) => (
                  <AuthorItem key={index} author={author} />
                ))}
              </div>
            </SidebarWidget>
          </aside>
        </div>
      </div>
    </section>
  );
};
