import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BadgeCheck, CalendarDays, MapPin, Star } from 'lucide-react';

const doctors = [
  {
    name: 'dr. Clara Anindita',
    specialty: 'Dokter umum',
    image: '/assets/doctor/clara.png',
    price: 'Rp 75.000',
    oldPrice: 'Rp 100.000',
    patients: 128,
    schedule: '09.00 - 15.00',
    distance: '0,8 km'
  },
  {
    name: 'dr. Klarisa Putri',
    specialty: 'Spesialis kulit',
    image: '/assets/doctor/klarisa.png',
    price: 'Rp 150.000',
    patients: 96,
    schedule: '10.00 - 16.00',
    distance: '1,2 km'
  },
  {
    name: 'dr. Thomas Wijaya',
    specialty: 'Spesialis penyakit dalam',
    image: '/assets/doctor/thomas.png',
    price: 'Rp 175.000',
    oldPrice: 'Rp 200.000',
    patients: 214,
    schedule: '08.00 - 13.00',
    distance: '1,8 km'
  },
  {
    name: 'dr. Santika Dewi',
    specialty: 'Spesialis anak',
    image: '/assets/doctor/santika.png',
    price: 'Rp 125.000',
    patients: 184,
    schedule: '13.00 - 18.00',
    distance: '2,1 km'
  },
  {
    name: 'dr. Ambri Nugraha',
    specialty: 'Spesialis mata',
    image: '/assets/doctor/Ambri.png',
    price: 'Rp 160.000',
    patients: 75,
    schedule: '09.00 - 14.00',
    distance: '2,4 km'
  },
  {
    name: 'dr. Angline Sari',
    specialty: 'Spesialis kandungan',
    image: '/assets/doctor/angline.png',
    price: 'Rp 180.000',
    patients: 143,
    schedule: '14.00 - 19.00',
    distance: '3,0 km'
  }
];

export const DoctorRecommendations = () => (
  <section className="w-full bg-white py-12 md:py-16">
    <div className="container mx-auto max-w-7xl px-4">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-ink md:text-[28px]">Dokter pilihan</h2>
          <p className="mt-1 text-ink-muted">
            Informasi jadwal dan biaya sebelum Anda membuat janji.
          </p>
        </div>
        <Link
          href="/doctor"
          className="flex shrink-0 items-center gap-1 text-sm font-semibold text-primary-hover underline underline-offset-4"
        >
          Lihat semua <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {doctors.map((doctor) => (
          <article
            key={doctor.name}
            className="rounded-xl border border-border bg-white p-4 hover:border-border-strong"
          >
            <div className="flex gap-4">
              <Image
                src={doctor.image}
                alt={doctor.name}
                width={72}
                height={72}
                className="h-[72px] w-[72px] shrink-0 rounded-full border border-border object-cover"
              />
              <div className="min-w-0">
                <div className="flex items-start gap-2">
                  <h3 className="line-clamp-2 text-lg font-semibold leading-tight text-ink">
                    {doctor.name}
                  </h3>
                  <BadgeCheck
                    className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                    aria-label="Terverifikasi"
                  />
                </div>
                <p className="mt-1 text-sm text-ink-muted">{doctor.specialty}</p>
                <div className="mt-2 flex items-center gap-1 text-sm">
                  <Star className="h-4 w-4 fill-amber text-amber" aria-hidden="true" />
                  <strong>4,9</strong>
                  <span className="text-ink-muted">({doctor.patients} pasien)</span>
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-2 border-t border-border pt-3 text-sm text-ink-muted">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" /> Jadwal {doctor.schedule}
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" /> {doctor.distance} dari Anda
              </div>
            </div>

            <div className="mt-4 flex items-end justify-between gap-3">
              <div>
                {doctor.oldPrice && (
                  <p className="text-sm text-ink-muted line-through">{doctor.oldPrice}</p>
                )}
                <p className="text-xl font-bold text-ink">{doctor.price}</p>
              </div>
              <Link
                href="/doctor"
                className="flex h-11 items-center justify-center rounded-md border border-border-strong px-3 text-sm font-semibold hover:border-border-strong hover:bg-surface"
              >
                Lihat jadwal
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  </section>
);
