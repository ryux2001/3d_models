import type { JointName } from '../types';

/** Metres, +X forward. These are design anchors, not a bound skeleton. */
export const REFERENCE_HEIGHT = 1.8;
export const LANDMARKS = {
  crown: [-0.015, 1.805, 0],
  chin: [0.09, 1.603, 0],
  neckPit: [0.055, 1.49, 0],
  sternum: [0.132, 1.375, 0],
  navel: [0.098, 1.105, 0],
  sacrum: [-0.13, 0.96, 0],
  shoulderR: [0, 1.435, 0.25],
  shoulderL: [0, 1.435, -0.25],
} as const;

export const JOINT_ANCHORS: Record<JointName, readonly [number, number, number]> = {
  Hips: [0, 0.95, 0], Torso: [0, 1.10, 0], Neck: [0, 1.51, 0], Head: [0.01, 1.62, 0],
  Shoulder_L: LANDMARKS.shoulderL, Elbow_L: [.012, 1.18, -.392], Hand_L: [.025, .95, -.523],
  Shoulder_R: LANDMARKS.shoulderR, Elbow_R: [.012, 1.18, .392], Hand_R: [.025, .95, .523],
  Hip_L: [0, 0.95, -0.11], Knee_L: [.015, 0.54, -0.115], Ankle_L: [-.015, 0.14, -0.12],
  Hip_R: [0, 0.95, 0.11], Knee_R: [.015, 0.54, 0.115], Ankle_R: [-.015, 0.14, 0.12],
};

export const VISIBLE_ANCHORS: readonly JointName[] = [
  'Hips', 'Torso', 'Neck', 'Head', 'Shoulder_L', 'Elbow_L', 'Hand_L',
  'Shoulder_R', 'Elbow_R', 'Hand_R', 'Hip_L', 'Knee_L', 'Ankle_L', 'Hip_R', 'Knee_R', 'Ankle_R',
];
