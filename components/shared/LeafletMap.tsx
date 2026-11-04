'use client';

import { useEffect, useRef, useState } from 'react';
import { LocateFixed } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import type { Circle, LayerGroup, Map as LeafletMapInstance, Marker } from 'leaflet';
import { requestCurrentFix, useCurrentFix } from './CurrentLocation';

export type MapPoint = {
  lat: number;
  lng: number;
};

type LeafletMapProps = {
  center?: MapPoint;
  zoom?: number;
  // Titik-titik statis untuk menampilkan banyak lokasi sekaligus (mode pin Lihat).
  points?: MapPoint[];
  // Mode geser: pin tunggal yang bisa digeser; perubahan titik dikirim lewat onPointChange.
  draggable?: boolean;
  onPointChange?: (point: MapPoint) => void;
  height?: number;
  className?: string;
};

// Peta Leaflet + tile OpenStreetMap. URL tile datang dari env (NEXT_PUBLIC_TILE_URL)
// supaya penyedia tile mudah diganti; atribusi "© OpenStreetMap contributors" wajib selalu
// terlihat dan Leaflet memuat tile viewport aktif saja (tanpa prefetch).
export function LeafletMap({
  center,
  zoom = 14,
  points = [],
  draggable = false,
  onPointChange,
  height = 320,
  className
}: LeafletMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMapInstance | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const layerRef = useRef<LayerGroup | null>(null);
  const userMarkerRef = useRef<Marker | null>(null);
  // Lingkaran keyakinan: radius = akurasi laporan peramban (meter). Posisi IP/WiFi yang
  // meleset akan terlihat dari lingkarannya yang besar, bukan terasa "salah" diam-diam.
  const accuracyCircleRef = useRef<Circle | null>(null);
  // Ditata saat tombol "Pusatkan lokasi" diklik sebelum posisi ada: fix berikutnya
  // langsung diterbangkan ke zoom 16, bukan sekadar digeser pusatnya.
  const flyOnNextFixRef = useRef(false);
  // Peta hanya dipusatkan sekali ke lokasi pengguna; perbaikan posisi berikutnya cukup
  // memindahkan penandanya supaya geseran/zoom pengunjung tidak dilawan.
  const centeredToUserRef = useRef(false);
  const onPointChangeRef = useRef(onPointChange);
  const [ready, setReady] = useState(false);
  // Posisi terkini dari pelacak navbar (kalau izin sudah diberikan); null = belum ada.
  const userFix = useCurrentFix();

  onPointChangeRef.current = onPointChange;

  // Peta dibuat sekali; data berubah lewat effect di bawah, bukan membangun ulang peta.
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const L = await import('leaflet');

      if (cancelled || !containerRef.current) {
        return;
      }

      const tileUrl =
        process.env.NEXT_PUBLIC_TILE_URL?.trim() ||
        'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

      const map = L.map(containerRef.current, {
        zoomControl: true,
        scrollWheelZoom: false,
        attributionControl: true
      }).setView([center?.lat ?? -7.9771, center?.lng ?? 112.6326], zoom);

      L.tileLayer(tileUrl, {
        attribution: '&#169; OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map);

      mapRef.current = map;
      setReady(true);
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
      layerRef.current = null;
      userMarkerRef.current = null;
      accuracyCircleRef.current = null;
      centeredToUserRef.current = false;
    };
    // center/zoom awal dibaca sekali saat peta dibuat; pembaruan titik lewat effect lain.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pin yang bisa digeser: dibuat sekali, posisinya mengikuti center dari luar.
  useEffect(() => {
    if (!ready || !draggable || !center) {
      return;
    }

    void (async () => {
      const L = await import('leaflet');
      const map = mapRef.current;

      if (!map) {
        return;
      }

      if (!markerRef.current) {
        const marker = L.marker([center.lat, center.lng], {
          draggable: true,
          icon: L.divIcon({
            className: '',
            html: '<span aria-hidden="true" class="block h-4 w-4 rounded-full border-2 border-white bg-primary"></span>',
            iconSize: [16, 16],
            iconAnchor: [8, 8]
          }),
          keyboard: false
        });

        marker.on('dragend', () => {
          const position = marker.getLatLng();
          onPointChangeRef.current?.({ lat: position.lat, lng: position.lng });
        });

        marker.addTo(map);
        markerRef.current = marker;
      } else {
        markerRef.current.setLatLng([center.lat, center.lng]);
      }

      map.setView([center.lat, center.lng], map.getZoom());
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, draggable, center?.lat, center?.lng]);

  // Titik statis: layer group dipembersihkan dan digambar ulang tiap data masuk.
  useEffect(() => {
    if (!ready || draggable) {
      return;
    }

    void (async () => {
      const L = await import('leaflet');
      const map = mapRef.current;

      if (!map) {
        return;
      }

      if (!layerRef.current) {
        layerRef.current = L.layerGroup().addTo(map);
      }

      layerRef.current.clearLayers();

      for (const point of points) {
        L.marker([point.lat, point.lng], {
          icon: L.divIcon({
            className: '',
            html: '<span aria-hidden="true" class="block h-4 w-4 rounded-full border-2 border-white bg-primary"></span>',
            iconSize: [16, 16],
            iconAnchor: [8, 8]
          }),
          keyboard: false
        }).addTo(layerRef.current);
      }
    })();
  }, [ready, draggable, points]);

  // Penanda "Lokasi saya": muncul begitu posisi terbaca, ikut bergerak realtime, dan peta
  // dipusatkan sekali ke titik tersebut (zoom tetap, cukup digeser pusatnya).
  useEffect(() => {
    if (!ready || !userFix) {
      return;
    }

    void (async () => {
      const L = await import('leaflet');
      const map = mapRef.current;

      if (!map) {
        return;
      }

      if (!userMarkerRef.current) {
        const userMarker = L.marker([userFix.lat, userFix.lng], {
          icon: L.divIcon({
            className: '',
            html: '<span aria-hidden="true" class="block h-4 w-4 rounded-full border-2 border-white bg-blue-600"></span>',
            iconSize: [16, 16],
            iconAnchor: [8, 8]
          }),
          keyboard: false
        });

        // Klik penanda lokasi: perbesar langsung ke titik tersebut (zoom 16, sekitar
        // skala jalan). Posisi dibaca dari marker supaya selalu titik terakhir, bukan
        // titik saat marker dibuat.
        userMarker.on('click', () => {
          const position = userMarker.getLatLng();

          map.flyTo([position.lat, position.lng], 16);
        });

        userMarkerRef.current = userMarker
          .bindTooltip(`Lokasi saya (± ${userFix.accuracy} m)`)
          .addTo(map);

        accuracyCircleRef.current = L.circle([userFix.lat, userFix.lng], {
          radius: userFix.accuracy,
          color: '#2563eb',
          weight: 1,
          opacity: 0.4,
          fillColor: '#2563eb',
          fillOpacity: 0.08,
          interactive: false
        }).addTo(map);
      } else {
        userMarkerRef.current.setLatLng([userFix.lat, userFix.lng]);
        userMarkerRef.current.setTooltipContent(`Lokasi saya (± ${userFix.accuracy} m)`);
        accuracyCircleRef.current?.setLatLng([userFix.lat, userFix.lng]);
        accuracyCircleRef.current?.setRadius(userFix.accuracy);
      }

      if (!centeredToUserRef.current) {
        centeredToUserRef.current = true;

        if (flyOnNextFixRef.current) {
          flyOnNextFixRef.current = false;
          map.flyTo([userFix.lat, userFix.lng], 16);
        } else {
          map.panTo([userFix.lat, userFix.lng]);
        }
      }
    })();
  }, [ready, userFix]);

  // Tombol "Pusatkan lokasi saya": dengan posisi tersimpan langsung terbang ke zoom 16;
  // tanpa posisi (pelacak navbar dimatikan/ditolak) meminta satu bacaan baru.
  const centerOnUser = () => {
    if (userFix && mapRef.current) {
      mapRef.current.flyTo([userFix.lat, userFix.lng], 16);
      return;
    }

    flyOnNextFixRef.current = true;
    requestCurrentFix();
  };

  return (
    <div style={{ height }} className={`relative isolate ${className ?? ''}`}>
      <div
        ref={containerRef}
        className="h-full w-full"
        role="application"
        aria-label="Peta OpenStreetMap"
      />
      <button
        type="button"
        onClick={centerOnUser}
        className="absolute right-3 top-3 z-[1000] flex h-11 items-center gap-2 rounded-md border border-border-strong bg-white px-3 text-sm font-medium text-ink hover:border-primary hover:text-primary-deep"
      >
        <LocateFixed className="h-4 w-4 shrink-0" aria-hidden="true" />
        Pusatkan lokasi saya
      </button>
    </div>
  );
}
