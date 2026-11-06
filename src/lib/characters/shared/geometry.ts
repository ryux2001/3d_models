import { BufferGeometry, Float32BufferAttribute } from 'three';

/** Horizontal section: Y, front/back radius, half-width in Z, X offset. */
export type ProfileRing = readonly [y: number, depth: number, width: number, x?: number];

export type ProfileOptions = { section?: 'bevel' | 'ellipse'; segments?: number };

/** Elliptical anatomy has smooth sides and separate flat caps; bevelled equipment stays faceted. */
export function createProfileGeometry(rings: readonly ProfileRing[], options: ProfileOptions = {}): BufferGeometry {
  if (rings.length < 2) throw new Error('A profile requires at least two rings.');
  const smooth = options.section === 'ellipse';
  const segments = options.segments ?? 12;
  if (!Number.isInteger(segments) || segments < 8 || segments > 32) {
    throw new Error('Profile segments must be an integer between 8 and 32.');
  }
  const outline = smooth ? Array.from({ length: segments }, (_, index) => {
    const angle = index / segments * Math.PI * 2;
    return [Math.cos(angle), Math.sin(angle)];
  }) : [
    [1, 0.55], [0.55, 1], [-0.55, 1], [-1, 0.55],
    [-1, -0.55], [-0.55, -1], [0.55, -1], [1, -0.55],
  ];
  const count = outline.length;
  const positions: number[] = [];
  const indices: number[] = [];
  rings.forEach(([y, depth, width, x = 0], ring) => {
    if (![y, depth, width, x].every(Number.isFinite) || depth <= 0 || width <= 0) {
      throw new Error('Profile dimensions must be finite and radii positive.');
    }
    if (ring > 0 && y <= rings[ring - 1][0]) throw new Error('Profile rings must ascend in Y.');
    for (const [dx, dz] of outline) positions.push(x + dx * depth, y, dz * width);
    if (ring === 0) return;
    for (let side = 0; side < count; side++) {
      const next = (side + 1) % count;
      const a = (ring - 1) * count + side;
      const b = (ring - 1) * count + next;
      const c = ring * count + next;
      const d = ring * count + side;
      indices.push(a, d, c, a, c, b);
    }
  });
  for (const [ring, top] of [[0, false], [rings.length - 1, true]] as const) {
    const [y, depth, width, x = 0] = rings[ring];
    // Duplicate cap rim so the side's normals never average with a horizontal cap.
    const rim = positions.length / 3;
    for (const [dx, dz] of outline) positions.push(x + dx * depth, y, dz * width);
    const center = positions.length / 3;
    positions.push(x, y, 0);
    for (let side = 0; side < count; side++) {
      const a = rim + side;
      const b = rim + (side + 1) % count;
      indices.push(...(top ? [center, b, a] : [center, a, b]));
    }
  }
  const indexed = new BufferGeometry();
  indexed.setAttribute('position', new Float32BufferAttribute(positions, 3));
  indexed.setIndex(indices);
  const geometry = smooth ? indexed : indexed.toNonIndexed();
  if (!smooth) indexed.dispose();
  geometry.computeVertexNormals();
  return geometry;
}
