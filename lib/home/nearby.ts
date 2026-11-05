export function selectNearest<T extends { distanceKm?: number | null }>(
  points: T[],
  limit: number
) {
  return [...points]
    .sort((left, right) => (left.distanceKm ?? Infinity) - (right.distanceKm ?? Infinity))
    .slice(0, limit);
}
