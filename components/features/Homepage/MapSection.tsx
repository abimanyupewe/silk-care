'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { LeafletMap, type MapPoint } from '@/components/shared/LeafletMap';
import { useCurrentLocationSnapshot } from '@/components/shared/CurrentLocation';
import { haversineKm } from '@/lib/geo';
import type { MapPoint as HomeMapPoint } from '@/lib/home/types';

const NEAREST_LIMIT = 6;
const MAP_HEIGHT = 420;

// Jarak dalam format Indonesia: "1,2 km"; di bawah 1 km tampil meter supaya terbaca.
function formatJarak(km: number) {
  if (km < 1) {
    return `${Math.max(50, Math.round((km * 1000) / 50) * 50)} m`;
  }

  return `${new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 }).format(km)} km`;
}

// Bagian peta beranda: "Layanan di sekitar Anda". Peta (Leaflet, JS berat) baru dimuat saat
// bagiannya mendekati viewport; bila pengunjung memberi izin lokasi, enam layanan terdekat
// ditampilkan sebagai daftar berjarak. Tanpa izin, bagian tetap tampil tanpa daftar jarak.
export function MapSection({ points }: { points: HomeMapPoint[] }) {
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  const { fix } = useCurrentLocationSnapshot();

  useEffect(() => {
    const el = sectionRef.current;

    if (!el || inView) {
      return;
    }

    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '300px' }
    );

    observer.observe(el);

    return () => observer.disconnect();
  }, [inView]);

  // Enam layanan terdekat dari posisi pengunjung; tanpa posisi, daftar tidak tampil dan
  // urutan server (katalog) yang dipakai.
  const nearest = useMemo(() => {
    if (!fix) {
      return [];
    }

    return points
      .map((point) => ({
        ...point,
        distanceKm: haversineKm(
          { latitude: fix.lat, longitude: fix.lng },
          { latitude: point.lat, longitude: point.lng }
        )
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, NEAREST_LIMIT);
  }, [fix, points]);

  if (points.length === 0) return null;

  const bounds = points.reduce(
    (acc, point) => ({
      minLat: Math.min(acc.minLat, point.lat),
      maxLat: Math.max(acc.maxLat, point.lat),
      minLng: Math.min(acc.minLng, point.lng),
      maxLng: Math.max(acc.maxLng, point.lng)
    }),
    { minLat: Infinity, maxLat: -Infinity, minLng: Infinity, maxLng: -Infinity }
  );

  const center: MapPoint = {
    lat: (bounds.minLat + bounds.maxLat) / 2,
    lng: (bounds.minLng + bounds.maxLng) / 2
  };

  return (
    <section ref={sectionRef} className="w-full bg-white py-12 md:py-16">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="mb-6 max-w-3xl">
          <h2 className="text-2xl font-bold text-ink md:text-[28px]">Layanan di sekitar Anda</h2>
          <p className="mt-1 text-ink-muted">
            {fix
              ? 'Enam layanan mitra terdekat dari posisi Anda; peta menampilkan seluruh titik mitra.'
              : 'Titik lokasi dokter dan fasilitas mitra SILK. Izinkan lokasi di navbar untuk melihat yang terdekat dari posisi Anda.'}
          </p>
        </div>

        {nearest.length > 0 ? (
          <ul className="mb-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {nearest.map((point) => (
              <li
                key={`${point.title}-${point.lat},${point.lng}`}
                className="flex min-h-11 items-center gap-2 rounded-md border border-border px-3 py-2 text-sm"
              >
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-ink">{point.title}</span>
                  <span className="block truncate text-ink-faint">
                    {point.kind} &middot; {formatJarak(point.distanceKm)} dari Anda
                  </span>
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        {inView ? (
          <LeafletMap
            center={center}
            zoom={12}
            points={points as MapPoint[]}
            height={MAP_HEIGHT}
            className="border border-border"
          />
        ) : (
          <div style={{ height: MAP_HEIGHT }} className="border border-border bg-surface" />
        )}

        <p className="mt-3 text-sm text-ink-muted">
          Menampilkan {points.length} lokasi mitra. Peta memakai data &copy; OpenStreetMap
          contributors.
        </p>
      </div>
    </section>
  );
}
