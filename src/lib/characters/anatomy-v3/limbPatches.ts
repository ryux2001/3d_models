import { Vector3 } from 'three';
import type { ControlMesh } from './subdivision';

type Point = readonly [x: number, y: number, z: number];
type Section = {
  at: Point;
  // Six independently authored landmarks, not samples on an ellipse.
  contour: readonly (readonly [x: number, transverse: number])[];
  loop?: string;
};

const ARM_SECTIONS: readonly Section[] = [
  { at: [0, 1.325, .31], loop: 'Shoulder', contour: [[.052,-.027],[.06,.024],[.008,.062],[-.06,.028],[-.052,-.027],[-.004,-.052]] },
  { at: [.003, 1.28, .335], contour: [[.061,-.029],[.069,.029],[.004,.062],[-.067,.031],[-.058,-.03],[-.005,-.052]] },
  { at: [.008, 1.235, .36], contour: [[.052,-.026],[.059,.026],[0,.054],[-.058,.026],[-.05,-.027],[-.004,-.047]] },
  { at: [.012, 1.205, .378], loop: 'Elbow_before', contour: [[.043,-.022],[.047,.023],[0,.046],[-.046,.023],[-.041,-.022],[0,-.04]] },
  { at: [.012, 1.18, .392], loop: 'Elbow', contour: [[.037,-.021],[.043,.021],[0,.042],[-.044,.021],[-.041,-.022],[-.003,-.039]] },
  { at: [.013, 1.155, .406], loop: 'Elbow_after', contour: [[.041,-.022],[.047,.023],[0,.045],[-.043,.022],[-.038,-.022],[.003,-.04]] },
  { at: [.018, 1.105, .435], contour: [[.044,-.024],[.05,.026],[.003,.047],[-.046,.025],[-.037,-.023],[.005,-.042]] },
  { at: [.023, 1.025, .48], contour: [[.032,-.019],[.035,.019],[.003,.035],[-.031,.018],[-.027,-.019],[.003,-.032]] },
  { at: [.025, .972, .51], contour: [[.025,-.015],[.027,.015],[.002,.028],[-.024,.015],[-.022,-.015],[0,-.027]] },
  { at: [.025, .95, .523], loop: 'Hand', contour: [[.024,-.015],[.025,.015],[0,.027],[-.021,.015],[-.02,-.015],[0,-.026]] },
  { at: [.025, .915, .544], loop: 'Palm', contour: [[.022,-.021],[.024,.021],[0,.043],[-.02,.021],[-.018,-.021],[0,-.043]] },
  { at: [.025, .875, .566], contour: [[.023,-.021],[.024,.023],[0,.044],[-.02,.022],[-.018,-.021],[0,-.044]] },
  { at: [.024, .83, .59], contour: [[.016,-.017],[.018,.019],[0,.034],[-.015,.018],[-.014,-.017],[0,-.033]] },
  { at: [.022, .815, .598], contour: [[.009,-.01],[.01,.012],[0,.022],[-.009,.011],[-.008,-.01],[0,-.02]] },
];

const LEG_SECTIONS: readonly Section[] = [
  { at: [0, .84, .11], loop: 'Hip', contour: [[.067,-.065],[.105,0],[.058,.075],[-.065,.075],[-.118,0],[-.062,-.065]] },
  { at: [.004, .76, .113], contour: [[.062,-.063],[.108,0],[.059,.077],[-.057,.077],[-.102,0],[-.055,-.063]] },
  { at: [.009, .66, .115], contour: [[.052,-.055],[.085,0],[.045,.065],[-.044,.065],[-.073,0],[-.043,-.055]] },
  { at: [.014, .575, .115], loop: 'Knee_before', contour: [[.041,-.044],[.065,0],[.036,.053],[-.035,.053],[-.051,0],[-.032,-.044]] },
  { at: [.015, .54, .115], loop: 'Knee', contour: [[.037,-.043],[.063,0],[.033,.051],[-.032,.051],[-.046,0],[-.031,-.043]] },
  { at: [.01, .505, .116], loop: 'Knee_after', contour: [[.034,-.042],[.053,0],[.031,.052],[-.037,.052],[-.059,0],[-.034,-.042]] },
  { at: [-.004, .435, .118], contour: [[.033,-.049],[.048,0],[.034,.062],[-.051,.062],[-.088,0],[-.045,-.049]] },
  { at: [-.012, .34, .12], contour: [[.027,-.043],[.042,0],[.029,.054],[-.043,.054],[-.075,0],[-.037,-.043]] },
  { at: [-.015, .225, .12], contour: [[.023,-.03],[.034,0],[.024,.04],[-.029,.04],[-.047,0],[-.026,-.03]] },
  { at: [-.015, .14, .12], loop: 'Ankle', contour: [[.021,-.027],[.032,0],[.023,.035],[-.026,.035],[-.04,0],[-.025,-.027]] },
  { at: [0, .095, .12], contour: [[.087,-.038],[.125,0],[.09,.046],[-.05,.046],[-.068,0],[-.05,-.038]] },
  { at: [0, .045, .12], contour: [[.175,-.047],[.215,0],[.184,.062],[-.066,.052],[-.078,0],[-.067,-.04]] },
  { at: [0, .008, .12], loop: 'Sole', contour: [[.177,-.047],[.219,0],[.186,.062],[-.068,.052],[-.078,0],[-.067,-.04]] },
];

function addContour(cage: ControlMesh, section: Section, sign: number, arm: boolean) {
  return section.contour.map(([x, t]) => {
    const index = cage.vertices.length;
    cage.vertices.push(new Vector3(section.at[0] + x,
      section.at[1] + (arm ? t * .5 : 0), sign * (section.at[2] + t * (arm ? .8660254 : 1))));
    return index;
  });
}

function bridge(cage: ControlMesh, a: number[], b: number[], omittedEdge = -1) {
  if (a.length !== b.length) throw new Error('V3 limb boundaries must have matching connectivity.');
  for (let i = 0; i < a.length; i++) {
    if (i === omittedEdge) continue;
    const j = (i + 1) % a.length;
    cage.faces.push([a[i], a[j], b[j], b[i]]);
  }
}

function appendThumb(cage: ControlMesh, aperture: number[], sign: number) {
  let boundary = aperture;
  for (const [dx, dy, dz, shrink] of [[.019, -.012, -.02, .72], [.007, -.023, -.017, .55]]) {
    const centre = boundary.reduce((sum, index) => sum.add(cage.vertices[index]), new Vector3()).multiplyScalar(1 / boundary.length);
    const next = boundary.map((index) => {
      const point = cage.vertices[index].clone().sub(centre).multiplyScalar(shrink).add(centre).add(new Vector3(dx, dy, sign * dz));
      cage.vertices.push(point);
      return cage.vertices.length - 1;
    });
    bridge(cage, boundary, next);
    boundary = next;
  }
  cage.faces.push(boundary);
}

export function appendArm(cage: ControlMesh, aperture: number[], sign: number) {
  let boundary = aperture;
  const side = sign > 0 ? 'R' : 'L';
  for (let i = 0; i < ARM_SECTIONS.length; i++) {
    const section = ARM_SECTIONS[i];
    const next = addContour(cage, section, sign, true);
    // Remove one palm quad and replace it with a welded thumb branch.
    const thumbHere = i === 11;
    bridge(cage, boundary, next, thumbHere ? 5 : -1);
    if (thumbHere) appendThumb(cage, [boundary[5], boundary[0], next[0], next[5]], sign);
    if (section.loop) cage.loops![`${section.loop}_${side}`] = next;
    boundary = next;
  }
  cage.faces.push(boundary);
}

export function appendLeg(cage: ControlMesh, aperture: number[], sign: number) {
  let boundary = aperture;
  const side = sign > 0 ? 'R' : 'L';
  for (const section of LEG_SECTIONS) {
    const next = addContour(cage, section, sign, false);
    bridge(cage, boundary, next);
    if (section.loop) cage.loops![`${section.loop}_${side}`] = next;
    boundary = next;
  }
  cage.faces.push(boundary);
}
