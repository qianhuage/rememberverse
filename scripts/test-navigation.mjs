import assert from 'node:assert/strict';
import { route, walkable } from '../lib/island-navigation.ts';
for (const target of [
  { x: -4, z: 2 },
  { x: 3, z: 3 },
  { x: 0, z: -4.75 },
]) {
  const points = route({ x: 0.25, z: 3.1 }, target);
  assert.ok(points.length, `route to ${JSON.stringify(target)}`);
  assert.ok(
    points.every(walkable),
    'route must stay on island and avoid obstacles',
  );
  for (let i = 1; i < points.length; i++)
    assert.ok(
      Math.hypot(
        points[i].x - points[i - 1].x,
        points[i].z - points[i - 1].z,
      ) <= 0.36,
      'no teleporting across obstacles',
    );
}
assert.deepEqual(
  route({ x: 0, z: 3 }, { x: -2.6, z: 0.5 }),
  [],
  'pond cannot be a destination',
);
assert.deepEqual(
  route({ x: 0, z: 3 }, { x: 9, z: 0 }),
  [],
  'outside island cannot be a destination',
);
console.log('Navigation checks passed');
