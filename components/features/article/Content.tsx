import { ArrowRight, Bookmark, MessageCircle, ThumbsUp, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";

// --- DATA DUMMY ---

const articleData = [
  {
    author: "Dr. Clara",
    avatar: "/avatars/clara.png",
    date: "11 / 11 / 2025",
    title: "Kelelahan Berlebihan Meski Sudah Tidur",
    excerpt: "Merasa lelah terus-menerus meskipun sudah...",
    likes: 102,
    comments: 20,
    shares: 10,
    image: "/articles/image1.png", // Ganti dengan path gambar
  },
  {
    author: "Dr. Clara",
    avatar: "/avatars/clara.png",
    date: "11 / 11 / 2025",
    title: "Kelelahan Berlebihan Meski Sudah Tidur",
    excerpt: "Merasa lelah terus-menerus meskipun sudah...",
    likes: 102,
    comments: 20,
    shares: 10,
    image: "/articles/image2.png",
  },
    {
    author: "Dr. Clara",
    avatar: "/avatars/clara.png",
    date: "11 / 11 / 2025",
    title: "Kelelahan Berlebihan Meski Sudah Tidur",
    excerpt: "Merasa lelah terus-menerus meskipun sudah...",
    likes: 102,
    comments: 20,
    shares: 10,
    image: "/articles/image3.png",
  },
    {
    author: "Dr. Clara",
    avatar: "/avatars/clara.png",
    date: "11 / 11 / 2025",
    title: "Kelelahan Berlebihan Meski Sudah Tidur",
    excerpt: "Merasa lelah terus-menerus meskipun sudah...",
    likes: 102,
    comments: 20,
    shares: 10,
    image: "/articles/image4.png",
  },
];

const trendingTopics = ["Kesehatan Digital", "Olahraga", "Kesehatan Mental", "Diet"];

const popularAuthors = [
  { name: "Dr. Clara", specialty: "Dokter Spesialis Anak", avatar: "/avatars/clara.png" },
  { name: "Dr. Clara", specialty: "Dokter Spesialis Anak", avatar: "/avatars/clara.png" },
  { name: "Dr. Clara", specialty: "Dokter Spesialis Anak", avatar: "/avatars/clara.png" },
];

// --- SUB-KOMPONEN ---

// Kartu Artikel (Kolom Kiri)
const ArticleItem = ({ article }: { article: (typeof articleData)[0] }) => (
  <div className="flex justify-between items-start gap-6 py-6 border-b border-gray-200">
    <div className="flex-grow">
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
        <Image src={article.avatar} alt={article.author} width={24} height={24} className="rounded-full" />
        <span>{article.author}</span>
        <span className="mx-1">·</span>
        <span>{article.date}</span>
      </div>
      <Link href="#" className="group">
        <h3 className="font-bold text-2xl text-gray-900 leading-tight group-hover:text-[#00A991] transition-colors">
          {article.title}
        </h3>
      </Link>
      <p className="text-sm text-gray-600 mt-1 mb-4">{article.excerpt}</p>
      <div className="flex justify-start items-center gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-1.5"><ThumbsUp className="w-4 h-4" /><span>{article.likes}</span></div>
        <div className="flex items-center gap-1.5"><MessageCircle className="w-4 h-4" /><span>{article.comments}</span></div>
        <div className="flex items-center gap-1.5"><ArrowRight className="w-4 h-4" /><span>{article.shares}</span></div>
        <button className="text-gray-500 hover:text-gray-800"><Bookmark className="w-4 h-4" /></button>
      </div>
    </div>
    <div className="w-64 h-40 bg-gray-200 rounded-lg flex-shrink-0">
      {/* Placeholder untuk gambar artikel */}
    </div>
  </div>
);

// Widget Sidebar
const SidebarWidget = ({ title, children, viewMoreLink }: { title: string; children: React.ReactNode; viewMoreLink?: string }) => (
  <div className="bg-gray-50 p-4 rounded-xl">
    <h3 className="font-bold text-gray-900 mb-4">{title}</h3>
    {children}
    {viewMoreLink && (
      <Link href={viewMoreLink} className="flex items-center gap-1 text-xs font-medium text-[#00A991] hover:text-[#008774] transition-colors mt-4">
        Lihat selengkapnya <ChevronRight className="w-3 h-3" />
      </Link>
    )}
  </div>
);

// Item Penulis (di Sidebar)
const AuthorItem = ({ author }: { author: (typeof popularAuthors)[0] }) => (
    <div className="flex justify-between items-center py-2">
        <div className="flex items-center gap-3">
            <Image src={author.avatar} alt={author.name} width={40} height={40} className="rounded-full" />
            <div>
                <p className="font-semibold text-sm text-gray-900">{author.name}</p>
                <p className="text-xs text-gray-500">{author.specialty}</p>
            </div>
        </div>
        <button className="px-4 py-1 text-xs font-semibold bg-white border border-[#00A991] text-[#00A991] rounded-full hover:bg-teal-50 transition">
            Follow
        </button>
    </div>
);


// --- KOMPONEN UTAMA ---

export const Content = () => {
  return (
    <section className="bg-white py-12">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Kolom Kiri: Daftar Artikel */}
          <div className="lg:col-span-2">
            {articleData.map((article, index) => (
              <ArticleItem key={index} article={article} />
            ))}
          </div>

          {/* Kolom Kanan: Sidebar */}
          <aside className="lg:col-span-1 space-y-8">
            <SidebarWidget title="Trending Topik">
              <div className="flex flex-wrap gap-2">
                {trendingTopics.map(topic => (
                  <button key={topic} className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-700 hover:bg-gray-100 transition">
                    {topic}
                  </button>
                ))}
              </div>
            </SidebarWidget>

            <SidebarWidget title="Penulis Populer" viewMoreLink="#">
                <div className="space-y-2">
                    {popularAuthors.map((author, index) => (
                        <AuthorItem key={index} author={author} />
                    ))}
                </div>
            </SidebarWidget>

            <SidebarWidget title="Rekomendasi" viewMoreLink="#">
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
