import { Vector3 } from 'three';
import { orientClosedMesh, type ControlMesh } from './subdivision';
import { appendArm, appendLeg } from './limbPatches';

/** A half-row is four independent anatomical landmarks: centre → medial → lateral → flank.
 * Every point has its own Y and front/back X. No radii, ellipse or surface of revolution.
 */
type Landmark = readonly [z: number, y: number, front: number, back: number];
const BODY_PATCH_ROWS: readonly (readonly Landmark[])[] = [
  // Pubic/perineal bridge between two independent thigh apertures.
  [[0, .87, .06, -.075], [.035, .855, .065, -.085], [.105, .865, .095, -.12], [.18, .905, .04, -.065]],
  // Lower pelvis → iliac crest → oblique wall. Keep the waist/pelvis width change gradual.
  [[0, .925, .102, -.12], [.065, .93, .106, -.134], [.135, .94, .084, -.12], [.174, .95, .018, -.041]],
  [[0, 1.015, .105, -.102], [.065, 1.02, .105, -.11], [.14, 1.025, .094, -.096], [.18, 1.03, .012, -.035]],
  [[0, 1.105, .104, -.087], [.055, 1.105, .105, -.091], [.125, 1.11, .078, -.083], [.163, 1.115, .008, -.03]],
  // Costal arch and paired chest planes stay close to the sternum; detail is millimetric.
  [[0, 1.225, .113, -.10], [.06, 1.23, .116, -.106], [.14, 1.24, .091, -.101], [.19, 1.25, .013, -.036]],
  [[0, 1.345, .129, -.112], [.065, 1.345, .14, -.118], [.16, 1.355, .12, -.11], [.215, 1.355, .10, -.095]],
  [[0, 1.43, .111, -.105], [.055, 1.43, .115, -.11], [.16, 1.435, .101, -.101], [.245, 1.425, .08, -.09]],
  // The clavicle descends laterally; the rear roof carries the trapezius into the acromion.
  [[0, 1.505, .058, -.067], [.035, 1.505, .051, -.064], [.075, 1.495, .027, -.051], [.235, 1.452, .045, -.065]],
];

type ShoulderPoint = readonly [x: number, y: number, lateral: number];
// Front axillary fold → anterior deltoid → acromion → posterior deltoid → rear fold.
// The shoulder roof fans into the upper-arm aperture in a neutral 30° A-pose.
const DELTOID_PATCH_ROWS: readonly (readonly ShoulderPoint[])[] = [
  [[.1, 1.355, .275], [.085, 1.395, .295], [.03, 1.44, .274], [-.045, 1.44, .274], [-.085, 1.395, .295], [-.09, 1.355, .275]],
];

// Ten landmark vertices per neck/head boundary: five face, five rear cranium.
// The shoulders remain part of the torso patches and connect to this aperture.
type HeadBoundary = { y: number; halfWidth: number; front: readonly number[]; back: readonly number[]; centreY?: number };
const HEAD_BOUNDARIES: readonly HeadBoundary[] = [
  { y: 1.565, halfWidth: .061, front: [.015, .048, .054, .048, .015], back: [-.04, -.057, -.062, -.057, -.04] },
  { y: 1.623, halfWidth: .09, front: [.038, .108, .14, .108, .038], back: [-.055, -.077, -.085, -.077, -.055], centreY: 1.602 },
  { y: 1.657, halfWidth: .096, front: [.025, .115, .13, .115, .025], back: [-.055, -.09, -.10, -.09, -.055] },
  { y: 1.704, halfWidth: .101, front: [.01, .105, .14, .105, .01], back: [-.06, -.096, -.108, -.096, -.06] },
  { y: 1.745, halfWidth: .102, front: [.008, .106, .107, .106, .008], back: [-.06, -.098, -.112, -.098, -.06] },
  { y: 1.79, halfWidth: .09, front: [-.005, .09, .095, .09, -.005], back: [-.055, -.092, -.102, -.092, -.055] },
  { y: 1.825, halfWidth: .06, front: [-.005, .045, .055, .045, -.005], back: [-.04, -.065, -.075, -.065, -.04] },
];

export function createControlCage(): ControlMesh {
  const vertices: Vector3[] = [];
  const faces: number[][] = [];
  const cage: ControlMesh = { vertices, faces, loops: {} };
  const front: number[][] = [];
  const back: number[][] = [];
  for (const row of BODY_PATCH_ROWS) {
    const mirrored = [...row.slice(1).reverse().map(([z, y, x, rear]) => [-z, y, x, rear] as Landmark), ...row];
    front.push(mirrored.map(([z, y, x]) => { vertices.push(new Vector3(x, y, z)); return vertices.length - 1; }));
    back.push(mirrored.map(([z, y, , x]) => { vertices.push(new Vector3(x, y, z)); return vertices.length - 1; }));
  }
  for (let row = 0; row < front.length - 1; row++) {
    for (let column = 0; column < 6; column++) {
      faces.push([front[row][column], front[row][column + 1], front[row + 1][column + 1], front[row + 1][column]]);
      faces.push([back[row][column], back[row + 1][column], back[row + 1][column + 1], back[row][column + 1]]);
    }
    // Two upper flank faces become one six-sided deltoid aperture on each side.
    if (row < 5) for (const side of [0, 6]) faces.push([front[row][side], front[row + 1][side], back[row + 1][side], back[row][side]]);
  }
  for (const side of [0, 6]) {
    const sign = side === 0 ? -1 : 1;
    let socket = [front[5][side], front[6][side], front[7][side], back[7][side], back[6][side], back[5][side]];
    for (const row of DELTOID_PATCH_ROWS) {
      const next = row.map(([x, y, lateral]) => {
        vertices.push(new Vector3(x, y, sign * lateral));
        return vertices.length - 1;
      });
      for (let i = 0; i < socket.length; i++) {
        const j = (i + 1) % socket.length;
        faces.push([socket[i], socket[j], next[j], next[i]]);
      }
      socket = next;
    }
    appendArm(cage, socket, sign);
  }
  // Keep the two centre quads as the perineum. The outer pairs open into the thighs.
  for (const column of [2, 3]) faces.push([front[0][column], back[0][column], back[0][column + 1], front[0][column + 1]]);
  for (const sign of [-1, 1]) {
    const columns = sign > 0 ? [4, 5, 6] : [2, 1, 0];
    const socket = [...columns.map((c) => front[0][c]), ...[...columns].reverse().map((c) => back[0][c])];
    appendLeg(cage, socket, sign);
  }
  const top = front.length - 1;
  // Close only the shoulder roofs; the central aperture is welded into the neck.
  for (const column of [0, 5]) faces.push([front[top][column], front[top][column + 1], back[top][column + 1], back[top][column]]);
  let boundary = [...front[top].slice(1, 6), ...back[top].slice(1, 6).reverse()];
  for (const row of HEAD_BOUNDARIES) {
    const z = [-1, -.5, 0, .5, 1].map((factor) => factor * row.halfWidth);
    const next: number[] = [];
    for (const side of ['front', 'back'] as const) {
      const order = side === 'front' ? [0, 1, 2, 3, 4] : [4, 3, 2, 1, 0];
      for (const column of order) {
        next.push(vertices.length);
        vertices.push(new Vector3(row[side][column], side === 'front' && column === 2 ? row.centreY ?? row.y : row.y, z[column]));
      }
    }
    for (let index = 0; index < boundary.length; index++) {
      const neighbour = (index + 1) % boundary.length;
      faces.push([boundary[index], next[index], next[neighbour], boundary[neighbour]]);
    }
    boundary = next;
  }
  faces.push([...boundary].reverse());
  return orientClosedMesh(cage);
}
