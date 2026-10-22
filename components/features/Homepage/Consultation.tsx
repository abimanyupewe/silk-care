import Link from 'next/link';
import {
  Activity,
  Baby,
  ChevronRight,
  Eye,
  HeartPulse,
  Sparkles,
  Stethoscope,
  type LucideIcon
} from 'lucide-react';

const specialistServices: {
  name: string;
  icon: LucideIcon;
  href: string;
}[] = [
  {
    name: 'Dokter umum',
    icon: Stethoscope,
    href: '/search?q=Dokter%20umum'
  },
  {
    name: 'Spesialis anak',
    icon: Baby,
    href: '/search?q=Spesialis%20anak'
  },
  {
    name: 'Spesialis kulit',
    icon: Sparkles,
    href: '/search?q=Spesialis%20kulit'
  },
  {
    name: 'Spesialis mata',
    icon: Eye,
    href: '/search?q=Spesialis%20mata'
  },
  {
    name: 'Spesialis kandungan',
    icon: HeartPulse,
    href: '/search?q=Spesialis%20kandungan'
  },
  {
    name: 'Spesialis penyakit dalam',
    icon: Activity,
    href: '/search?q=Spesialis%20penyakit%20dalam'
  }
];

const ServiceItem = ({ name, icon: Icon, href }: (typeof specialistServices)[0]) => (
  <Link
    href={href}
    className="group flex min-h-[76px] items-center justify-between gap-3 rounded-lg border border-border bg-white p-3 transition-colors hover:border-primary md:p-4"
  >
    <div className="flex min-w-0 items-center gap-3 md:gap-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary-tint text-primary md:h-10 md:w-10">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="text-sm font-semibold leading-snug text-ink md:text-lg">{name}</span>
    </div>
    <ChevronRight
      className="h-5 w-5 shrink-0 text-primary transition-colors group-hover:text-primary-hover"
      aria-hidden="true"
    />
  </Link>
);

export const Consultation = () => {
  return (
    <section className="w-full bg-surface py-12 md:py-16">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-ink md:text-[28px]">Konsultasi spesialis</h2>
            <p className="mt-1 text-ink-muted">
              Pilih spesialis, lalu bandingkan jadwal dan biaya sebelum membuat janji.
            </p>
          </div>
          <Link
            href="/doctor"
            className="flex shrink-0 items-center gap-1 text-sm font-semibold text-primary-hover underline underline-offset-4"
          >
            Lihat semua
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
          {specialistServices.map((service) => (
            <ServiceItem key={service.name} {...service} />
          ))}
        </div>
      </div>
    </section>
  );
};
