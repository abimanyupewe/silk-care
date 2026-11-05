import assert from 'node:assert/strict';
import { selectNearest } from '@/lib/home/nearby';

const points = [
  { id: 'far', distanceKm: 8 },
  { id: 'near', distanceKm: 1 },
  { id: 'unknown', distanceKm: null }
];
assert.deepEqual(
  selectNearest(points, 2).map((point) => point.id),
  ['near', 'far']
);
assert.deepEqual(
  selectNearest(points, 10).map((point) => point.id),
  ['near', 'far', 'unknown']
);
console.log('nearby.check: ok');
