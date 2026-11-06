import { CatmullRomCurve3, MathUtils, Vector3 } from 'three';
import type { ControlMesh } from './subdivision';
import { LANDMARKS } from './landmarks';

const gaussian = (value: number, centre: number, width: number) => Math.exp(-0.5 * ((value - centre) / width) ** 2);

// Unlike gaussian(abs(z), centre), a sum on signed Z has zero lateral derivative
// at the symmetry plane. Normalize at the lobe centre to keep amplitudes meaningful.
const bilateral = (z: number, centre: number, width: number) =>
  (gaussian(z, centre, width) + gaussian(z, -centre, width)) / (1 + gaussian(2 * centre, 0, width));

/** Local landmark fields shape the actual vertices, not shader-only detail or overlapping meshes. */
export function sculptSurface(mesh: ControlMesh): ControlMesh {
  const clavicle = new CatmullRomCurve3([
    new Vector3(...LANDMARKS.neckPit), new Vector3(.077, 1.466, .075),
    new Vector3(.068, 1.455, .155), new Vector3(.033, 1.437, .24),
  ], false, 'centripetal').getPoints(32);
  const neckTendon = new CatmullRomCurve3([
    new Vector3(.028, 1.605, .055), new Vector3(.05, 1.55, .038), new Vector3(.058, 1.49, .012),
  ], false, 'centripetal').getPoints(20);
  const vertices = mesh.vertices.map((original) => {
    const p = original.clone();
    const z = Math.abs(p.z);
    const anterior = MathUtils.smoothstep(p.x, .015, .075);
    const posterior = 1 - MathUtils.smoothstep(p.x, -.07, -.015);
    const field = (y: number, sy: number, lateral: number, sz: number) => gaussian(p.y, y, sy) * bilateral(p.z, lateral, sz);
    const curveField = (curve: Vector3[], width: number) => {
      const positive = Math.exp(-Math.min(...curve.map((point) => (p.y - point.y) ** 2 + (p.z - point.z) ** 2)) / (2 * width ** 2));
      const negative = Math.exp(-Math.min(...curve.map((point) => (p.y - point.y) ** 2 + (p.z + point.z) ** 2)) / (2 * width ** 2));
      return positive + negative - positive * negative;
    };
    // Paired pectoral mass, a shallow sternum, costal arch and restrained abdominal planes.
    p.x += anterior * (
      .007 * field(1.36, .055, .095, .065)
      - .0015 * field(1.375, .075, 0, .04)
      - .002 * field(1.278, .035, .09, .085)
      + .004 * field(1.17, .075, .035, .055)
      - .0015 * field(LANDMARKS.navel[1], .02, 0, .025)
      - .004 * field(1.075, .06, .125, .04)
      + .006 * curveField(clavicle, .024)
      + .0025 * curveField(neckTendon, .014)
    );
    // Scapular planes and spinal groove; gluteal mass remains separated from the lumbar curve.
    p.x -= posterior * (
      .008 * field(1.365, .085, .12, .065)
      - .0015 * field(1.30, .14, 0, .04)
      + .0025 * field(1.12, .07, .065, .055)
      + .003 * field(.935, .06, .075, .065)
    );
    // Modest iliac crest/oblique transition distributed over the side wall.
    p.z += (p.z / .155) * .003 * gaussian(p.y, 1.035, .045) * bilateral(p.z, .155, .035);
    if (p.y > 1.59) {
      // Retain the previous facial sculpting; this pass adds no facial detail.
      const faceField = (y: number, sy: number, lateral: number, sz: number) => gaussian(p.y, y, sy) * gaussian(z, lateral, sz);
      // Integrated nose, eye sockets, brow ridge, cheek and mouth/chin planes.
      p.x += anterior * (
        .018 * faceField(1.696, .017, 0, .016)
        - .014 * faceField(1.724, .012, .045, .022)
        + .009 * faceField(1.741, .009, .045, .03)
        + .009 * faceField(1.688, .019, .06, .026)
        - .006 * faceField(1.647, .004, 0, .04)
        + .007 * faceField(1.625, .013, 0, .035)
      );
      // Ear roots are part of the same manifold surface, not separate spheres.
      p.z += Math.sign(p.z) * .014 * gaussian(p.y, 1.695, .026) * gaussian(z, .092, .013) * gaussian(p.x, -.015, .04);
    }
    return new Vector3(p.x, p.y, p.z);
  });
  return { vertices, faces: mesh.faces, loops: mesh.loops };
}
