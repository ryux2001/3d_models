import { Group, MathUtils, type Object3D } from 'three';
import { JOINT_NAMES, type CharacterAsset, type JointName, type JointPose } from '../types';
import { PROPORTIONS as p, REST_POSE } from './proportions';

export function createRig() {
  const root = new Group();
  root.name = 'CharacterRoot';
  const joints = {} as Record<JointName, Group>;
  function joint(name: JointName, parent: Object3D, x: number, y: number, z: number) {
    const node = new Group();
    node.name = name;
    node.position.set(x, y, z);
    parent.add(node);
    joints[name] = node;
    return node;
  }

  const hips = joint('Hips', root, 0, p.hipsY, 0);
  const torso = joint('Torso', hips, 0, 0.10, 0);
  const neck = joint('Neck', torso, 0, 0.49, 0);
  joint('Head', neck, 0.015, 0.05, 0);
  for (const side of ['L', 'R'] as const) {
    const sign = side === 'R' ? 1 : -1;
    const shoulder = joint(`Shoulder_${side}`, torso, 0, p.shoulderY - 0.10, sign * p.shoulderSpacing);
    const elbow = joint(`Elbow_${side}`, shoulder, 0, -p.upperArm, 0);
    joint(`Hand_${side}`, elbow, 0, -p.forearm, 0);
    const hip = joint(`Hip_${side}`, hips, sign * 0.055, 0, sign * p.hipSpacing);
    const knee = joint(`Knee_${side}`, hip, 0, -p.thigh, 0);
    joint(`Ankle_${side}`, knee, 0, -p.shin, 0);
  }

  // Arms are separated in profile. The near hand holds the hammer forward.
  joints.Shoulder_R.rotation.z = REST_POSE.shoulderR;
  joints.Elbow_R.rotation.z = REST_POSE.elbowR;
  joints.Shoulder_L.rotation.z = REST_POSE.shoulderL;
  joints.Elbow_L.rotation.z = REST_POSE.elbowL;
  const rest = new Map(JOINT_NAMES.map((name) => [name, joints[name].quaternion.clone()]));
  const positions = new Map(JOINT_NAMES.map((name) => [name, joints[name].position.clone()]));
  const resetPose = () => {
    for (const name of JOINT_NAMES) {
      joints[name].quaternion.copy(rest.get(name)!);
      joints[name].position.copy(positions.get(name)!);
    }
  };
  return { root, joints, resetPose };
}

/** Debug offsets in degrees about local Z; these are not animation clips. */
export function applyJointPose(asset: CharacterAsset, pose: JointPose) {
  asset.resetPose();
  for (const name of JOINT_NAMES) {
    const degrees = pose[name];
    if (degrees !== undefined && Number.isFinite(degrees)) {
      asset.joints[name].rotateZ(MathUtils.degToRad(degrees));
    }
  }
}
