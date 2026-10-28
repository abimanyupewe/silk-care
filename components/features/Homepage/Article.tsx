import Image from 'next/image';
import { ArrowRight, Bookmark, MessageCircle, ThumbsUp } from 'lucide-react';
import Link from 'next/link';

// Tipe untuk satu objek artikel
type ArticleType = {
  author: string;
  avatar: string;
  thumbnail: string;
  date: string;
  title: string;
  excerpt: string;
  likes: number;
  comments: number;
  shares: number;
};

// Tipe untuk props komponen ArticleCard
type ArticleCardProps = {
  article: ArticleType;
};

// Data artikel
const articleData: ArticleType[] = [
  {
    author: 'Dr. Clara',
    avatar: '/assets/home/article/user/user.png',
    thumbnail: '/assets/home/article/blog1.png',
    date: '11 / 11 / 2025',
    title: 'Kelelahan Berlebihan Meski Sudah Tidur',
    excerpt: 'Merasa lelah terus-menerus meskipun sudah...',
    likes: 102,
    comments: 20,
    shares: 10
  },
  {
    author: 'Dr. Clara',
    avatar: '/assets/home/article/user/user.png',
    thumbnail: '/assets/home/article/blog2.png',
    date: '11 / 11 / 2025',
    title: 'Tips Menjaga Kesehatan Mental di Era Digital',
    excerpt: 'Kesehatan mental menjadi isu yang semakin penting...',
    likes: 251,
    comments: 45,
    shares: 22
  },
  {
    author: 'Dr. Clara',
    avatar: '/assets/home/article/user/user.png',
    thumbnail: '/assets/home/article/blog3.png',
    date: '11 / 11 / 2025',
    title: 'Pentingnya Sarapan Pagi untuk Produktivitas',
    excerpt: 'Banyak orang melewatkan sarapan karena berbagai...',
    likes: 188,
    comments: 31,
    shares: 15
  }
];

// Komponen untuk menampilkan seluruh seksi artikel
export const Article = () => {
  return (
    <section className="bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-8">Artikel Terbaru</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articleData.map((article, index) => (
            <ArticleCard key={index} article={article} />
          ))}
        </div>
      </div>
    </section>
  );
};

// Komponen untuk satu kartu artikel
// PERUBAHAN UTAMA DI SINI vvvv
export const ArticleCard = ({ article }: ArticleCardProps) => {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm flex flex-col">
      {/* Gambar Artikel */}
      <div className="relative aspect-[4/2] bg-gray-100">
        <Image
          src={article.thumbnail}
          alt={article.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority={false}
        />
        <button className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm p-2 rounded-full text-gray-700 hover:bg-white hover:text-red-500 transition">
          <Bookmark className="w-5 h-5" />
        </button>
      </div>

      {/* Konten Artikel */}
      <div className="p-4 flex flex-col flex-grow">
        {/* Info Penulis */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <div className="flex items-center gap-2">
            <Image
              src={article.avatar}
              alt={article.author}
              width={24}
              height={24}
              className="rounded-full object-cover"
            />
            <span>{article.author}</span>
          </div>
          <span>{article.date}</span>
        </div>

        {/* Judul & Kutipan */}
        <Link href="#" className="group">
          <h3 className="font-bold text-gray-900 leading-tight group-hover:text-[#00A991] transition-colors">
            {article.title}
          </h3>
        </Link>
        <p className="text-sm text-gray-600 mt-1 mb-4 flex-grow">{article.excerpt}</p>

        {/* Interaksi (Likes, Comments, Shares) */}
        <div className="flex items-center gap-4 text-sm text-gray-600 border-t border-gray-100 pt-3">
          <div className="flex items-center gap-1.5">
            <ThumbsUp className="w-4 h-4" />
            <span>{article.likes}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MessageCircle className="w-4 h-4" />
            <span>{article.comments}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ArrowRight className="w-4 h-4" /> {/* Asumsi ikon share */}
            <span>{article.shares}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
