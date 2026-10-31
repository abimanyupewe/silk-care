import Link from 'next/link';
import { ArrowRight, Package } from 'lucide-react';
import { SmartImage } from '@/components/shared/SmartImage';
import { formatRupiah } from '@/lib/format';
import type { HomeProduct } from '@/lib/home/types';

const ProductCard = ({ product }: { product: HomeProduct }) => (
  <article className="rounded-xl border border-border bg-white p-3 hover:border-border-strong">
    <Link href={`/apotek/${product.slug}`} className="group block">
      <div className="relative flex aspect-square items-center justify-center rounded-lg border border-border bg-white">
        {product.image ? (
          <SmartImage
            src={product.image}
            alt={product.name}
            fill
            className="object-contain p-4"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
          />
        ) : (
          <Package className="h-10 w-10 text-ink-faint" aria-label="Tanpa gambar" />
        )}
      </div>
      <div className="pt-3">
        <h3 className="line-clamp-2 min-h-[48px] text-lg font-semibold leading-tight text-ink group-hover:text-primary-hover">
          {product.name}
        </h3>
        <p className="mt-1 truncate text-sm text-ink-muted">{product.facilityName}</p>
        <p className="mt-2 text-xl font-bold text-ink">{formatRupiah(product.price)}</p>
      </div>
    </Link>
  </article>
);

// Bagian tanpa data disembunyikan, bukan menampilkan kartu kosong.
export const MarketplaceSections = ({ products }: { products: HomeProduct[] }) => {
  if (products.length === 0) return null;

  return (
    <section className="w-full bg-surface py-12 md:py-16">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-ink md:text-[28px]">Produk apotek</h2>
            <p className="mt-1 text-ink-muted">Pilih produk kesehatan dari apotek mitra SILK.</p>
          </div>
          <Link
            href="/apotek"
            className="flex shrink-0 items-center gap-1 text-sm font-semibold text-primary-hover underline underline-offset-4"
          >
            Lihat semua <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-4">
          {products.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
};
