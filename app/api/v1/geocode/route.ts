import { jsonError, jsonOk, jsonTooManyRequests, handleRouteError } from '@/lib/api';
import { rateLimit } from '@/lib/rate-limit';
import { reverseGeocode } from '@/lib/geocode';

// Reverse geocode hanya boleh menyapa dari server (ketentuan Nominatim: tidak diizinkan
// diakses langsung dari browser). Pintu masuk UI: tombol "Cari alamat", sekali klik untuk satu titik — tanpa
// autocomplete. Limiter global 1 request/detik melindungi kuota seluruh aplikasi.
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
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
    const limit = await rateLimit('nominatim:reverse', 1, 1000);

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
