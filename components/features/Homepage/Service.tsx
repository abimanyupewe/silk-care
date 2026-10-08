import { ChevronRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const serviceItems = [
  {
    title: 'Dokter',
    description: 'Temukan dokter umum hingga spesialis',
    icon: '/assets/icon/homepage-service/Doctor.svg'
  },
  {
    title: 'Ahli Gizi',
    description: 'Konsultasikan kebutuhan nutrisi Anda',
    icon: '/assets/icon/homepage-service/Nutritionist.svg'
  },
  {
    title: 'Katering Sehat',
    description: 'Gaya hidup sehat dengan katering sehat',
    icon: '/assets/icon/homepage-service/Salad.svg'
  },
  {
    title: 'Rumah Sakit',
    description: 'Informasi lengkap tentang rumah sakit',
    icon: '/assets/icon/homepage-service/Hospital.svg'
  },
  {
    title: 'Klinik dan Puskesmas',
    description: 'Informasi lengkap tentang layanan',
    icon: '/assets/icon/homepage-service/Clinic.svg'
  },
  {
    title: 'Laboratorium',
    description: 'Booking layanan laboratorium terdekat',
    icon: '/assets/icon/homepage-service/Chemical.svg'
  }
];

const ServiceCard = ({ title, description, icon }: (typeof serviceItems)[0]) => {
  return (
    <Link
      href="#"
      className="group flex min-h-[88px] items-center justify-between rounded-lg border border-border bg-white p-4 hover:border-border-strong"
    >
      <div className="flex items-center gap-4">
        <Image width={40} height={40} src={icon} alt={title} />
        <div>
          <h3 className="font-semibold text-ink">{title}</h3>
          <p className="mt-1 text-sm text-ink-muted">{description}</p>
        </div>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-primary group-hover:text-primary-hover" />
    </Link>
  );
};

export const Service = () => {
  return (
    <section className="w-full bg-surface py-12 md:py-16">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-ink md:text-[28px]">Layanan kesehatan</h2>
          <p className="mt-1 max-w-2xl text-ink-muted">
            Akses mudah, cepat, dan terintegrasi untuk kebutuhan kesehatan Anda.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {serviceItems.map((service) => (
            <ServiceCard key={service.title} {...service} />
          ))}
        </div>
      </div>
    </section>
  );
};
