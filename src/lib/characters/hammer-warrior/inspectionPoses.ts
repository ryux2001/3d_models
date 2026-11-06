import { Box3, MathUtils } from 'three';
import type { CharacterAsset, JointName, JointPose } from '../types';

export const INSPECTION_POSES = [
  { id: 'rest', label: 'Reposo' },
  { id: 'prepare', label: 'Preparación' },
  { id: 'raised', label: 'Martillo elevado' },
  { id: 'crouch', label: 'Agachado' },
] as const;
export type InspectionPose = (typeof INSPECTION_POSES)[number]['id'];
type Rotation = readonly [x: number, y: number, z: number];
const POSES: Record<InspectionPose, Partial<Record<JointName, Rotation>>> = {
  rest: { Hand_R: [0, 0, -22], Hip_L: [0, 0, 9], Knee_L: [0, 0, -9], Ankle_L: [0, 0, 0] },
  prepare: {
    Torso: [0, -8, -10], Shoulder_R: [-10, 0, 70], Elbow_R: [0, 0, 42],
    Shoulder_L: [12, 0, 28], Elbow_L: [0, 0, 65],
    Hip_R: [0, 0, 30], Knee_R: [0, 0, -40], Ankle_R: [0, 0, 10],
    Hip_L: [0, 0, -12], Knee_L: [0, 0, -12], Ankle_L: [0, 0, 24],
  },
  raised: {
    Torso: [0, 0, 5], Shoulder_R: [-12, 0, 150], Elbow_R: [0, 0, 25],
    Shoulder_L: [18, 0, 45], Elbow_L: [0, 0, 75],
    Hip_L: [0, 0, 12], Knee_L: [0, 0, -12],
  },
  crouch: {
    Torso: [0, 0, -18], Head: [0, 0, 12],
    Shoulder_R: [-8, 0, 65], Elbow_R: [0, 0, 45],
    Shoulder_L: [12, 0, 38], Elbow_L: [0, 0, 55],
    Hip_R: [0, 0, 52], Knee_R: [0, 0, -104], Ankle_R: [0, 0, 52],
    Hip_L: [0, 0, 45], Knee_L: [0, 0, -90], Ankle_L: [0, 0, 45],
  },
};

/** Static inspection only: absolute preset rotations followed by manual local-Z offsets. */
export function applyInspectionPose(asset: CharacterAsset, preset: InspectionPose, offsets: JointPose) {
  asset.resetPose();
  for (const [name, rotation] of Object.entries(POSES[preset])) {
    asset.joints[name as JointName].rotation.set(...rotation.map(MathUtils.degToRad) as [number, number, number]);
  }
  // Ground each leg independently before lowering the shared pelvis. No runtime IK.
  asset.root.updateMatrixWorld(true);
  const feet = (['L', 'R'] as const).map((side) => {
    const foot = asset.root.getObjectByName(`Foot_${side}`)!;
    return { side, floor: new Box3().setFromObject(foot).min.y / asset.root.scale.y };
  });
  const floor = Math.min(...feet.map((foot) => foot.floor));
  asset.joints.Hips.position.y -= floor;
  for (const foot of feet) asset.joints[`Hip_${foot.side}`].position.y -= foot.floor - floor;
  for (const [name, degrees] of Object.entries(offsets)) {
    if (Number.isFinite(degrees)) asset.joints[name as JointName].rotateZ(MathUtils.degToRad(degrees!));
  }
  asset.root.updateMatrixWorld(true);
}
