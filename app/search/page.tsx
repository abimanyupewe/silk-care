import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Search } from 'lucide-react';
import { Footer } from '@/components/shared/Footer';
import { Navbar } from '@/components/shared/Navbar';
import { GET as searchApi } from '@/app/api/v1/search/route';
import {
  popularSearchQueries,
  searchGroupLabels,
  searchGroupOrder,
  type SearchItem
} from '@/lib/search-index';

export const metadata: Metadata = {
  title: 'Hasil pencarian — SILK',
  description: 'Cari dokter, layanan kesehatan, produk apotek, dan artikel di SILK.'
};

export default async function SearchPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = '' } = await searchParams;
  const query = q.trim();
  // Memanggil handler API langsung (tanpa HTTP) agar aturan visibilitas katalog tetap satu.
  const response = await searchApi(
    new Request(`http://localhost/api/v1/search?q=${encodeURIComponent(query)}&limit=20`)
  );
  const failed = !response.ok;
  const results: SearchItem[] = failed
    ? []
    : ((await response.json()) as { data: SearchItem[] }).data;

  const groups = searchGroupOrder
    .map((type) => ({
      type,
      items: results.filter((item) => item.type === type)
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div>
      <Navbar />

      <main className="mx-auto w-full max-w-7xl px-4 py-12 md:py-16">
        <p className="text-sm font-semibold text-primary-hover">Pencarian</p>
        <h1 className="mt-2 text-2xl font-bold text-ink md:text-[32px]">
          {query ? `Hasil untuk “${query}”` : 'Cari layanan kesehatan'}
        </h1>
        <p className="mt-2 text-ink-muted">
          {query
            ? `${results.length} hasil ditemukan.`
            : 'Cari dokter, layanan, produk, atau artikel yang Anda butuhkan.'}
        </p>

        <form action="/search" className="mt-6 flex max-w-2xl gap-2">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-muted"
              aria-hidden="true"
            />
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Cari dokter, klinik, atau obat..."
              aria-label="Cari dokter, klinik, atau obat"
              className="h-12 w-full rounded-md border border-border-strong bg-white pl-10 pr-3 text-base text-ink outline-none placeholder:text-ink-faint focus:border-primary"
            />
          </div>
          <button
            type="submit"
            className="h-12 rounded-md bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-hover"
          >
            Cari
          </button>
        </form>

        {!query ? (
          <div className="mt-10">
            <p className="text-sm font-semibold text-ink-muted">Pencarian populer</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {popularSearchQueries.map((popular) => (
                <Link
                  key={popular}
                  href={`/search?q=${encodeURIComponent(popular)}`}
                  className="flex h-10 items-center rounded-md border border-border-strong px-3 text-sm font-medium text-ink hover:border-primary hover:bg-primary-tint"
                >
                  {popular}
                </Link>
              ))}
            </div>
          </div>
        ) : failed ? (
          <div role="alert" className="mt-10 border border-border bg-surface p-6">
            <p className="font-semibold text-ink">Pencarian sedang bermasalah.</p>
            <p className="mt-2 text-ink-muted">Coba lagi sebentar.</p>
          </div>
        ) : results.length === 0 ? (
          <div className="mt-10 border border-border bg-surface p-6">
            <p className="font-semibold text-ink">Tidak ada hasil untuk “{query}”.</p>
            <p className="mt-2 text-ink-muted">
              Coba kata kunci lain seperti nama dokter, spesialis, atau nama produk.
            </p>
          </div>
        ) : (
          <div className="mt-10 space-y-8">
            {groups.map((group) => (
              <section key={group.type}>
                <h2 className="text-lg font-semibold text-ink">{searchGroupLabels[group.type]}</h2>
                <div className="mt-3 divide-y divide-border border-y border-border">
                  {group.items.map((item) => (
                    <Link
                      key={`${item.type}-${item.id}`}
                      href={item.href}
                      className="flex min-h-16 items-center justify-between gap-4 px-1 py-4 hover:bg-surface"
                    >
                      <span>
                        <span className="block font-semibold text-ink">{item.title}</span>
                        <span className="mt-0.5 block text-sm text-ink-muted">{item.subtitle}</span>
                      </span>
                      <ArrowRight className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
