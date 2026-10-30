import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { SmartImage } from '@/components/shared/SmartImage';
import { formatLongDate } from '@/lib/format';
import type { HomeArticle } from '@/lib/home/types';

// Bagian tanpa data disembunyikan, bukan menampilkan kartu kosong.
export const Article = ({ articles }: { articles: HomeArticle[] }) => {
  if (articles.length === 0) return null;

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
            Lihat semua <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </div>
      </div>
    </section>
  );
};

const ArticleCard = ({ article }: { article: HomeArticle }) => (
  <article className="flex flex-col overflow-hidden rounded-xl border border-border bg-white hover:border-border-strong">
    <Link href={`/article/${article.slug}`} className="group flex flex-grow flex-col">
      <div className="relative aspect-video bg-surface">
        {article.coverImage ? (
          <SmartImage
            src={article.coverImage}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : null}
      </div>

      <div className="flex flex-grow flex-col p-4">
        <div className="mb-3 flex items-center justify-between gap-2 text-sm text-ink-muted">
          <span className="truncate">{article.authorName ?? 'Tim SILK'}</span>
          <time dateTime={article.publishedAt} className="shrink-0">
            {formatLongDate(article.publishedAt)}
          </time>
        </div>
        <h3 className="font-semibold leading-tight text-ink group-hover:text-primary-hover">
          {article.title}
        </h3>
        {article.excerpt ? (
          <p className="mt-1 line-clamp-2 text-sm text-ink-muted">{article.excerpt}</p>
        ) : null}
      </div>
    </Link>
  </article>
);
