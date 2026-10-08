'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { useEffect, useState } from 'react';

const campaignSlides = [
  {
    title: 'Temukan layanan kesehatan yang tepat',
    description: 'Bandingkan dokter, klinik, rumah sakit, dan apotek di sekitar Anda.',
    image: '/assets/doctor/clara.png',
    alt: 'Dokter SILK'
  },
  {
    title: 'Informasi kesehatan yang lebih jelas',
    description: 'Mulai dari konsultasi sampai artikel kesehatan dalam satu tempat.',
    image: '/assets/doctor/klarisa.png',
    alt: 'Tenaga kesehatan SILK'
  }
];

export const Campaign = () => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const slide = campaignSlides[activeSlide];

  useEffect(() => {
    if (paused) return;

    const interval = setInterval(() => {
      setActiveSlide((current) => (current + 1) % campaignSlides.length);
    }, 8000);

    return () => clearInterval(interval);
  }, [paused]);

  const showSlide = (direction: number) => {
    setActiveSlide(
      (current) => (current + direction + campaignSlides.length) % campaignSlides.length
    );
  };

  return (
    <section className="w-full border-b border-border bg-white py-8 md:py-12">
      <div className="container mx-auto grid max-w-7xl gap-6 px-4 lg:grid-cols-12">
        <article className="grid gap-8 rounded-xl bg-primary-deep p-6 text-white md:grid-cols-[1fr_240px] md:items-center md:p-10 lg:col-span-8">
          <div>
            <p className="mb-3 text-sm font-semibold tracking-[0.04em] text-white/75">
              Sistem Informasi Layanan Kesehatan
            </p>
            <h1 className="max-w-xl text-3xl font-bold leading-tight md:text-5xl">{slide.title}</h1>
            <p className="mt-4 max-w-lg text-base text-white/85">{slide.description}</p>
            <Link
              href="/doctor"
              className="mt-7 inline-flex h-12 items-center justify-center rounded-md bg-amber px-5 font-semibold text-ink hover:bg-[#e69900]"
            >
              Cari layanan
            </Link>
          </div>

          <div className="relative aspect-square rounded-lg border border-white/40 bg-white/10">
            <Image src={slide.image} alt={slide.alt} fill className="object-cover" priority />
          </div>
        </article>

        <aside className="flex min-h-[260px] flex-col justify-between rounded-xl border border-border bg-surface p-6 lg:col-span-4">
          <div>
            <span className="inline-flex h-6 items-center gap-2 rounded-md border border-amber bg-amber-tint px-2 text-sm font-semibold text-amber-ink">
              <span aria-hidden="true">▣</span>
              Dipromosikan
            </span>
            <h2 className="mt-5 text-2xl font-bold text-ink">Rawat kesehatan tanpa bingung</h2>
            <p className="mt-3 text-ink-muted">
              Dapatkan informasi layanan dan jadwal yang mudah dibandingkan sebelum Anda memilih.
            </p>
          </div>
          <a
            href="#cari-layanan"
            className="mt-6 font-semibold text-primary-hover underline underline-offset-4"
          >
            Lihat penawaran
          </a>
        </aside>
      </div>

      <div className="container mx-auto mt-5 flex max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-2" aria-label="Pilihan hero">
          {campaignSlides.map((item, index) => (
            <button
              key={item.title}
              className={`h-1 w-6 ${activeSlide === index ? 'bg-primary' : 'bg-border-strong'}`}
              onClick={() => setActiveSlide(index)}
              aria-label={`Tampilkan slide ${index + 1}`}
              aria-current={activeSlide === index}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            className="flex h-11 w-11 items-center justify-center rounded-md border border-border-strong hover:border-border-strong"
            onClick={() => showSlide(-1)}
            aria-label="Slide sebelumnya"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            className="flex h-11 w-11 items-center justify-center rounded-md border border-border-strong hover:border-border-strong"
            onClick={() => showSlide(1)}
            aria-label="Slide berikutnya"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <button
            className="flex h-11 w-11 items-center justify-center rounded-md border border-border-strong hover:border-border-strong"
            onClick={() => setPaused((value) => !value)}
            aria-label={paused ? 'Putar otomatisasi' : 'Jeda otomatisasi'}
          >
            {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </section>
  );
};
