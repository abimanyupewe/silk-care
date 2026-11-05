import { jsonError, jsonOk, jsonTooManyRequests, handleRouteError } from '@/lib/api';
import { rateLimit } from '@/lib/rate-limit';
import { reverseGeocode, searchGeocode } from '@/lib/geocode';

// Geocoding hanya boleh menyapa dari server (ketentuan Nominatim: tidak diizinkan diakses
// langsung dari browser). Pencarian tetap submit manual, bukan autocomplete.
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim();

    if (query) {
      if (query.length < 3) return jsonError('Alamat minimal 3 karakter.', 422);

      const limit = await rateLimit('nominatim:geocode', 1, 1000);

      if (!limit.allowed) return jsonTooManyRequests(limit.resetAt);

      return jsonOk(await searchGeocode(query.slice(0, 200)));
    }

    const lat = Number(searchParams.get('lat'));
    const lng = Number(searchParams.get('lon') ?? searchParams.get('lng'));

    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
      return jsonError('lat harus angka antara -90 dan 90.', 422);
    }

    if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
      return jsonError('lon harus angka antara -180 dan 180.', 422);
    }

    // Cache diperiksa lebih dahulu di dalam reverseGeocode; limiter hanya dipukul bila
    // benar-benar perlu menyapa server OSM.
    const limit = await rateLimit('nominatim:geocode', 1, 1000);

    if (!limit.allowed) {
      return jsonTooManyRequests(limit.resetAt);
    }

    const result = await reverseGeocode(lat, lng);

    if (!result) {
      return jsonError('Alamat tidak ditemukan untuk titik ini.', 404);
    }

    // jsonOk membungkus sendiri; jangan dikirim sebagai { data: ... } lagi (envelope mati).
    return jsonOk(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
