import { logError, logInfo } from '@/lib/logger';

// Nominatim (reverse geocode OSM) hanya boleh diakses dari server: User-Agent khusus,
// maksimal 1 request per detik untuk seluruh aplikasi, tanpa autocomplete, dan hasilnya
// di-cache (aturan operasi di dev/Breakdown Fungsional Demo SILK.md).
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 jam; alamat jarang berubah dalam demo.
const CACHE_MAX_ENTRIES = 500;

// Cache in-process: alamat sudah pernah dicari (pin geser tipis, kunci dibulatkan)
// tidak memukul server OSM lagi di jendela TTL. Vercel menjalankan banyak instance;
// masing-masing tetap patuh 1 request/detik lewat rate limit bersama pada route.
const geocodeCache = new Map<string, CacheEntry>();

export function nominatimUserAgent() {
  return process.env.NOMINATIM_USER_AGENT?.trim() || 'SILK/1.0 (dev@silk.local)';
}

export type ReverseGeocodeResult = {
  label: string;
  city: string | null;
  state: string | null;
  country: string | null;
};

type CacheEntry = { expiresAt: number; value: ReverseGeocodeResult };
type NominatimResponse = {
  display_name?: unknown;
  address?: Record<string, unknown>;
};

// Kunci cache dibulatkan ke 4 desimal (~11 m) supaya pin yang sedikit digeser memakai
// entri yang sama, bukan memukul server lagi.
export function geocodeCacheKey(lat: number, lng: number) {
  return `${lat.toFixed(4)},${lng.toFixed(4)}`;
}

function pruneCache(cache: Map<string, CacheEntry>) {
  const now = Date.now();

  for (const [key, entry] of cache) {
    if (entry.expiresAt <= now) {
      cache.delete(key);
    }
  }
}

// city pada OSM bervariasi (city/town/village/municipality) — urutan ini yang paling sering
// dipakai untuk Indonesia; county = kabupaten/kecamatan sebagai cadangan terakhir.
function pickCity(address: Record<string, unknown>) {
  const candidates = ['city', 'town', 'village', 'municipality', 'county'];

  for (const key of candidates) {
    const value = address[key];

    if (typeof value === 'string' && value.trim() !== '') {
      return value;
    }
  }

  return null;
}

function readString(value: unknown) {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : null;
}

export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<ReverseGeocodeResult | null> {
  const cacheKey = geocodeCacheKey(lat, lng);
  const cached = geocodeCache.get(cacheKey);
  const now = Date.now();

  if (cached && cached.expiresAt > now) {
    return cached.value;
  }

  // Cache diperiksa sebelum permintaan; limiter hanya bertugas sebelum menyapa server OSM.
  try {
    const url = new URL(NOMINATIM_URL);
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('lat', lat.toFixed(6));
    url.searchParams.set('lon', lng.toFixed(6));
    url.searchParams.set('zoom', '18');
    url.searchParams.set('addressdetails', '1');
    url.searchParams.set('accept-language', 'id');

    const response = await fetch(url, {
      headers: {
        // Ketentuan penggunaan OSM: identitas kontak jelas dan disetel sebagai User-Agent.
        'User-Agent': nominatimUserAgent()
      }
    });

    if (!response.ok) {
      logError('nominatim_reverse_failed', new Error(`HTTP ${response.status}`), {
        lat,
        lng
      });
      return null;
    }

    const data = (await response.json()) as NominatimResponse;
    const label = readString(data.display_name);

    if (!label) {
      return null;
    }

    const address = data.address ?? {};
    const value: ReverseGeocodeResult = {
      label,
      city: pickCity(address),
      state: readString(address.state) ?? readString(address.region),
      country: readString(address.country)
    };

    // Pruning sederhana: buang entri kedaluwarsa saat cache makin penuh.
    if (geocodeCache.size >= CACHE_MAX_ENTRIES) {
      pruneCache(geocodeCache);
    }

    geocodeCache.set(cacheKey, { expiresAt: now + CACHE_TTL_MS, value });
    logInfo('nominatim_reverse_cached', { key: cacheKey });

    return value;
  } catch (error) {
    logError('nominatim_reverse_error', error, { lat, lng });
    return null;
  }
}
