const EARTH_RADIUS_KM = 6371;
const MAX_RADIUS_KM = 500;

export type GeoFilter = {
  latitude: number;
  longitude: number;
  radiusKm?: number;
};

export type GeoFilterResult = { ok: true; filter?: GeoFilter } | { ok: false; error: string };

function parseCoordinate(value: string | null) {
  if (value === null || value.trim() === '') {
    return undefined;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

export function parseGeoFilter(searchParams: URLSearchParams): GeoFilterResult {
  const latitude = parseCoordinate(searchParams.get('lat'));
  const longitude = parseCoordinate(searchParams.get('lng'));
  const radius = parseCoordinate(searchParams.get('radiusKm'));

  if (latitude === null || longitude === null || radius === null) {
    return { ok: false, error: 'lat, lng, dan radiusKm harus berupa angka.' };
  }

  if (latitude === undefined && longitude === undefined) {
    if (radius !== undefined) {
      return { ok: false, error: 'radiusKm membutuhkan lat dan lng.' };
    }

    return { ok: true };
  }

  if (latitude === undefined || longitude === undefined) {
    return { ok: false, error: 'lat dan lng harus diisi bersamaan.' };
  }

  if (latitude < -90 || latitude > 90) {
    return { ok: false, error: 'lat harus berada di antara -90 dan 90.' };
  }

  if (longitude < -180 || longitude > 180) {
    return { ok: false, error: 'lng harus berada di antara -180 dan 180.' };
  }

  if (radius !== undefined && (radius <= 0 || radius > MAX_RADIUS_KM)) {
    return { ok: false, error: `radiusKm harus lebih dari 0 dan maksimal ${MAX_RADIUS_KM}.` };
  }

  return {
    ok: true,
    filter: {
      latitude,
      longitude,
      ...(radius !== undefined ? { radiusKm: radius } : {})
    }
  };
}

export function haversineKm(
  origin: { latitude: number; longitude: number },
  target: { latitude: number; longitude: number }
) {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const deltaLat = toRadians(target.latitude - origin.latitude);
  const deltaLng = toRadians(target.longitude - origin.longitude);
  const originLat = toRadians(origin.latitude);
  const targetLat = toRadians(target.latitude);
  const haversine =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(originLat) * Math.cos(targetLat) * Math.sin(deltaLng / 2) ** 2;

  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

export function geoBoundingBox({
  latitude,
  longitude,
  radiusKm
}: {
  latitude: number;
  longitude: number;
  radiusKm: number;
}) {
  const latitudeDelta = radiusKm / 111.32;
  const longitudeDelta =
    radiusKm / (111.32 * Math.max(Math.cos((latitude * Math.PI) / 180), 0.0001));

  return {
    minLatitude: latitude - latitudeDelta,
    maxLatitude: latitude + latitudeDelta,
    minLongitude: longitude - longitudeDelta,
    maxLongitude: longitude + longitudeDelta
  };
}

export function roundDistance(distanceKm: number) {
  return Number(distanceKm.toFixed(1));
}

export function formatDistanceKm(distanceKm: number | null | undefined) {
  return distanceKm === null || distanceKm === undefined ? null : roundDistance(distanceKm);
}
