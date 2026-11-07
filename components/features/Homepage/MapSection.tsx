'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { LeafletMap, type MapPoint } from '@/components/shared/LeafletMap';
import { useCurrentLocationSnapshot } from '@/components/shared/CurrentLocation';
import { fetchApi } from '@/lib/api-client';
import type { MapPoint as HomeMapPoint } from '@/lib/home/types';
import { selectNearest } from '@/lib/home/nearby';

// Radius jangkauan (garis lurus) = lingkaran di peta = batas daftar.
const RADIUS_KM = 1.5;
const RADIUS_LABEL = `${RADIUS_KM.toLocaleString('id-ID')} km`;
// Mitra di luar lingkaran tetap tampil di peta (abu-abu) sampai jarak ini.
const MAP_RANGE_KM = RADIUS_KM * 3;
const MAP_LIMIT = 20;
const MAP_HEIGHT = 420;

type CatalogItem = {
  id: string;
  slug: string;
  latitude: number | null;
  longitude: number | null;
  distanceKm: number | null;
  photoUrl?: string | null;
  rating?: number | null;
  reviewCount?: number;
  openNow?: boolean;
  name?: string;
  specialty?: string | null;
  user?: { name: string };
};

function formatJarak(km: number) {
  if (km < 1) return `${Math.max(50, Math.round((km * 1000) / 50) * 50)} m`;

  return `${new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 }).format(km)} km`;
}

function toPoint(item: CatalogItem, kind: 'Dokter' | 'Fasilitas'): HomeMapPoint | null {
  if (item.latitude === null || item.longitude === null || item.distanceKm === null) return null;

  const isDoctor = kind === 'Dokter';

  return {
    id: `${isDoctor ? 'doctor' : 'facility'}:${item.id}`,
    lat: item.latitude,
    lng: item.longitude,
    slug: item.slug,
    title: isDoctor ? (item.user?.name ?? 'Dokter SILK') : (item.name ?? 'Fasilitas SILK'),
    kind: isDoctor ? `Dokter${item.specialty ? ` · ${item.specialty}` : ''}` : kind,
    href: isDoctor ? `/doctor/${item.slug}` : `/fasilitas/${item.slug}`,
    distanceKm: item.distanceKm,
    imageUrl: item.photoUrl ?? null,
    rating: item.rating ?? null,
    reviewCount: item.reviewCount ?? 0,
    openNow: item.openNow ?? false
  };
}

export function MapSection({ points }: { points: HomeMapPoint[] }) {
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  const [nearby, setNearby] = useState<HomeMapPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { fix } = useCurrentLocationSnapshot();
  const fixRef = useRef(fix);
  const locationKey = fix ? `${fix.lat.toFixed(3)},${fix.lng.toFixed(3)}` : '';
  fixRef.current = fix;

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || inView) return;
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

  useEffect(() => {
    const currentFix = fixRef.current;
    if (!currentFix || !locationKey) {
      setNearby([]);
      setError('');
      return;
    }

    const controller = new AbortController();
    const query = new URLSearchParams({
      lat: String(currentFix.lat),
      lng: String(currentFix.lng),
      radiusKm: String(MAP_RANGE_KM),
      sort: 'distance_asc',
      limit: String(MAP_LIMIT)
    });
    let cancelled = false;

    setLoading(true);
    setError('');

    void Promise.allSettled([
      fetchApi<CatalogItem[]>(`/doctors?${query}`, { signal: controller.signal }),
      fetchApi<CatalogItem[]>(`/facilities?${query}`, { signal: controller.signal })
    ]).then((results) => {
      if (cancelled) return;

      const doctorResult = results[0];
      const facilityResult = results[1];
      const doctorPoints =
        doctorResult.status === 'fulfilled'
          ? doctorResult.value.data.flatMap((item) => {
              const point = toPoint(item, 'Dokter');
              return point ? [point] : [];
            })
          : [];
      const facilityPoints =
        facilityResult.status === 'fulfilled'
          ? facilityResult.value.data.flatMap((item) => {
              const point = toPoint(item, 'Fasilitas');
              return point ? [point] : [];
            })
          : [];

      setNearby(
        selectNearest([...doctorPoints, ...facilityPoints], MAP_LIMIT).map((point) =>
          (point.distanceKm ?? Infinity) <= RADIUS_KM ? point : { ...point, outOfRange: true }
        )
      );
      if (doctorResult.status === 'rejected' && facilityResult.status === 'rejected') {
        setError('Layanan terdekat gagal dimuat. Coba lagi dengan tombol lokasi.');
      } else if (doctorResult.status === 'rejected' || facilityResult.status === 'rejected') {
        setError('Sebagian layanan gagal dimuat.');
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [locationKey]);

  // Daftar = hanya yang di dalam lingkaran; peta = semua (yang di luar berpin abu-abu).
  const listPoints = useMemo(() => nearby.filter((point) => !point.outOfRange), [nearby]);
  const outOfRangeCount = nearby.length - listPoints.length;
  const visiblePoints = fix ? nearby : points;
  const selectedPoint = visiblePoints.find((point) => point.id === selectedId) ?? null;
  const center = useMemo<MapPoint>(() => {
    if (fix) return { lat: fix.lat, lng: fix.lng };
    if (visiblePoints.length === 0) return { lat: -7.9771, lng: 112.6326 };

    return {
      lat: visiblePoints.reduce((sum, point) => sum + point.lat, 0) / visiblePoints.length,
      lng: visiblePoints.reduce((sum, point) => sum + point.lng, 0) / visiblePoints.length
    };
  }, [fix, visiblePoints]);

  return (
    <section ref={sectionRef} className="w-full bg-white py-12 md:py-16">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="mb-6 max-w-3xl">
          <h2 className="text-2xl font-bold text-ink md:text-[28px]">Layanan di sekitar Anda</h2>
          <p className="mt-1 text-ink-muted">
            {fix
              ? `Layanan dalam radius ${RADIUS_LABEL} dari posisi Anda.`
              : 'Temukan dokter dan fasilitas kesehatan mitra SILK di sekitar Anda.'}
          </p>
        </div>

        {fix && loading ? (
          <p className="mb-4 text-sm text-ink-muted">Memuat layanan terdekat...</p>
        ) : null}
        {error ? <p className="mb-4 text-sm text-danger">{error}</p> : null}
        {fix && !loading && listPoints.length === 0 && !error ? (
          <p className="mb-4 border border-border bg-surface px-4 py-3 text-sm text-ink-muted">
            Belum ada layanan mitra aktif dalam radius {RADIUS_LABEL}
            {outOfRangeCount > 0
              ? '; mitra terdekat di luar jangkauan tampil abu-abu di peta.'
              : '.'}
          </p>
        ) : null}

        {fix && !loading && listPoints.length > 0 ? (
          <ul className="mb-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {listPoints.map((point) => (
              <li key={point.id}>
                <div
                  className={`flex min-h-11 w-full items-center justify-between gap-3 border px-3 py-2 text-left text-sm ${selectedId === point.id ? 'border-primary bg-primary-tint' : 'border-border bg-white'}`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedId(point.id)}
                    className="min-w-0 flex-1 text-left hover:text-primary-deep"
                  >
                    <span className="block truncate font-semibold text-ink">{point.title}</span>
                    <span className="block truncate text-ink-faint">
                      {point.kind} · {formatJarak(point.distanceKm ?? 0)} dari Anda
                    </span>
                  </button>
                  <Link href={point.href} className="btn btn-outline btn-sm shrink-0 rounded-none">
                    Detail
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        ) : null}

        {inView ? (
          <LeafletMap
            center={center}
            zoom={fix ? 13 : 12}
            points={visiblePoints as MapPoint[]}
            activePointId={selectedPoint?.id ?? null}
            onPointSelect={(point) => setSelectedId(point.id ?? null)}
            radiusKm={fix ? RADIUS_KM : undefined}
            height={MAP_HEIGHT}
            className="border border-border"
          />
        ) : (
          <div style={{ height: MAP_HEIGHT }} className="border border-border bg-surface" />
        )}

        {fix ? (
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-muted">
            <li className="flex items-center gap-2">
              <span aria-hidden="true" className="h-3 w-3 rounded-full bg-primary" />
              Dalam radius {RADIUS_LABEL} ({listPoints.length})
            </li>
            <li className="flex items-center gap-2">
              <span aria-hidden="true" className="h-3 w-3 rounded-full bg-ink-faint" />
              Di luar jangkauan, hanya di peta ({outOfRangeCount})
            </li>
          </ul>
        ) : null}
        <p className="mt-2 text-sm text-ink-muted">
          Menampilkan {visiblePoints.length} lokasi mitra. Peta memakai data &copy; OpenStreetMap
          contributors.
        </p>
      </div>
    </section>
  );
}
