'use client';

import { useState } from 'react';
import { Crosshair, MapPin, Search } from 'lucide-react';
import { LeafletMap, type MapPoint } from '@/components/shared/LeafletMap';
import { fetchApi, ApiError } from '@/lib/api-client';

// Fallback center: Malang — kota target seed direktori (paket 3).
const DEFAULT_CENTER: MapPoint = { lat: -7.9771, lng: 112.6326 };

type GeocodeResult = {
  label: string;
  city: string | null;
  state: string | null;
  country: string | null;
};

type AddressSearchResult = GeocodeResult & { lat: number; lng: number };

const secondaryButton =
  'inline-flex min-h-11 items-center gap-2 border border-border-strong bg-white px-4 text-sm font-semibold text-ink hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60';

// Pemilih titik lokasi: cari alamat secara manual, pilih hasilnya, atau geser pin langsung
// di peta. Alamat hasil bacaan dikirim ke form untuk mengisi alamat/kota dan tetap bisa diedit.
export function LocationPicker({
  latitude,
  longitude,
  onPoint,
  onAddressRecognized,
  disabled
}: {
  latitude: number | null;
  longitude: number | null;
  onPoint: (point: MapPoint) => void;
  onAddressRecognized: (info: { label: string; city: string | null }) => void;
  disabled: boolean;
}) {
  const [message, setMessage] = useState('');
  const [geocodeError, setGeocodeError] = useState('');
  const [recognizedLabel, setRecognizedLabel] = useState('');
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AddressSearchResult[]>([]);
  const [busy, setBusy] = useState<'location' | 'search' | null>(null);

  const pin: MapPoint | null =
    latitude != null && longitude != null ? { lat: latitude, lng: longitude } : null;

  function useMyLocation() {
    if (!('geolocation' in navigator)) {
      setMessage('Peramban ini tidak mendukung lokasi; isi lintang dan bujur secara manual.');
      return;
    }

    setBusy('location');
    setMessage('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const point = {
          lat: Number(position.coords.latitude.toFixed(6)),
          lng: Number(position.coords.longitude.toFixed(6))
        };

        onPoint(point);
        setMessage('Posisi perangkat dijadikan pin; periksa dan geser bila kurang tepat.');
        setBusy(null);
      },
      () => {
        setMessage('Izin lokasi ditolak; geser pin atau isi lintang dan bujur secara manual.');
        setBusy(null);
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }

  async function cariLokasi() {
    const value = query.trim();

    if (value.length < 3) {
      setGeocodeError('Tulis minimal 3 karakter alamat.');
      return;
    }

    setBusy('search');
    setGeocodeError('');
    setSearchResults([]);

    try {
      const result = await fetchApi<AddressSearchResult[]>(
        `/geocode?q=${encodeURIComponent(value)}`
      );

      if (!result.data.length) {
        setGeocodeError('Alamat tidak ditemukan. Coba tambahkan nama kota atau kecamatan.');
      } else {
        setSearchResults(result.data);
      }
    } catch (error) {
      setGeocodeError(
        error instanceof ApiError ? error.message : 'Pencarian alamat gagal. Coba lagi sebentar.'
      );
    } finally {
      setBusy(null);
    }
  }

  function pilihLokasi(result: AddressSearchResult) {
    const point = { lat: Number(result.lat.toFixed(6)), lng: Number(result.lng.toFixed(6)) };

    onPoint(point);
    setRecognizedLabel(result.label);
    onAddressRecognized({ label: result.label, city: result.city });
    setSearchResults([]);
    setMessage('Lokasi ditemukan; periksa pin lalu simpan profil.');
  }

  return (
    <div>
      <div className="relative">
        <LeafletMap
          center={pin ?? DEFAULT_CENTER}
          zoom={pin ? 16 : 13}
          draggable={!disabled}
          onPointChange={onPoint}
          height={320}
        />
        {!pin ? (
          <p className="pointer-events-none absolute inset-x-0 top-2 mx-auto w-max max-w-full border border-border bg-white px-3 py-1 text-sm text-ink">
            Geser pin di peta atau pakai tombol di bawah untuk menentukan titik.
          </p>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap gap-3">
        <div className="flex w-full gap-2">
          <label className="sr-only" htmlFor="location-search">
            Cari alamat
          </label>
          <input
            id="location-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                void cariLokasi();
              }
            }}
            placeholder="Cari alamat, kecamatan, atau kota"
            className="h-11 min-w-0 flex-1 border border-border-strong bg-white px-3 text-base text-ink outline-none focus:border-primary"
            disabled={disabled || busy !== null}
          />
          <button
            type="button"
            onClick={() => void cariLokasi()}
            disabled={disabled || busy !== null}
            className={secondaryButton}
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            {busy === 'search' ? 'Mencari...' : 'Cari'}
          </button>
        </div>
        <button
          type="button"
          onClick={useMyLocation}
          disabled={disabled || busy !== null}
          className={secondaryButton}
        >
          <Crosshair className="h-4 w-4" aria-hidden="true" />
          {busy === 'location' ? 'Mencari posisi...' : 'Gunakan lokasi saya'}
        </button>
      </div>

      {searchResults.length ? (
        <ul
          className="mt-2 divide-y divide-border border border-border bg-white"
          aria-label="Hasil pencarian alamat"
        >
          {searchResults.map((result) => (
            <li key={`${result.lat}-${result.lng}-${result.label}`}>
              <button
                type="button"
                onClick={() => pilihLokasi(result)}
                className="flex min-h-11 w-full items-start gap-2 px-3 py-2 text-left text-sm text-ink hover:bg-primary-tint"
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <span>{result.label}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <p className="mt-2 min-h-5 text-sm text-ink-muted" aria-live="polite">
        {message}
        {message ? '' : pin ? 'Pin: ' + pin.lat.toFixed(6) + ', ' + pin.lng.toFixed(6) : ''}
      </p>
      {recognizedLabel ? (
        <p className="mt-1 flex items-start gap-1.5 text-sm text-ink">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary-hover" aria-hidden="true" />
          <span>Alamat terbaca: {recognizedLabel}</span>
        </p>
      ) : null}
      {geocodeError ? (
        <p className="mt-1 text-sm text-destructive" role="alert">
          {geocodeError}
        </p>
      ) : null}
    </div>
  );
}
