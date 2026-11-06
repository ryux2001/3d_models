export const HEIGHT_RANGE = { min: 1.2, max: 2.4, step: 0.05 } as const;
export const DEFAULT_HEIGHT = 1.8;

/** Dimensions in metres at the reference height. +Y up, facing +X. */
export const PROPORTIONS = {
  hipsY: 0.94,
  hipSpacing: 0.115,
  shoulderY: 0.49,
  shoulderSpacing: 0.205,
  upperArm: 0.29,
  forearm: 0.26,
  thigh: 0.40,
  shin: 0.40,
  ankleY: 0.14,
} as const;

/** Rest angles in radians. Kept together so the weapon can counter the grip angle. */
export const REST_POSE = {
  shoulderR: 0.42,
  elbowR: 1.02,
  shoulderL: -0.14,
  elbowL: 0.20,
} as const;

/** Sculpted cross sections in each pivot's local coordinates. */
export const BODY_PROFILES = {
  pelvis: [[-0.11, 0.09, 0.12], [-0.04, 0.13, 0.17], [0.07, 0.12, 0.16]],
  belt: [[0.055, 0.12, 0.16], [0.065, 0.135, 0.17], [0.115, 0.13, 0.165], [0.125, 0.115, 0.15]],
  abdomen: [[-0.025, 0.115, 0.15], [0.09, 0.105, 0.135], [0.22, 0.135, 0.18]],
  chest: [[0.13, 0.11, 0.15], [0.22, 0.145, 0.20, 0.01], [0.34, 0.155, 0.22, 0.005], [0.405, 0.12, 0.17], [0.44, 0.075, 0.11]],
  neck: [[-0.055, 0.055, 0.06], [0.02, 0.06, 0.065], [0.075, 0.055, 0.06]],
  head: [[-0.045, 0.045, 0.057, 0.035], [-0.005, 0.09, 0.085, 0.025], [0.08, 0.112, 0.11, 0.005], [0.155, 0.104, 0.106, -0.008], [0.195, 0.065, 0.08, -0.018]],
  nose: [[0.025, 0.012, 0.025, 0.11], [0.055, 0.025, 0.026, 0.135], [0.10, 0.012, 0.02, 0.112]],
  hair: [[0.135, 0.108, 0.113, -0.012], [0.185, 0.095, 0.108, -0.02], [0.22, 0.055, 0.07, -0.025]],
  hairBack: [[0.005, 0.018, 0.08, -0.091], [0.10, 0.025, 0.111, -0.095], [0.15, 0.025, 0.108, -0.085]],
  shoulder: [[-0.115, 0.08, 0.08], [-0.065, 0.115, 0.12], [0.015, 0.10, 0.11], [0.055, 0.045, 0.055]],
  upperArm: [[-PROPORTIONS.upperArm - 0.015, 0.053, 0.053], [-0.19, 0.065, 0.063], [-0.10, 0.082, 0.077], [0.015, 0.065, 0.068]],
  forearm: [[-PROPORTIONS.forearm - 0.01, 0.045, 0.048], [-0.19, 0.055, 0.06], [-0.075, 0.079, 0.078], [0.015, 0.06, 0.065]],
  hand: [[-0.095, 0.045, 0.043, 0.012], [-0.075, 0.061, 0.052, 0.012], [-0.015, 0.063, 0.052], [0.025, 0.039, 0.041]],
  thigh: [[-PROPORTIONS.thigh - 0.015, 0.071, 0.068], [-0.28, 0.083, 0.077], [-0.13, 0.112, 0.098], [0.025, 0.098, 0.09]],
  knee: [[-0.08, 0.09, 0.085], [-0.055, 0.096, 0.094], [0.045, 0.096, 0.094], [0.075, 0.088, 0.085]],
  shin: [[-PROPORTIONS.shin - 0.01, 0.063, 0.065], [-0.29, 0.069, 0.073], [-0.14, 0.087, 0.085, -0.012], [0.02, 0.073, 0.072]],
  foot: [[-PROPORTIONS.ankleY, 0.142, 0.077, 0.065], [-0.115, 0.164, 0.09, 0.07], [-0.065, 0.16, 0.09, 0.07], [0.015, 0.10, 0.08, 0.015], [0.08, 0.068, 0.068, -0.01]],
} as const satisfies Record<string, readonly ProfileRing[]>;

export function heightScale(height: number) {
  if (!Number.isFinite(height)) throw new Error('Character height must be finite.');
  return Math.min(HEIGHT_RANGE.max, Math.max(HEIGHT_RANGE.min, height)) / DEFAULT_HEIGHT;
}
import type { ProfileRing } from '../shared/geometry';
