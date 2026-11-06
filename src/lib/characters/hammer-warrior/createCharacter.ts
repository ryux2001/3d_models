import { Group, IcosahedronGeometry, Mesh, type Material, type Object3D } from 'three';
import type { CharacterAsset } from '../types';
import { disposeObject } from '../shared/dispose';
import { createProfileGeometry, type ProfileRing } from '../shared/geometry';
import { createWarriorMaterials } from '../shared/materials';
import { createHammer } from './equipment';
import { createRig } from './rig';
import { BODY_PROFILES as body, DEFAULT_HEIGHT, heightScale, REST_POSE } from './proportions';

export function createCharacter(height = DEFAULT_HEIGHT): CharacterAsset {
  const scale = heightScale(height);
  const rig = createRig();
  const { root, joints } = rig;
  const materials = createWarriorMaterials();
  const jointGeometry = new IcosahedronGeometry(1, 1);
  // Mirrored limbs share geometry within this asset, never between assets.
  const profiles = new Map<readonly ProfileRing[], ReturnType<typeof createProfileGeometry>>();
  function sculpt(parent: Object3D, name: string, material: Material, rings: readonly ProfileRing[]) {
    let geometry = profiles.get(rings);
    if (!geometry) {
      geometry = createProfileGeometry(rings);
      profiles.set(rings, geometry);
    }
    const mesh = new Mesh(geometry, material);
    mesh.name = name;
    parent.add(mesh);
    return mesh;
  }
  function jointCover(parent: Object3D, name: string, material: Material,
    size: [number, number, number], x = 0) {
    const mesh = new Mesh(jointGeometry, material);
    mesh.name = name;
    mesh.scale.set(...size);
    mesh.position.x = x;
    parent.add(mesh);
  }

  sculpt(joints.Hips, 'Pelvis_Mesh', materials.cloth, body.pelvis);
  sculpt(joints.Hips, 'Belt_Mesh', materials.leather, body.belt);
  jointCover(joints.Hips, 'Buckle_Mesh', materials.gold, [0.024, 0.038, 0.045], 0.132);
  joints.Hips.getObjectByName('Buckle_Mesh')!.position.y = 0.09;
  sculpt(joints.Torso, 'Abdomen_Mesh', materials.cloth, body.abdomen);
  sculpt(joints.Torso, 'Chest_Mesh', materials.armor, body.chest);
  sculpt(joints.Neck, 'Neck_Mesh', materials.skin, body.neck);
  sculpt(joints.Head, 'Head_Mesh', materials.skin, body.head);
  sculpt(joints.Head, 'Nose_Mesh', materials.skin, body.nose);
  sculpt(joints.Head, 'Hair_Mesh', materials.leather, body.hair);
  sculpt(joints.Head, 'Hair_Back_Mesh', materials.leather, body.hairBack);

  for (const side of ['L', 'R'] as const) {
    const shoulder = joints[`Shoulder_${side}`];
    const elbow = joints[`Elbow_${side}`];
    const hip = joints[`Hip_${side}`];
    const knee = joints[`Knee_${side}`];
    sculpt(shoulder, `ShoulderCap_${side}`, materials.armor, body.shoulder);
    sculpt(shoulder, `UpperArm_${side}`, materials.skin, body.upperArm);
    jointCover(elbow, `ElbowCap_${side}`, materials.skin, [0.06, 0.06, 0.061]);
    sculpt(elbow, `Forearm_${side}`, materials.leather, body.forearm);
    sculpt(joints[`Hand_${side}`], `HandMesh_${side}`, materials.skin, body.hand);
    sculpt(hip, `UpperLeg_${side}`, materials.cloth, body.thigh);
    // A faceted wrap covers the seam without exposing a spherical, spiky edge.
    sculpt(knee, `KneeCap_${side}`, materials.armor, body.knee);
    sculpt(knee, `LowerLeg_${side}`, materials.leather, body.shin);
    sculpt(joints[`Ankle_${side}`], `Foot_${side}`, materials.leather, body.foot);
  }

  const grip = new Group();
  grip.name = 'WeaponGrip';
  grip.position.set(0.015, -0.035, 0);
  // Keep the hammer upright while bringing the hand further forward in profile.
  grip.rotation.z = -(REST_POSE.shoulderR + REST_POSE.elbowR);
  grip.add(createHammer(materials));
  joints.Hand_R.add(grip);
  root.scale.setScalar(scale);
  let disposed = false;
  return {
    ...rig,
    dispose() {
      if (disposed) return;
      disposed = true;
      root.removeFromParent();
      disposeObject(root);
    },
  };
}
