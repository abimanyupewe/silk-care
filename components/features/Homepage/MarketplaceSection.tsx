import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ShoppingCart, Star } from 'lucide-react';

type Product = {
  name: string;
  image: string;
  price: string;
  oldPrice?: string;
  sold: number;
  stock: number;
};

const medicineProducts: Product[] = [
  {
    name: 'Vitamin harian untuk keluarga',
    image: '/assets/apotek/Drugs.png',
    price: 'Rp 35.000',
    oldPrice: 'Rp 45.000',
    sold: 124,
    stock: 18
  },
  {
    name: 'Susu nutrisi ibu dan anak',
    image: '/assets/apotek/Mother.png',
    price: 'Rp 85.000',
    sold: 88,
    stock: 12
  },
  {
    name: 'Perawatan kulit sensitif',
    image: '/assets/apotek/Self love.png',
    price: 'Rp 62.000',
    sold: 74,
    stock: 20
  },
  {
    name: 'Kebutuhan kesehatan intim',
    image: '/assets/apotek/Sexual infection.png',
    price: 'Rp 48.000',
    sold: 56,
    stock: 8
  },
  {
    name: 'Suplemen nutrisi harian',
    image: '/assets/apotek/Milk.png',
    price: 'Rp 72.000',
    sold: 103,
    stock: 16
  }
];

const equipmentProducts: Product[] = [
  {
    name: 'Tensimeter digital',
    image: '/assets/apotek/alat1.png',
    price: 'Rp 285.000',
    sold: 42,
    stock: 7
  },
  {
    name: 'Termometer digital',
    image: '/assets/apotek/alat2.png',
    price: 'Rp 75.000',
    oldPrice: 'Rp 95.000',
    sold: 67,
    stock: 15
  },
  {
    name: 'Alat cek kesehatan',
    image: '/assets/apotek/alat3.png',
    price: 'Rp 190.000',
    sold: 31,
    stock: 9
  },
  {
    name: 'Kotak obat rumah',
    image: '/assets/apotek/alat4.png',
    price: 'Rp 55.000',
    sold: 84,
    stock: 22
  },
  {
    name: 'Perlengkapan pertolongan',
    image: '/assets/apotek/alat5.png',
    price: 'Rp 120.000',
    sold: 29,
    stock: 6
  }
];

const categories = ['Semua', 'Vitamin', 'Perawatan diri', 'Ibu dan anak', 'Kesehatan rumah'];

const ProductCard = ({ product }: { product: Product }) => (
  <article className="rounded-xl border border-border bg-white p-3 hover:border-border-strong">
    <div className="relative aspect-square rounded-lg border border-border bg-white">
      <Image src={product.image} alt={product.name} fill className="object-contain p-4" />
    </div>
    <div className="pt-3">
      <h3 className="line-clamp-2 min-h-[48px] text-lg font-semibold leading-tight text-ink">
        {product.name}
      </h3>
      <div className="mt-2 flex items-center gap-2 text-sm text-ink-muted">
        <Star className="h-4 w-4 fill-amber text-amber" aria-hidden="true" />
        <span className="font-semibold text-ink">4,8</span>
        <span>· {product.sold} terjual</span>
      </div>
      <div className="mt-2">
        {product.oldPrice && (
          <p className="text-sm text-ink-muted line-through">{product.oldPrice}</p>
        )}
        <p className="text-xl font-bold text-ink">{product.price}</p>
        <p className="mt-1 text-sm text-ink-muted">Stok {product.stock}</p>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-border-strong hover:border-border-strong"
          aria-label={`Tambah ${product.name} ke keranjang`}
        >
          <ShoppingCart className="h-5 w-5" />
        </button>
        <button className="h-11 flex-1 rounded-md bg-primary px-3 text-sm font-semibold text-white hover:bg-primary-hover">
          Beli
        </button>
      </div>
    </div>
  </article>
);

const MarketplaceSection = ({
  title,
  products,
  surface = false
}: {
  title: string;
  products: Product[];
  surface?: boolean;
}) => (
  <section className={`w-full py-12 md:py-16 ${surface ? 'bg-surface' : 'bg-white'}`}>
    <div className="container mx-auto max-w-7xl px-4">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-ink md:text-[28px]">{title}</h2>
          <p className="mt-1 text-ink-muted">Pilih produk kesehatan dari mitra SILK.</p>
        </div>
        <Link
          href="/apotek"
          className="flex shrink-0 items-center gap-1 text-sm font-semibold text-primary-hover underline underline-offset-4"
        >
          Lihat semua <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {categories.map((category, index) => (
          <button
            key={category}
            className={`h-10 shrink-0 rounded-md border px-4 text-sm font-semibold ${index === 0 ? 'border-2 border-primary bg-primary-tint text-ink' : 'border-border-strong bg-white text-ink'}`}
          >
            {index === 0 && <span aria-hidden="true">✓ </span>}
            {category}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5 lg:gap-4">
        {products.map((product) => (
          <ProductCard key={product.name} product={product} />
        ))}
      </div>
    </div>
  </section>
);

export const MarketplaceSections = () => (
  <>
    <MarketplaceSection title="Aposilk" products={medicineProducts} surface />
    <MarketplaceSection title="SilkShop" products={equipmentProducts} />
  </>
);
