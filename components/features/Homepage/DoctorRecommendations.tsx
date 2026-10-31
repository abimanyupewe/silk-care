import Link from 'next/link';
import { ArrowRight, BadgeCheck, Briefcase, CalendarDays, MapPin, Star } from 'lucide-react';
import { Avatar } from '@/components/shared/Avatar';
import { formatRatingId, formatRupiah } from '@/lib/format';
import type { HomeDoctor } from '@/lib/home/types';

// Bagian tanpa data disembunyikan, bukan menampilkan kartu kosong.
export const DoctorRecommendations = ({ doctors }: { doctors: HomeDoctor[] }) => {
  if (doctors.length === 0) return null;

  return (
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
            Lihat semua <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {doctors.map((doctor) => (
            <article
              key={doctor.slug}
              className="rounded-xl border border-border bg-white p-4 hover:border-border-strong"
            >
              <div className="flex gap-4">
                <Avatar src={doctor.photoUrl} name={doctor.name} size={72} />
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
                    {doctor.rating !== null ? (
                      <>
                        <Star className="h-4 w-4 fill-amber text-amber" aria-hidden="true" />
                        <strong>{formatRatingId(doctor.rating)}</strong>
                        <span className="text-ink-muted">({doctor.reviewCount} ulasan)</span>
                      </>
                    ) : (
                      <span className="text-ink-muted">Belum ada ulasan</span>
                    )}
                  </div>
                </div>
              </div>

              <ul className="mt-4 grid gap-2 border-t border-border pt-3 text-sm text-ink-muted">
                <li className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  {doctor.todaySchedule
                    ? `Hari ini ${doctor.todaySchedule}`
                    : 'Tidak praktik hari ini'}
                </li>
                {doctor.experienceYears ? (
                  <li className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                    {doctor.experienceYears} tahun pengalaman
                  </li>
                ) : null}
                {doctor.city ? (
                  <li className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                    {doctor.city}
                  </li>
                ) : null}
              </ul>

              <div className="mt-4 flex items-end justify-between gap-3">
                <div>
                  <p className="text-sm text-ink-muted">Biaya konsultasi</p>
                  <p className="text-xl font-bold text-ink">
                    {doctor.fee !== null ? formatRupiah(doctor.fee) : 'Belum diatur'}
                  </p>
                </div>
                <Link
                  href={`/doctor/${doctor.slug}`}
                  className="flex h-11 items-center justify-center rounded-md border border-border-strong px-3 text-sm font-semibold hover:bg-surface"
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
};
