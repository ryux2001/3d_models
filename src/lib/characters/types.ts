import type { Group } from 'three';

export const JOINT_NAMES = [
  'Hips', 'Torso', 'Neck', 'Head',
  'Shoulder_L', 'Elbow_L', 'Hand_L',
  'Shoulder_R', 'Elbow_R', 'Hand_R',
  'Hip_L', 'Knee_L', 'Ankle_L',
  'Hip_R', 'Knee_R', 'Ankle_R',
] as const;

export type JointName = (typeof JOINT_NAMES)[number];
export type JointPose = Partial<Record<JointName, number>>;

/** Rigid articulated meshes, not a Bone/SkinnedMesh skeleton. */
export interface CharacterAsset {
  root: Group;
  joints: Record<JointName, Group>;
  resetPose: () => void;
  dispose: () => void;
}
