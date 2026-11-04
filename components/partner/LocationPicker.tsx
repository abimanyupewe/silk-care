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

const secondaryButton =
  'inline-flex min-h-11 items-center gap-2 border border-border-strong bg-white px-4 text-sm font-semibold text-ink hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60';

// Pemilih titik lokasi pada step Lokasi registrasi mitra: pin digeser langsung di peta,
// tombol lokasi perangkat, dan satu tombol "Cari alamat" (sekali klik per titik — tanpa
// autocomplete, sesuai ketentuan Nominatim). Alamat hasil bacaan dikirim ke form untuk
// mengisi alamat/kota dan tetap bisa diedit.
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
  const [busy, setBusy] = useState<'location' | 'geocode' | null>(null);

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

  async function cariAlamat() {
    if (!pin) {
      setGeocodeError('Geser pin atau pakai tombol lokasi terlebih dahulu.');
      return;
    }

    setBusy('geocode');
    setGeocodeError('');
    setMessage('');

    try {
      const result = await fetchApi<GeocodeResult>(`/geocode?lat=${pin.lat}&lon=${pin.lng}`);

      setRecognizedLabel(result.data.label);
      onAddressRecognized({ label: result.data.label, city: result.data.city });
      setMessage('Alamat dan kota terisi dari peta; sesuaikan bila perlu.');
    } catch (error) {
      setGeocodeError(
        error instanceof ApiError ? error.message : 'Layanan alamat sibuk; coba lagi sebentar.'
      );
    } finally {
      setBusy(null);
    }
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
        <button
          type="button"
          onClick={useMyLocation}
          disabled={disabled || busy !== null}
          className={secondaryButton}
        >
          <Crosshair className="h-4 w-4" aria-hidden="true" />
          {busy === 'location' ? 'Mencari posisi...' : 'Gunakan lokasi saya'}
        </button>
        <button
          type="button"
          onClick={cariAlamat}
          disabled={disabled || busy !== null}
          className={secondaryButton}
        >
          <Search className="h-4 w-4" aria-hidden="true" />
          {busy === 'geocode' ? 'Membaca alamat...' : 'Cari alamat'}
        </button>
      </div>

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
