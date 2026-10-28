import { ArrowRight, Bookmark, MessageCircle, ThumbsUp } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

// Data dummy untuk artikel (UPDATED)
const articleData = [
  {
    author: "Dr. Clara",
    avatar: "/assets/article/user.png", // Path diperbarui
    date: "11 / 11 / 2025",
    title: "Kelelahan Berlebihan Meski Sudah Tidur",
    excerpt: "Merasa lelah terus-menerus meskipun sudah...",
    likes: 102,
    comments: 20,
    shares: 10,
    thumbnail: "/assets/article/blog1.png", // Thumbnail ditambahkan
  },
  {
    author: "Dr. Clara",
    avatar: "/assets/article/user.png", // Path diperbarui
    date: "11 / 11 / 2025",
    title: "Kelelahan Berlebihan Meski Sudah Tidur",
    excerpt: "Merasa lelah terus-menerus meskipun sudah...",
    likes: 102,
    comments: 20,
    shares: 10,
    thumbnail: "/assets/article/blog2.png", // Thumbnail ditambahkan
  },
  {
    author: "Dr. Clara",
    avatar: "/assets/article/user.png", // Path diperbarui
    date: "11 / 11 / 2025",
    title: "Kelelahan Berlebihan Meski Sudah Tidur",
    excerpt: "Merasa lelah terus-menerus meskipun sudah...",
    likes: 102,
    comments: 20,
    shares: 10,
    thumbnail: "/assets/article/blog3.png", // Thumbnail ditambahkan
  },
    // Menambahkan data ke-4 sebagai contoh dari aset yang diberikan
  {
    author: "Dr. Clara",
    avatar: "/assets/article/user.png", // Path diperbarui
    date: "11 / 11 / 2025",
    title: "Pentingnya Menjaga Pola Tidur yang Baik",
    excerpt: "Tidur yang cukup dan berkualitas adalah kunci...",
    likes: 150,
    comments: 35,
    shares: 18,
    thumbnail: "/assets/article/blog4.png", // Thumbnail ditambahkan
  },
];

// Sub-komponen untuk setiap kartu artikel (UPDATED)
const ArticleCard = ({ article }: { article: (typeof articleData)[0] }) => (
  <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm flex flex-col">
    {/* Gambar Artikel Ditampilkan Di Sini */}
    <div className="relative aspect-video">
      <Image
        src={article.thumbnail}
        alt={article.title}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
      {/* Tombol Bookmark */}
      <button className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm p-2 rounded-full text-gray-700 hover:bg-white transition">
        <Bookmark className="w-4 h-4" />
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
      <p className="text-sm text-gray-600 mt-1 mb-4 flex-grow">
        {article.excerpt}
      </p>

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

export const Article = () => {
  return (
    <section className="w-full py-16">
      <div className="container mx-auto max-w-7xl px-4">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Artikel</h2>
          <Link
            href="/artikel"
            className="flex items-center gap-1 text-sm font-medium text-[#00A991] hover:text-[#008774] transition-colors"
          >
            Lihat semua artikel
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Grid untuk Kartu Artikel */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articleData.map((article, index) => (
            <ArticleCard key={index} article={article} />
          ))}
        </div>
      </div>
    </section>
  );
};