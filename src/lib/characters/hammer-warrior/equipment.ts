import { CylinderGeometry, Group, Mesh } from 'three';
import type { WarriorMaterials } from '../shared/materials';
import { createProfileGeometry } from '../shared/geometry';

/** Origin is the grip. The handle runs along local Y. */
export function createHammer(materials: WarriorMaterials) {
  const hammer = new Group();
  hammer.name = 'Hammer';
  const handle = new Mesh(new CylinderGeometry(0.022, 0.026, 0.72, 8), materials.leather);
  handle.name = 'Hammer_Handle';
  handle.position.y = 0.22;
  const head = new Mesh(createProfileGeometry([
    [-0.11, 0.17, 0.085], [-0.075, 0.205, 0.115],
    [0.075, 0.205, 0.115], [0.11, 0.17, 0.085],
  ]), materials.steel);
  head.name = 'Hammer_Head';
  head.position.y = 0.56;
  const band = new Mesh(createProfileGeometry([
    [-0.12, 0.035, 0.09], [-0.085, 0.05, 0.122],
    [0.085, 0.05, 0.122], [0.12, 0.035, 0.09],
  ]), materials.gold);
  band.name = 'Hammer_Band';
  band.position.y = 0.56;
  hammer.add(handle, head, band);
  return hammer;
}
