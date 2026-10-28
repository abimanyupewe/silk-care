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
    <section className="bg-white py-12 md:py-16">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-ink md:text-[28px]">Artikel kesehatan</h2>
            <p className="mt-1 text-ink-muted">
              Informasi umum untuk membantu Anda mengambil keputusan.
            </p>
          </div>
          <Link
            href="/article"
            className="flex shrink-0 items-center gap-1 text-sm font-semibold text-primary-hover underline underline-offset-4"
          >
            Lihat semua <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {articleData.map((article) => (
            <ArticleCard key={article.title} article={article} />
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
    <article className="flex flex-col overflow-hidden rounded-xl border border-border bg-white hover:border-border-strong">
      {/* Gambar Artikel */}
      <div className="relative aspect-video bg-surface">
        <Image
          src={article.thumbnail}
          alt={article.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority={false}
        />
        <button
          className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-md border border-border bg-white text-ink hover:border-border-strong"
          aria-label={`Simpan artikel ${article.title}`}
        >
          <Bookmark className="w-5 h-5" />
        </button>
      </div>

      {/* Konten Artikel */}
      <div className="flex flex-grow flex-col p-4">
        {/* Info Penulis */}
        <div className="mb-3 flex items-center justify-between text-sm text-ink-muted">
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
          <h3 className="font-semibold leading-tight text-ink group-hover:text-primary-hover">
            {article.title}
          </h3>
        </Link>
        <p className="mt-1 mb-4 flex-grow text-sm text-ink-muted">{article.excerpt}</p>

        {/* Interaksi (Likes, Comments, Shares) */}
        <div className="flex items-center gap-4 border-t border-border pt-3 text-sm text-ink-muted">
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
    </article>
  );
};
