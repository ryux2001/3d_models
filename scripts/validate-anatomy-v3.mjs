import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import ts from 'typescript';
import { BufferGeometryLoader, Ray, Raycaster, Vector3 } from 'three';

// Transpile the pure TS generator in memory using the project's existing compiler.
// Data-URL modules resolve their dependencies explicitly, without build artifacts.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const moduleURLs = new Map();
function moduleURL(filename) {
  const cached = moduleURLs.get(filename);
  if (cached) return cached;
  const { outputText } = ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });
  const source = outputText.replace(/from\s+(['"])([^'"]+)\1/g, (_, quote, specifier) => {
    const url = specifier.startsWith('.')
      ? moduleURL(path.resolve(path.dirname(filename), `${specifier}.ts`))
      : import.meta.resolve(specifier);
    return `from ${quote}${url}${quote}`;
  });
  const url = `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
  moduleURLs.set(filename, url);
  return url;
}
const { createAnatomy } = await import(moduleURL(path.join(root, 'src/lib/characters/anatomy-v3/createAnatomy.ts')));
const { createControlCage } = await import(moduleURL(path.join(root, 'src/lib/characters/anatomy-v3/controlCage.ts')));
const { measureAnatomy } = await import(moduleURL(path.join(root, 'src/lib/characters/anatomy-v3/measureAnatomy.ts')));

// The B.2 source snapshot protects all ten V2 generator/helper files, including user work.
const snapshot = readFileSync(path.join(root, 'CONSTRUCCION_HAMMER_WARRIOR.md'), 'utf8').replace(/\r\n/g, '\n');
const blocks = [...snapshot.matchAll(/^## ([^\n]+)\n\n```ts\n([\s\S]*?)\n```(?=\n|$)/gm)];
assert.equal(blocks.length, 10, 'Expected ten V2 source files in the B.2 snapshot');
for (const [, filename, code] of blocks) {
  const actual = readFileSync(path.join(root, 'src/lib/characters', filename), 'utf8').replace(/\r\n/g, '\n').replace(/\n$/, '');
  assert.equal(actual, code, `V2 changed: ${filename}`);
}

const cage = createControlCage();
const asset = createAnatomy();
const body = asset.root.getObjectByName('V3_AnatomySurface');
const geometry = body.geometry;
const measurements = measureAnatomy(asset);
const hashArray = (array) => createHash('sha256').update(Buffer.from(array.buffer, array.byteOffset, array.byteLength)).digest('hex');
const fingerprint = (candidate) => {
  const g = candidate.root.getObjectByName('V3_AnatomySurface').geometry;
  return {
  position: hashArray(g.getAttribute('position').array),
  normal: hashArray(g.getAttribute('normal').array),
  index: hashArray(g.index.array),
  anchorsAndLoops: createHash('sha256').update(JSON.stringify({
    joints: Object.entries(candidate.joints).map(([name, node]) => [name, node.position.toArray()]),
    loops: candidate.root.userData.deformationLoops,
  })).digest('hex'),
  };
};
const geometryFingerprint = fingerprint(asset);
const preservedV31 = createAnatomy(1.8, '3.1');
const frozen = JSON.parse(readFileSync(path.join(root, 'scripts/fixtures/anatomy-v31.json'), 'utf8'));
const frozenFingerprint = fingerprint(preservedV31);
for (const key of ['position', 'normal', 'index', 'anchorsAndLoops']) {
  assert.equal(frozenFingerprint[key], frozen[key], `Preserved V3.1 changed: ${key}`);
}
assert.equal(geometryFingerprint.index, frozen.index, 'V3.2 must retain V3.1 topology');
assert.deepEqual(asset.root.userData.deformationLoops, preservedV31.root.userData.deformationLoops);
const measurementsV31 = measureAnatomy(preservedV31);
assert(measurements.handLength < measurementsV31.handLength * 1.12, 'Hand refinement must not inherit the thigh deformation');
assert(measurements.ratios.headsTall > 7.6 && measurements.ratios.headsTall < 8.2, 'Head/body ratio left the agreed stylized range');
for (const name of ['upperArmDepth', 'forearmDepth', 'thighDepth', 'calfDepth']) {
  const ratio = measurements[name] / measurementsV31[name];
  assert(ratio > 1.10 && ratio < 1.35, `Missing/excessive mass refinement: ${name}`);
}
assert(measurements.palmWidth > measurementsV31.palmWidth * 1.10 && measurements.palmWidth < measurementsV31.palmWidth * 1.30);
assert(measurements.footLength < measurementsV31.footLength * .98 && measurements.footLength > measurementsV31.footLength * .88);
assert(measurements.medialArchHeight > measurementsV31.medialArchHeight * 1.4 && measurements.medialArchHeight < .025);
const maxAnchorShift = Math.max(...Object.keys(asset.joints).map((name) =>
  asset.joints[name].position.distanceTo(preservedV31.joints[name].position)));
assert(maxAnchorShift < .003, 'Rest anchors drifted beyond reference normalization tolerance');
asset.root.updateMatrixWorld(true);
const sampleX = (y, z, front = true) => {
  const normalization = asset.root.userData.normalization;
  const raycaster = new Raycaster(new Vector3(front ? 1 : -1, (y - normalization.floor) * normalization.scale, z * normalization.scale), new Vector3(front ? -1 : 1, 0, 0));
  const hit = raycaster.intersectObject(body, false)[0];
  assert(hit, `Missing surface at Y=${y}, Z=${z}`);
  return hit.point.x / normalization.scale;
};
const torsoProfiles = [.94, 1.035, 1.105, 1.225, 1.345, 1.41].map((y) => ({
  y, frontCentre: sampleX(y, 0), frontMedial: sampleX(y, .035), frontLateral: sampleX(y, .07),
  backCentre: sampleX(y, 0, false), backMedial: sampleX(y, .035, false),
}));
// Shape regressions independent of illumination: retain subtle anatomy, not the former
// 32 mm sternal trench or excessive pectoral projection.
const maxMidlineDip = Math.max(...torsoProfiles.filter((p) => p.y >= 1.105)
  .map((p) => Math.max(p.frontMedial, p.frontLateral) - p.frontCentre));
assert(maxMidlineDip < .006, 'Exaggerated central torso trench');
assert(Math.max(...torsoProfiles.filter((p) => p.y >= 1.225).map((p) => Math.max(p.frontCentre, p.frontMedial, p.frontLateral))) < .14,
  'Excessive chest projection');
const position = geometry.getAttribute('position');
const normal = geometry.getAttribute('normal');
assert(Array.from(position.array).every(Number.isFinite));
assert(Array.from(normal.array).every(Number.isFinite));
assert.equal(position.count, normal.count);
const vertices = Array.from({ length: position.count }, (_, i) => new Vector3().fromBufferAttribute(position, i));
const indices = Array.from(geometry.index.array);
assert.equal(new Set(indices).size, vertices.length, 'Orphan surface vertices');
const edges = new Map();
const triangles = [];
let volume = 0;
let minimumArea = Infinity;
for (let i = 0; i < indices.length; i += 3) {
  const face = indices.slice(i, i + 3);
  const [a, b, c] = face.map((j) => vertices[j]);
  const area = b.clone().sub(a).cross(c.clone().sub(a)).length() / 2;
  assert(area > 1e-10, `Degenerate triangle ${i / 3}`);
  minimumArea = Math.min(minimumArea, area);
  volume += a.dot(b.clone().cross(c)) / 6;
  for (let j = 0; j < 3; j++) {
    const from = face[j], to = face[(j + 1) % 3];
    const key = from < to ? `${from}:${to}` : `${to}:${from}`;
    const edge = edges.get(key) ?? { count: 0, direction: 0 };
    edge.count++;
    edge.direction += from < to ? 1 : -1;
    edges.set(key, edge);
  }
  triangles.push({ face, points: [a, b, c],
    min: [Math.min(a.x, b.x, c.x), Math.min(a.y, b.y, c.y), Math.min(a.z, b.z, c.z)],
    max: [Math.max(a.x, b.x, c.x), Math.max(a.y, b.y, c.y), Math.max(a.z, b.z, c.z)],
  });
}
assert([...edges.values()].every((edge) => edge.count === 2 && edge.direction === 0), 'Open/nonmanifold edges or inconsistent face winding');
assert.equal(vertices.length - edges.size + triangles.length, 2, 'Unexpected surface topology');
assert(volume > 0, 'Inward global face orientation');
for (let i = 0; i < normal.count; i++) assert(Math.abs(new Vector3().fromBufferAttribute(normal, i).length() - 1) < 1e-5);

// Detect nonadjacent, noncoplanar triangle crossings. Adjacent faces share indices.
const ray = new Ray();
const hit = new Vector3();
function pierces(a, b, c, d, e) {
  const length = a.distanceTo(b);
  ray.set(a, b.clone().sub(a).normalize());
  if (!ray.intersectTriangle(c, d, e, false, hit)) return false;
  const t = a.distanceTo(hit);
  return t > 1e-7 && t < length - 1e-7;
}
let intersections = 0;
const sortedTriangles = [...triangles].sort((a, b) => a.min[1] - b.min[1]);
for (let i = 0; i < sortedTriangles.length; i++) for (let j = i + 1; j < sortedTriangles.length; j++) {
  const a = sortedTriangles[i], b = sortedTriangles[j];
  if (b.min[1] > a.max[1]) break;
  if (a.face.some((vertex) => b.face.includes(vertex))) continue;
  if ([0, 1, 2].some((k) => a.max[k] < b.min[k] || b.max[k] < a.min[k])) continue;
  if ([0, 1, 2].some((k) => pierces(a.points[k], a.points[(k + 1) % 3], ...b.points)
    || pierces(b.points[k], b.points[(k + 1) % 3], ...a.points))) intersections++;
}
assert.equal(intersections, 0, 'Nonadjacent triangle crossing');

// Deformation loops must remain actual closed edge cycles after both subdivisions.
const loops = asset.root.userData.deformationLoops;
for (const side of ['L', 'R']) for (const name of ['Shoulder', 'Elbow_before', 'Elbow', 'Elbow_after', 'Hand', 'Hip', 'Knee_before', 'Knee', 'Knee_after', 'Ankle']) {
  const loop = loops[`${name}_${side}`];
  assert.equal(loop.length, 24, `Missing/refinement-broken loop ${name}_${side}`);
  assert.equal(new Set(loop).size, loop.length);
  for (let i = 0; i < loop.length; i++) {
    const a = loop[i], b = loop[(i + 1) % loop.length];
    assert(edges.has(a < b ? `${a}:${b}` : `${b}:${a}`), `Disconnected loop ${name}_${side}`);
  }
}
assert(Math.abs(geometry.boundingBox.min.y) < 1e-6, 'Feet must touch Y=0');
assert(Math.abs(geometry.boundingBox.max.y - 1.8) < 1e-6, 'Reference height must be 1.8 metres');
for (const sign of [-1, 1]) {
  const foot = vertices.filter((p) => p.y < .04 && p.z * sign > 0);
  assert(foot.length > 12 && Math.min(...foot.map((p) => p.y)) < 1e-6, 'Both feet must be grounded');
}
assert.equal(asset.root.userData.pose, 'A');
assert.equal(asset.root.userData.fullBody, true);

const quantize = (p) => `${p.x.toFixed(5)},${p.y.toFixed(5)},${Math.abs(p.z).toFixed(5)}`;
const symmetry = new Map();
for (const p of vertices) {
  const key = quantize(p);
  const sides = symmetry.get(key) ?? new Set();
  sides.add(Math.abs(p.z) < 1e-5 ? 0 : Math.sign(p.z));
  symmetry.set(key, sides);
}
assert([...symmetry.values()].every((sides) => sides.has(0) || (sides.has(-1) && sides.has(1))), 'Asymmetric anatomy');
const reloaded = new BufferGeometryLoader().parse(geometry.toJSON());
assert.deepEqual(Array.from(reloaded.index.array), indices);
assert.deepEqual(Array.from(reloaded.getAttribute('position').array), Array.from(position.array));
reloaded.dispose();
assert.equal(Object.keys(asset.joints).length, 16);
assert.equal(asset.root.userData.rigged, false);
// A-pose references move outwards/downwards from shoulders, without crossing the torso.
for (const side of ['L', 'R']) {
  const sign = side === 'R' ? 1 : -1;
  const shoulder = asset.joints[`Shoulder_${side}`].position;
  const elbow = asset.joints[`Elbow_${side}`].position;
  const hand = asset.joints[`Hand_${side}`].position;
  assert(shoulder.y > elbow.y && elbow.y > hand.y);
  assert(shoulder.z * sign < elbow.z * sign && elbow.z * sign < hand.z * sign);
}
const storedJoints = Object.fromEntries(Object.entries(asset.joints).map(([name, node]) => [name, node.position.toArray()]));
asset.joints.Elbow_R.position.set(10, 10, 10);
asset.resetPose();
assert.deepEqual(asset.joints.Elbow_R.position.toArray(), storedJoints.Elbow_R, 'Anchor reset drift');
for (const height of [1.2, 1.8, 2.4]) {
  const other = createAnatomy(height);
  assert.equal(other.root.scale.x, height / 1.8);
  other.dispose();
}
assert.throws(() => createAnatomy(NaN));
let disposedGeometry = 0, disposedMaterial = 0;
geometry.addEventListener('dispose', () => disposedGeometry++);
body.material.addEventListener('dispose', () => disposedMaterial++);
asset.dispose();
asset.dispose();
assert.equal(disposedGeometry, 1);
assert.equal(disposedMaterial, 1);
preservedV31.dispose();
console.log(JSON.stringify({ passed: true, unchangedV2Files: blocks.length,
  controlVertices: cage.vertices.length, controlFaces: cage.faces.length,
  vertices: vertices.length, triangles: triangles.length, minimumArea, signedVolume: volume,
  detectedCrossings: intersections, closedManifold: true, outwardWinding: true,
  symmetric: true, threeGeometryRoundTrip: true, idempotentDisposal: true,
  torsoProfiles,
  maxMidlineDipMillimetres: maxMidlineDip * 1000,
  deformationLoops: Object.keys(loops).length, fullBody: true, grounded: true,
  measurements, measurementsV31, geometryFingerprint, preservedV31: true,
  maxAnchorShiftMillimetres: maxAnchorShift * 1000,
}, null, 2));
