import { ChevronRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const serviceItems = [
  {
    title: 'Dokter',
    description: 'Temukan dokter umum hingga spesialis',
    iconBg: 'bg-blue-200',
    variant: 'primary',
    icon: "/assets/icon/homepage-service/Doctor.svg"
  },
  {
    title: 'Ahli Gizi',
    description: 'Konsultasikan kebutuhan nutrisi Anda',
    iconBg: 'bg-red-200',
    variant: 'secondary',
    icon: "/assets/icon/homepage-service/Nutritionist.svg"
  },
  {
    title: 'Katering Sehat',
    description: 'Gaya hidup sehat dengan katering sehat',
    iconBg: 'bg-green-200',
    variant: 'secondary',
    icon: "/assets/icon/homepage-service/Salad.svg"
  },
  {
    title: 'Rumah Sakit',
    description: 'Informasi lengkap tentang rumah sakit',
    iconBg: 'bg-teal-200',
    variant: 'primary',
    icon: "/assets/icon/homepage-service/Hospital.svg"
  },
  {
    title: 'Klinik dan Puskesmas',
    description: 'Informasi lengkap tentang layanan',
    iconBg: 'bg-sky-200',
    variant: 'primary',
    icon: "/assets/icon/homepage-service/Clinic.svg"
  },
  {
    title: 'Laboratorium',
    description: 'Booking layanan laboratorium terdekat',
    iconBg: 'bg-pink-200',
    variant: 'secondary',
    icon: "/assets/icon/homepage-service/Chemical.svg"
  }
];

const ServiceCard = ({ title, description, icon, variant }: (typeof serviceItems)[0]) => {
  const isPrimary = variant === 'primary';

  return (
    <Link
      href="#"
      className={`group flex items-center justify-between p-5 rounded-2xl transition-all duration-300 ${
        isPrimary
          ? 'bg-[#00A991] text-white shadow-lg hover:shadow-xl hover:-translate-y-1'
          : 'bg-slate-50 text-gray-800 hover:bg-slate-100'
      }`}
    >
      <div className="flex items-center gap-4">
        <Image width={40} height={40} src={icon} alt={title} />
        <div>
          <h3 className="font-bold">{title}</h3>
          <p className={`text-sm ${isPrimary ? 'text-white/80' : 'text-gray-500'}`}>
            {description}
          </p>
        </div>
      </div>
      <ChevronRight
        className={`h-6 w-6 flex-shrink-0 transition-transform group-hover:translate-x-1 ${
          isPrimary ? 'text-white/70' : 'text-gray-400'
        }`}
      />
    </Link>
  );
};

export const Service = () => {
  return (
    <section className="w-full py-16">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
          <div className="lg:col-span-1 text-center lg:text-left">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Layanan Kesehatan</h2>
            <p className="text-gray-600 text-lg">
              Akses Mudah, Cepat, dan Terintegrasi untuk Kesehatan Anda
            </p>
          </div>

          <div className="lg:col-span-2">
            <div className="flex flex-col gap-4">
              <div className="flex justify-start">
                <div className="w-full sm:w-[95%] grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ServiceCard {...serviceItems[0]} />
                  <ServiceCard {...serviceItems[1]} />
                </div>
              </div>

              <div className="flex justify-start sm:justify-end">
                <div className="w-full sm:w-[95%] grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ServiceCard {...serviceItems[2]} />
                  <ServiceCard {...serviceItems[3]} />
                </div>
              </div>

              <div className="flex justify-start">
                <div className="w-full sm:w-[95%] grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ServiceCard {...serviceItems[4]} />
                  <ServiceCard {...serviceItems[5]} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
