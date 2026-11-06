import { BufferGeometry, Float32BufferAttribute, Vector3 } from 'three';

export type ControlMesh = { vertices: Vector3[]; faces: number[][]; loops?: Record<string, number[]> };
const edgeKey = (a: number, b: number) => a < b ? `${a}:${b}` : `${b}:${a}`;

/** Catmull–Clark on a closed manifold cage; face connectivity is preserved at every step. */
export function subdivide(cage: ControlMesh): ControlMesh {
  const { vertices, faces } = cage;
  const facePoints = faces.map((face) => face.reduce((sum, index) => sum.add(vertices[index]), new Vector3()).divideScalar(face.length));
  const edges = new Map<string, { a: number; b: number; faces: number[]; index: number }>();
  const vertexFaces = vertices.map(() => new Set<number>());
  const vertexEdges = vertices.map(() => new Set<string>());
  faces.forEach((face, faceIndex) => {
    face.forEach((a, corner) => {
      const b = face[(corner + 1) % face.length];
      const key = edgeKey(a, b);
      const edge = edges.get(key) ?? { a, b, faces: [], index: -1 };
      edge.faces.push(faceIndex);
      edges.set(key, edge);
      vertexFaces[a].add(faceIndex);
      vertexEdges[a].add(key);
      vertexEdges[b].add(key);
    });
  });
  for (const edge of edges.values()) {
    if (edge.faces.length !== 2) throw new Error('V3 cage must be closed and manifold.');
  }
  const result = vertices.map((point, index) => {
    const n = vertexFaces[index].size;
    const f = [...vertexFaces[index]].reduce((sum, face) => sum.add(facePoints[face]), new Vector3()).divideScalar(n);
    const r = [...vertexEdges[index]].reduce((sum, key) => {
      const edge = edges.get(key)!;
      return sum.add(vertices[edge.a]).add(vertices[edge.b]);
    }, new Vector3()).divideScalar(vertexEdges[index].size * 2);
    return point.clone().multiplyScalar(n - 3).add(f).addScaledVector(r, 2).divideScalar(n);
  });
  const faceOffset = result.length;
  result.push(...facePoints);
  for (const edge of edges.values()) {
    edge.index = result.length;
    result.push(vertices[edge.a].clone().add(vertices[edge.b]).add(facePoints[edge.faces[0]]).add(facePoints[edge.faces[1]]).multiplyScalar(0.25));
  }
  const quads: number[][] = [];
  faces.forEach((face, faceIndex) => face.forEach((vertex, corner) => {
    const next = face[(corner + 1) % face.length];
    const previous = face[(corner + face.length - 1) % face.length];
    quads.push([vertex, edges.get(edgeKey(vertex, next))!.index, faceOffset + faceIndex, edges.get(edgeKey(previous, vertex))!.index]);
  }));
  const loops = cage.loops && Object.fromEntries(Object.entries(cage.loops).map(([name, loop]) => [name,
    loop.flatMap((vertex, i) => [vertex, edges.get(edgeKey(vertex, loop[(i + 1) % loop.length]))!.index]),
  ]));
  return { vertices: result, faces: quads, loops };
}

/** Align neighbouring face windings, then choose the outward orientation by signed volume. */
export function orientClosedMesh(cage: ControlMesh): ControlMesh {
  const faces = cage.faces.map((face) => [...face]);
  const edges = new Map<string, number[]>();
  faces.forEach((face, index) => face.forEach((a, corner) => {
    const key = edgeKey(a, face[(corner + 1) % face.length]);
    const neighbours = edges.get(key) ?? [];
    neighbours.push(index);
    edges.set(key, neighbours);
  }));
  if ([...edges.values()].some((edge) => edge.length !== 2)) throw new Error('Open or non-manifold V3 cage.');
  const visited = new Set([0]);
  const queue = [0];
  while (queue.length) {
    const index = queue.pop()!;
    const face = faces[index];
    face.forEach((a, corner) => {
      const b = face[(corner + 1) % face.length];
      const neighbour = edges.get(edgeKey(a, b))!.find((candidate) => candidate !== index)!;
      if (visited.has(neighbour)) return;
      const other = faces[neighbour];
      const sameDirection = other.some((p, i) => p === a && other[(i + 1) % other.length] === b);
      if (sameDirection) other.reverse();
      visited.add(neighbour);
      queue.push(neighbour);
    });
  }
  if (visited.size !== faces.length) throw new Error('V3 surface must be one connected component.');
  let volume = 0;
  for (const face of faces) {
    const a = cage.vertices[face[0]];
    for (let corner = 1; corner < face.length - 1; corner++) {
      volume += a.dot(new Vector3().crossVectors(cage.vertices[face[corner]], cage.vertices[face[corner + 1]])) / 6;
    }
  }
  if (volume < 0) faces.forEach((face) => face.reverse());
  return { vertices: cage.vertices, faces, loops: cage.loops };
}

export function toBufferGeometry(mesh: ControlMesh) {
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(mesh.vertices.flatMap((point) => point.toArray()), 3));
  const triangles: number[] = [];
  for (const face of mesh.faces) {
    for (let corner = 1; corner < face.length - 1; corner++) triangles.push(face[0], face[corner], face[corner + 1]);
  }
  geometry.setIndex(triangles);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}
