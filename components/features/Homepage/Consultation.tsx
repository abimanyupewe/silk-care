import { ChevronRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const specialistServices = [
  { name: 'Spe Mata', iconColor: 'bg-orange-100', icon: '/assets/icon/homepage-service/Eye.svg' },
  { name: 'Spe Kulit', iconColor: 'bg-red-100', icon: '/assets/icon/homepage-service/Skin.svg' },
  { name: 'Spe Anak', iconColor: 'bg-teal-100', icon: '/assets/icon/homepage-service/Boy.svg' },
  {
    name: 'Spe THT',
    iconColor: 'bg-blue-100',
    icon: '/assets/icon/homepage-service/Rhinology.svg'
  },
  {
    name: 'Spe Kandungan',
    iconColor: 'bg-amber-100',
    icon: '/assets/icon/homepage-service/Pregnancy.svg'
  },
  {
    name: 'Spe Penyakit Dalam',
    iconColor: 'bg-indigo-100',
    icon: '/assets/icon/homepage-service/Endocrine.svg'
  }
];

const ServiceItem = ({
  name,
  icon
}: {
  name: string;
  icon: string;
}) => (
  <Link
    href="#"
    className="group flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all duration-300"
  >
    <div className="flex items-center gap-4">
      <Image width={40} height={40} src={icon} alt={name} />
      <span className="font-semibold text-gray-800 text-[16px] md:text-[20px]">{name}</span>
    </div>
    <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-[#00A991] transition-colors" />
  </Link>
);

export const Consultation = () => {
  return (
    <section className="w-full py-20">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Konsultasi Spesialis</h2>
          <Link
            href="/konsultasi"
            className="flex items-center gap-1 text-sm font-medium text-[#00A991] hover:text-[#008774] transition-colors"
          >
            Lihat semua konsultasi
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {specialistServices.map((service) => (
            <ServiceItem
              icon={service.icon}
              key={service.name}
              name={service.name}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
