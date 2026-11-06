import { MathUtils, Vector3 } from 'three';
import type { ControlMesh } from './subdivision';
import { JOINT_ANCHORS } from './landmarks';

const bell = (v: number, c: number, w: number) => Math.exp(-.5 * ((v - c) / w) ** 2);
const paired = (z: number, c: number, w: number) => (bell(z, c, w) + bell(z, -c, w)) / (1 + bell(2 * c, 0, w));

function armCentre(point: Vector3) {
  const p = new Vector3(point.x, point.y, Math.abs(point.z));
  const chain = [JOINT_ANCHORS.Shoulder_R, JOINT_ANCHORS.Elbow_R, JOINT_ANCHORS.Hand_R, [.022, .815, .598]];
  let best = new Vector3(), distance = Infinity;
  for (let i = 0; i < chain.length - 1; i++) {
    const a = new Vector3(...chain[i] as [number, number, number]);
    const b = new Vector3(...chain[i + 1] as [number, number, number]);
    const direction = b.sub(a);
    const t = MathUtils.clamp(p.clone().sub(a).dot(direction) / direction.lengthSq(), 0, 1);
    const candidate = a.addScaledVector(direction, t);
    if (candidate.distanceToSquared(p) < distance) {
      distance = candidate.distanceToSquared(p);
      best = candidate;
    }
  }
  return best;
}

/** Position-only refinement of the preserved V3.1 cage. No new faces, indices or loops. */
export function refineControlCageV32(cage: ControlMesh): ControlMesh {
  const vertices = cage.vertices.map((source) => {
    const p = source.clone();
    const y = source.y, z = Math.abs(source.z), sign = Math.sign(source.z);
    const front = MathUtils.smoothstep(source.x, .02, .085);
    const back = 1 - MathUtils.smoothstep(source.x, -.08, -.02);
    const trunk = 1 - MathUtils.smoothstep(z, .19, .27);
    // A ribcage with a restrained pectoral shelf, supported by a broad sternum.
    p.x += trunk * front * (.004 * bell(y, 1.335, .065)
      + .002 * bell(y, 1.345, .065) * bell(z, 0, .035)
      + .0025 * bell(y, 1.17, .075) * paired(source.z, .035, .055));
    p.x -= trunk * back * (.006 * bell(y, .93, .065) * paired(source.z, .08, .07)
      + .002 * bell(y, 1.39, .065) * paired(source.z, .09, .075));
    p.z *= 1 - .025 * bell(y, 1.11, .06) * trunk;
    p.z += sign * .004 * bell(y, 1.015, .055) * bell(z, .15, .045);

    // Mass is added around the unchanged A-pose axes, not by moving the joints.
    const armWeight = MathUtils.smoothstep(z, .205, .30)
      * MathUtils.smoothstep(y, .76, .81) * (1 - MathUtils.smoothstep(y, 1.45, 1.49));
    if (armWeight > 0) {
      const c = armCentre(source);
      const upper = bell(y, 1.285, .075), forearm = bell(y, 1.105, .065);
      const palm = bell(y, .895, .035), digits = bell(y, .835, .022);
      const depthScale = 1 + armWeight * (.07 + .14 * upper + .15 * forearm + .055 * palm + .02 * digits);
      const widthScale = 1 + armWeight * (.07 + .17 * upper + .16 * forearm + .12 * palm + .025 * digits);
      p.x = c.x + (p.x - c.x) * depthScale;
      p.y = c.y + (p.y - c.y) * widthScale;
      p.z = sign * (c.z + (Math.abs(p.z) - c.z) * widthScale);
      const anterior = MathUtils.smoothstep(source.x - c.x, 0, .045);
      p.x += armWeight * anterior * .004 * bell(y, 1.28, .05);
    }

    const legWeight = (1 - MathUtils.smoothstep(y, .87, .96)) * MathUtils.smoothstep(z, .015, .07)
      * (1 - MathUtils.smoothstep(z, .22, .28));
    if (legWeight > 0 && y >= .13) {
      const centreZ = MathUtils.lerp(.12, .11, MathUtils.clamp((y - .14) / .81, 0, 1));
      const centreX = y < .54 ? MathUtils.lerp(-.015, .015, MathUtils.clamp((y - .14) / .40, 0, 1)) : .007;
      const thigh = bell(y, .755, .105), calf = bell(y, .41, .075), knee = bell(y, .54, .035);
      p.x = centreX + (p.x - centreX) * (1 + legWeight * (.04 + .11 * thigh + .11 * calf + .035 * knee));
      p.z = sign * (centreZ + (Math.abs(p.z) - centreZ) * (1 + legWeight * (.04 + .16 * thigh + .14 * calf + .035 * knee)));
      p.x -= legWeight * back * .004 * calf;
    }

    if (y < .13 && z > .04) {
      // Shorter, oblique toe box: the medial forefoot reaches farther than the lateral toes.
      if (p.x > .11) p.x = .11 + (p.x - .11) * .70;
      p.x += .018 * bell(y, .025, .03) * bell(z, .078, .025) * MathUtils.smoothstep(source.x, .10, .17);
      p.x -= .025 * bell(y, .095, .021) * MathUtils.smoothstep(source.x, .04, .13);
      p.y -= .022 * bell(y, .095, .018) * MathUtils.smoothstep(source.x, .04, .12);
      p.x -= .010 * bell(y, .035, .03) * (1 - MathUtils.smoothstep(source.x, -.08, -.025));
      const footCentre = .12;
      p.z = sign * (footCentre + (z - footCentre) * (1 + .14 * bell(source.x, .115, .085)));
    }

    // Slightly longer lower face and a firmer jaw, without adding facial topology.
    const head = MathUtils.smoothstep(y, 1.555, 1.61);
    if (head > 0) {
      p.y -= head * .010 * bell(y, 1.625, .055);
      p.z *= 1 + head * (.008 + .065 * bell(y, 1.63, .025));
      p.x -= head * front * .004 * bell(y, 1.62, .025);
    }
    return p;
  });
  return { vertices, faces: cage.faces, loops: cage.loops };
}

/** Resolve the medial plantar arch and dorsal/thenar planes on the evaluated surface. */
export function finishSurfaceV32(surface: ControlMesh): ControlMesh {
  const normals = surface.vertices.map(() => new Vector3());
  for (const face of surface.faces) {
    const a = surface.vertices[face[0]];
    for (let i = 1; i < face.length - 1; i++) {
      const b = surface.vertices[face[i]], c = surface.vertices[face[i + 1]];
      const n = b.clone().sub(a).cross(c.clone().sub(a));
      for (const index of [face[0], face[i], face[i + 1]]) normals[index].add(n);
    }
  }
  normals.forEach((normal) => normal.normalize());
  const vertices = surface.vertices.map((source, index) => {
    const p = source.clone(), z = Math.abs(p.z);
    if (p.y < .13 && z > .04) {
      const sole = 1 - MathUtils.smoothstep(p.y, .015, .045);
      p.y += .012 * sole * bell(p.x, .035, .055) * bell(z, .087, .022);
      p.y += .007 * bell(p.y, .075, .025) * bell(p.x, .035, .05) * bell(z, .12, .045);
      p.y -= .009 * bell(source.y, .065, .023) * MathUtils.smoothstep(p.x, .085, .14);
      p.y += .005 * bell(source.y, .04, .016) * bell(p.x, .155, .045);
      // A lower metatarsal shelf and rounded toe pad replace the long triangular ramp.
      // Only dorsal vertices move toward the envelope; soles and side transitions retain volume.
      const dorsal = MathUtils.smoothstep(normals[index].y, .2, .65)
        * MathUtils.smoothstep(p.x, .065, .105) * (1 - MathUtils.smoothstep(source.y, .10, .14));
      const toeEnvelope = (.034 + .012 * bell(p.x, .115, .03) - .010 * MathUtils.smoothstep(p.x, .165, .20))
        * (1 - .12 * MathUtils.clamp(Math.abs(z - .12) / .065, 0, 1));
      p.y = MathUtils.lerp(p.y, toeEnvelope, dorsal);
    }
    if (p.y < .94 && p.y > .81 && z > .47) {
      const c = armCentre(source);
      const palmar = MathUtils.smoothstep(p.x - c.x, 0, .025);
      p.x += .0025 * palmar * bell(p.y, .90, .028);
      const thumbPad = bell(p.y, .86, .022) * bell(z, .49, .022) * MathUtils.smoothstep(p.x, .035, .06);
      p.x += .002 * thumbPad;
      p.z -= Math.sign(p.z) * .002 * thumbPad;
    }
    return p;
  });
  return { vertices, faces: surface.faces, loops: surface.loops };
}
