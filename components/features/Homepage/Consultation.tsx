import { ChevronRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const specialistServices = [
  { name: 'Spesialis mata', icon: '/assets/icon/homepage-service/Eye.svg' },
  { name: 'Spesialis kulit', icon: '/assets/icon/homepage-service/Skin.svg' },
  { name: 'Spesialis anak', icon: '/assets/icon/homepage-service/Boy.svg' },
  {
    name: 'Spesialis THT',
    icon: '/assets/icon/homepage-service/Rhinology.svg'
  },
  {
    name: 'Spesialis kandungan',
    icon: '/assets/icon/homepage-service/Pregnancy.svg'
  },
  {
    name: 'Spesialis penyakit dalam',
    icon: '/assets/icon/homepage-service/Endocrine.svg'
  }
];

const ServiceItem = ({ name, icon }: { name: string; icon: string }) => (
  <Link
    href="#"
    className="group flex h-[72px] items-center justify-between rounded-lg border border-border bg-white px-4 hover:border-border-strong"
  >
    <div className="flex items-center gap-4">
      <Image width={32} height={32} src={icon} alt="" aria-hidden="true" />
      <span className="text-lg font-semibold text-ink">{name}</span>
    </div>
    <ChevronRight className="h-5 w-5 text-primary group-hover:text-primary-hover" />
  </Link>
);

export const Consultation = () => {
  return (
    <section className="w-full bg-white py-12 md:py-16">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-ink md:text-[28px]">Konsultasi spesialis</h2>
            <p className="mt-1 text-ink-muted">Pilih bidang konsultasi sesuai kebutuhan Anda.</p>
          </div>
          <Link
            href="/konsultasi"
            className="flex shrink-0 items-center gap-1 text-sm font-semibold text-primary-hover underline underline-offset-4"
          >
            Lihat semua
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {specialistServices.map((service) => (
            <ServiceItem icon={service.icon} key={service.name} name={service.name} />
          ))}
        </div>
      </div>
    </section>
  );
};
