import Link from 'next/link';
import {
  ArrowRight,
  Building2,
  ChevronRight,
  FileText,
  FlaskConical,
  MapPin,
  Pill,
  ReceiptText,
  Salad,
  ShieldCheck,
  Stethoscope,
  type LucideIcon
} from 'lucide-react';

const serviceItems: {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
}[] = [
  {
    title: 'Dokter & konsultasi',
    description: 'Temukan dokter umum hingga spesialis',
    icon: Stethoscope,
    href: '/doctor'
  },
  {
    title: 'Apotek & obat',
    description: 'Beli obat dan produk kesehatan',
    icon: Pill,
    href: '/apotek'
  },
  {
    title: 'Klinik & rumah sakit',
    description: 'Bandingkan fasilitas dan jadwal layanan',
    icon: Building2,
    href: '/#cari-layanan'
  },
  {
    title: 'Laboratorium',
    description: 'Booking pemeriksaan penunjang terdekat',
    icon: FlaskConical,
    href: '/#cari-layanan'
  },
  {
    title: 'Ahli gizi & katering',
    description: 'Konsultasi nutrisi dan gaya hidup sehat',
    icon: Salad,
    href: '/#cari-layanan'
  },
  {
    title: 'Artikel & edukasi',
    description: 'Baca tips kesehatan dari para ahli',
    icon: FileText,
    href: '/article'
  }
];

const trustItems: { icon: LucideIcon; label: string }[] = [
  { icon: ShieldCheck, label: 'Dokter terdaftar' },
  { icon: ReceiptText, label: 'Harga transparan' },
  { icon: MapPin, label: 'Fokus area Malang' }
];

const ServiceCard = ({ title, description, icon: Icon, href }: (typeof serviceItems)[0]) => (
  <Link
    href={href}
    className="group flex min-h-[88px] items-center justify-between gap-4 rounded-lg border border-border bg-white p-4 transition-colors hover:border-primary"
  >
    <div className="flex items-center gap-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary-tint text-primary">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div>
        <h3 className="font-semibold text-ink">{title}</h3>
        <p className="mt-1 text-sm text-ink-muted">{description}</p>
      </div>
    </div>
    <ChevronRight
      className="h-5 w-5 shrink-0 text-primary transition-colors group-hover:text-primary-hover"
      aria-hidden="true"
    />
  </Link>
);

export const Hero = () => {
  return (
    <section
      aria-labelledby="hero-title"
      className="w-full border-b border-border bg-white py-10 md:py-14"
    >
      <div className="container mx-auto max-w-7xl px-4">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold tracking-[0.04em] text-primary-hover">
            Layanan kesehatan · Malang
          </p>
          <h1
            id="hero-title"
            className="mt-3 text-3xl font-bold leading-tight text-ink md:text-5xl"
          >
            Semua layanan kesehatan Malang, dalam satu tempat.
          </h1>
          <p className="mt-4 max-w-2xl text-base text-ink-muted md:text-lg">
            Bandingkan dokter, fasilitas, apotek, dan edukasi kesehatan — tanpa perlu berpindah
            situs.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              href="/search"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-primary px-5 font-semibold text-white hover:bg-primary-hover"
            >
              Mulai cari
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/doctor"
              className="inline-flex h-12 items-center justify-center rounded-md border border-border-strong px-5 font-semibold text-ink hover:border-primary hover:bg-surface"
            >
              Lihat dokter
            </Link>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 md:mt-10 lg:grid-cols-3">
          {serviceItems.map((service) => (
            <ServiceCard key={service.title} {...service} />
          ))}
        </div>

        <ul className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-border pt-5">
          {trustItems.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-2 text-sm font-medium text-ink-muted">
              <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
              {label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};
