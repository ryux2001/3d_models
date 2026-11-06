import { BufferGeometry, Float32BufferAttribute } from 'three';

/** Horizontal octagonal section: Y, front/back radius, half-width in Z, X offset. */
export type ProfileRing = readonly [y: number, depth: number, width: number, x?: number];

/** Closed, bevelled cross sections; no DOM, textures or external model files. */
export function createProfileGeometry(rings: readonly ProfileRing[]): BufferGeometry {
  if (rings.length < 2) throw new Error('A profile requires at least two rings.');
  const outline = [
    [1, 0.55], [0.55, 1], [-0.55, 1], [-1, 0.55],
    [-1, -0.55], [-0.55, -1], [0.55, -1], [1, -0.55],
  ];
  const positions: number[] = [];
  const indices: number[] = [];
  rings.forEach(([y, depth, width, x = 0], ring) => {
    if (![y, depth, width, x].every(Number.isFinite) || depth <= 0 || width <= 0) {
      throw new Error('Profile dimensions must be finite and radii positive.');
    }
    if (ring > 0 && y <= rings[ring - 1][0]) throw new Error('Profile rings must ascend in Y.');
    for (const [dx, dz] of outline) positions.push(x + dx * depth, y, dz * width);
    if (ring === 0) return;
    for (let side = 0; side < 8; side++) {
      const next = (side + 1) % 8;
      const a = (ring - 1) * 8 + side;
      const b = (ring - 1) * 8 + next;
      const c = ring * 8 + next;
      const d = ring * 8 + side;
      indices.push(a, d, c, a, c, b);
    }
  });
  for (const [ring, top] of [[0, false], [rings.length - 1, true]] as const) {
    const [y, , , x = 0] = rings[ring];
    const center = positions.length / 3;
    positions.push(x, y, 0);
    for (let side = 0; side < 8; side++) {
      const a = ring * 8 + side;
      const b = ring * 8 + (side + 1) % 8;
      indices.push(...(top ? [center, b, a] : [center, a, b]));
    }
  }
  const indexed = new BufferGeometry();
  indexed.setAttribute('position', new Float32BufferAttribute(positions, 3));
  indexed.setIndex(indices);
  const geometry = indexed.toNonIndexed();
  indexed.dispose();
  geometry.computeVertexNormals();
  return geometry;
}
