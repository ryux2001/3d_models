import { Group, Mesh, SphereGeometry, type Material, type Object3D } from 'three';
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
  const jointGeometry = new SphereGeometry(1, 12, 8);
  // Mirrored limbs share geometry within this asset, never between assets.
  const profiles = new Map<readonly ProfileRing[], ReturnType<typeof createProfileGeometry>>();
  function sculpt(parent: Object3D, name: string, material: Material, rings: readonly ProfileRing[]) {
    let geometry = profiles.get(rings);
    if (!geometry) {
      geometry = createProfileGeometry(rings, { section: 'ellipse', segments: 12 });
      profiles.set(rings, geometry);
    }
    const mesh = new Mesh(geometry, material);
    mesh.name = name;
    parent.add(mesh);
    return mesh;
  }
  function roundDetail(parent: Object3D, name: string, material: Material,
    size: [number, number, number], position: [number, number, number]) {
    const mesh = new Mesh(jointGeometry, material);
    mesh.name = name;
    mesh.scale.set(...size);
    mesh.position.set(...position);
    parent.add(mesh);
    return mesh;
  }

  sculpt(joints.Hips, 'Pelvis_Mesh', materials.cloth, body.pelvis);
  sculpt(joints.Hips, 'Belt_Mesh', materials.leather, body.belt);
  roundDetail(joints.Hips, 'Buckle_Mesh', materials.gold, [0.015, 0.027, 0.034], [0.123, 0.087, 0]);
  sculpt(joints.Torso, 'Abdomen_Mesh', materials.shirt, body.abdomen);
  sculpt(joints.Torso, 'Chest_Mesh', materials.jacket, body.chest);
  // A light inset reads as an open jacket without modelling tiny seams or buttons.
  sculpt(joints.Torso, 'Shirt_Front', materials.shirt, body.shirtFront);
  for (const side of ['L', 'R'] as const) {
    const sign = side === 'R' ? 1 : -1;
    sculpt(joints.Torso, `Jacket_Lapel_${side}`, materials.leather, body.lapel).position.z = sign * 0.076;
  }
  sculpt(joints.Neck, 'Neck_Mesh', materials.skin, body.neck);
  sculpt(joints.Head, 'Head_Mesh', materials.skin, body.head);
  sculpt(joints.Head, 'Nose_Mesh', materials.skin, body.nose);
  sculpt(joints.Head, 'Hair_Mesh', materials.hair, body.hair);
  sculpt(joints.Head, 'Hair_Back_Mesh', materials.hair, body.hairBack);
  const quiff = roundDetail(joints.Head, 'Hair_Quiff', materials.hair, [0.065, 0.035, 0.08], [0.028, 0.17, 0.012]);
  quiff.rotation.x = 0.25;
  quiff.rotation.z = -0.25;
  for (const side of ['L', 'R'] as const) {
    const sign = side === 'R' ? 1 : -1;
    roundDetail(joints.Head, `Ear_${side}`, materials.skin, [0.023, 0.033, 0.016], [-0.006, 0.063, sign * 0.101]);
    roundDetail(joints.Head, `Eye_${side}`, materials.face, [0.009, 0.008, 0.015], [0.088, 0.097, sign * 0.047]);
    const brow = roundDetail(joints.Head, `Brow_${side}`, materials.hair, [0.01, 0.006, 0.021], [0.085, 0.116, sign * 0.048]);
    brow.rotation.x = sign * 0.10;
  }
  roundDetail(joints.Head, 'Mouth_Mesh', materials.face, [0.005, 0.003, 0.025], [0.099, 0.015, 0]);

  for (const side of ['L', 'R'] as const) {
    const shoulder = joints[`Shoulder_${side}`];
    const elbow = joints[`Elbow_${side}`];
    const hip = joints[`Hip_${side}`];
    const knee = joints[`Knee_${side}`];
    sculpt(shoulder, `ShoulderCap_${side}`, materials.jacket, body.shoulder);
    sculpt(shoulder, `UpperArm_${side}`, materials.jacket, body.upperArm);
    roundDetail(elbow, `ElbowCap_${side}`, materials.skin, [0.052, 0.052, 0.054], [0, 0, 0]);
    sculpt(elbow, `Forearm_${side}`, materials.skin, body.forearm);
    sculpt(elbow, `Sleeve_Cuff_${side}`, materials.jacket, body.cuff);
    const hand = joints[`Hand_${side}`];
    sculpt(hand, `HandMesh_${side}`, materials.skin, body.hand);
    roundDetail(hand, `Thumb_${side}`, materials.skin, [0.026, 0.032, 0.022], [0.036, -0.035, 0.025]);
    sculpt(hip, `UpperLeg_${side}`, materials.cloth, body.thigh);
    // Small front patches, not the previous thick rings around each knee.
    sculpt(knee, `KneeCap_${side}`, materials.leather, body.knee);
    sculpt(knee, `LowerLeg_${side}`, materials.cloth, body.shin);
    sculpt(knee, `BootShaft_${side}`, materials.leather, body.bootShaft);
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
