/** Walkable meadow, excluding the lake, tree trunks, and memorial steps. */
export type Point = { x: number; z: number };
const obstacles = [
  { x: -2.6, z: 0.5, r: 1.55 },
  { x: 1, z: -2.3, r: 2.12 },
  { x: -2.5, z: -2.2, r: 0.5 },
  { x: 2.8, z: 1.9, r: 0.65 },
  ...[
    [-4, -2],
    [-3.3, -3.5],
    [3.7, -2.8],
    [4.3, -1.3],
    [3.8, 1.8],
  ].map(([x, z]) => ({ x, z, r: 0.48 })),
];
export function walkable(p: Point) {
  return (
    Math.hypot(p.x, p.z) < 5.15 &&
    obstacles.every((o) => Math.hypot(p.x - o.x, p.z - o.z) > o.r)
  );
}
const step = 0.25;
export function route(from: Point, to: Point): Point[] {
  if (!walkable(to)) return [];
  const key = (x: number, z: number) => `${x},${z}`;
  const start = { x: Math.round(from.x / step), z: Math.round(from.z / step) };
  const goal = { x: Math.round(to.x / step), z: Math.round(to.z / step) };
  const open = [start],
    prev = new Map<string, string>(),
    costs = new Map([[key(start.x, start.z), 0]]);
  const closed = new Set<string>();
  while (open.length) {
    open.sort(
      (a, b) =>
        costs.get(key(a.x, a.z))! +
        Math.hypot(a.x - goal.x, a.z - goal.z) -
        (costs.get(key(b.x, b.z))! + Math.hypot(b.x - goal.x, b.z - goal.z)),
    );
    const p = open.shift()!,
      k = key(p.x, p.z);
    if (closed.has(k)) continue;
    if (p.x === goal.x && p.z === goal.z) {
      const result: Point[] = [];
      let c = k;
      while (prev.has(c)) {
        const [x, z] = c.split(',').map(Number);
        result.unshift({ x: x * step, z: z * step });
        c = prev.get(c)!;
      }
      return result;
    }
    closed.add(k);
    for (const [dx, dz] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ]) {
      const n = { x: p.x + dx, z: p.z + dz },
        nk = key(n.x, n.z);
      if (
        !walkable({ x: n.x * step, z: n.z * step }) ||
        !walkable({ x: (p.x + dx * 0.5) * step, z: (p.z + dz * 0.5) * step }) ||
        closed.has(nk)
      )
        continue;
      const cost = costs.get(k)! + Math.hypot(dx, dz);
      if (cost < (costs.get(nk) ?? Infinity)) {
        costs.set(nk, cost);
        prev.set(nk, k);
        open.push(n);
      }
    }
  }
  return [];
}
