'use client';

import Image from 'next/image';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { useEffect, useState } from 'react';

const promoPages = [
  [
    {
      title: 'Periksa kesehatan lebih awal',
      description: 'Temukan layanan pemeriksaan terdekat.',
      image: '/assets/home/rumah-sakit/saifulanwar.png'
    },
    {
      title: 'Konsultasi sesuai kebutuhan',
      description: 'Jadwal dokter transparan dalam satu tempat.',
      image: '/assets/home/rumah-sakit/rs2.png'
    }
  ],
  [
    {
      title: 'Pilihan layanan untuk keluarga',
      description: 'Bandingkan informasi sebelum berkunjung.',
      image: '/assets/home/rumah-sakit/rs1.png'
    },
    {
      title: 'Kesehatan di sekitar Anda',
      description: 'Cari fasilitas berdasarkan lokasi.',
      image: '/assets/home/rumah-sakit/rs4.png'
    }
  ]
];

export const Promo = () => {
  const [activePage, setActivePage] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const interval = setInterval(
      () => setActivePage((page) => (page + 1) % promoPages.length),
      8000
    );
    return () => clearInterval(interval);
  }, [paused]);

  const changePage = (direction: number) => {
    setActivePage((page) => (page + direction + promoPages.length) % promoPages.length);
  };

  return (
    <section className="w-full bg-white py-12 md:py-16">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-ink md:text-[28px]">Promo hari ini</h2>
            <p className="mt-1 text-ink-muted">Penawaran pilihan dari mitra SILK.</p>
          </div>
          <div className="flex gap-2">
            <button
              className="flex h-11 w-11 items-center justify-center rounded-md border border-border-strong hover:border-border-strong"
              onClick={() => changePage(-1)}
              aria-label="Promo sebelumnya"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              className="flex h-11 w-11 items-center justify-center rounded-md border border-border-strong hover:border-border-strong"
              onClick={() => changePage(1)}
              aria-label="Promo berikutnya"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <button
              className="flex h-11 w-11 items-center justify-center rounded-md border border-border-strong hover:border-border-strong"
              onClick={() => setPaused((value) => !value)}
              aria-label={paused ? 'Putar promo otomatis' : 'Jeda promo otomatis'}
            >
              {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-border">
          <div
            className="flex transition-transform duration-300"
            style={{ transform: `translateX(-${activePage * 100}%)` }}
          >
            {promoPages.map((page, pageIndex) => (
              <div
                key={pageIndex}
                className="grid w-full shrink-0 grid-cols-1 gap-4 p-4 md:grid-cols-2"
              >
                {page.map((promo) => (
                  <article
                    key={promo.title}
                    className="grid aspect-video grid-cols-[1fr_42%] overflow-hidden rounded-lg border border-border bg-surface text-ink"
                  >
                    <div className="flex flex-col justify-between p-5">
                      <div>
                        <span className="inline-flex h-6 items-center rounded-md border border-amber bg-amber-tint px-2 text-sm font-semibold text-amber-ink">
                          Dipromosikan
                        </span>
                        <h3 className="mt-4 text-xl font-bold leading-tight">{promo.title}</h3>
                        <p className="mt-2 text-sm text-ink-muted">{promo.description}</p>
                      </div>
                      <a
                        href="#cari-layanan"
                        className="mt-4 text-sm font-semibold text-primary-hover underline underline-offset-4"
                      >
                        Lihat detail
                      </a>
                    </div>
                    <div className="relative border-l border-border">
                      <Image src={promo.image} alt="" fill className="object-cover" />
                    </div>
                  </article>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center gap-2" aria-label="Indikator promo">
          {promoPages.map((_, index) => (
            <button
              key={index}
              className={`h-1 w-6 ${activePage === index ? 'bg-primary' : 'bg-border-strong'}`}
              onClick={() => setActivePage(index)}
              aria-label={`Tampilkan promo ${index + 1}`}
              aria-current={activePage === index}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
