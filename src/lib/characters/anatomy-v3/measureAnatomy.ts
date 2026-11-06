import { Mesh, Raycaster, Vector3 } from 'three';
import type { CharacterAsset } from '../types';
import { LANDMARKS } from './landmarks';

/** Reproducible reference-pose measures, in metres. Cross-sections are sampled on the
 * surface; segment lengths use planned joint centres, not guessed image landmarks.
 */
export function measureAnatomy(asset: CharacterAsset) {
  if (Math.abs(asset.root.scale.x - 1) > 1e-9) throw new Error('Measurements require the reference-height asset.');
  const body = asset.root.getObjectByName('V3_AnatomySurface') as Mesh;
  const geometry = body.geometry;
  const positions = geometry.getAttribute('position');
  const { floor, scale } = asset.root.userData.normalization as { floor: number; scale: number };
  const designPoint = (x: number, y: number, z: number) => new Vector3(x * scale, (y - floor) * scale, z * scale);
  asset.root.updateMatrixWorld(true);
  const cast = (origin: Vector3, direction: Vector3) => {
    const hit = new Raycaster(origin, direction).intersectObject(body, false)[0];
    if (!hit) throw new Error(`Missing measurement surface at ${origin.toArray()}`);
    return hit.point;
  };
  const depth = (y: number, z: number) => cast(designPoint(.5, y, z), new Vector3(-1, 0, 0)).x
    - cast(designPoint(-.5, y, z), new Vector3(1, 0, 0)).x;
  const width = (y: number) => cast(designPoint(0, y, .25), new Vector3(0, 0, -1)).z
    - cast(designPoint(0, y, -.25), new Vector3(0, 0, 1)).z;
  const bounds = geometry.boundingBox!;
  const height = bounds.max.y - bounds.min.y;
  const chinY = asset.root.userData.measurementChinY ?? LANDMARKS.chin[1];
  const headBase = designPoint(0, chinY, 0).y;
  const headPoints: Vector3[] = [];
  const footPoints: Vector3[] = [];
  const handPoints: Vector3[] = [];
  for (let i = 0; i < positions.count; i++) {
    const p = new Vector3().fromBufferAttribute(positions, i);
    if (p.y > headBase + .03 * scale) headPoints.push(p);
    if (p.y < designPoint(0, .13, 0).y && p.z > 0) footPoints.push(p);
    if (p.y < designPoint(0, .95, 0).y && p.z > .45 * scale) handPoints.push(p);
  }
  const headWidth = Math.max(...headPoints.map((p) => p.z)) - Math.min(...headPoints.map((p) => p.z));
  const headHeight = bounds.max.y - headBase;
  const shoulderWidth = asset.joints.Shoulder_R.position.distanceTo(asset.joints.Shoulder_L.position);
  const upperArmLength = asset.joints.Shoulder_R.position.distanceTo(asset.joints.Elbow_R.position);
  const forearmLength = asset.joints.Elbow_R.position.distanceTo(asset.joints.Hand_R.position);
  const handAxis = asset.joints.Hand_R.position.clone().sub(asset.joints.Elbow_R.position).normalize();
  const handLength = Math.max(...handPoints.map((p) => p.clone().sub(asset.joints.Hand_R.position).dot(handAxis)));
  const palmIndices = asset.root.userData.deformationLoops.Palm_R as number[];
  const palmPoints = palmIndices.map((index) => new Vector3().fromBufferAttribute(positions, index));
  const palmTransverse = new Vector3(0, .5, .8660254);
  const palmProjection = palmPoints.map((p) => p.dot(palmTransverse));
  const palmWidth = Math.max(...palmProjection) - Math.min(...palmProjection);
  const palmDepth = Math.max(...palmPoints.map((p) => p.x)) - Math.min(...palmPoints.map((p) => p.x));
  const pelvisWidth = width(.97);
  const waistWidth = width(1.105);
  const chestWidth = width(1.345);
  const footLength = Math.max(...footPoints.map((p) => p.x)) - Math.min(...footPoints.map((p) => p.x));
  const forefoot = footPoints.filter((p) => p.x > .07 * scale && p.y < .08 * scale);
  const forefootWidth = Math.max(...forefoot.map((p) => p.z)) - Math.min(...forefoot.map((p) => p.z));
  const medialArchHeight = cast(designPoint(.035, -.1, .088), new Vector3(0, 1, 0)).y;
  const torsoLength = asset.joints.Shoulder_R.position.y - asset.joints.Hip_R.position.y;
  const legLength = asset.joints.Hip_R.position.y - bounds.min.y;
  return {
    height, headHeight, headWidth, shoulderWidth, chestWidth, waistWidth, pelvisWidth,
    torsoLength, legLength, upperArmLength, forearmLength, handLength, palmWidth, palmDepth,
    upperArmDepth: depth(1.285, .332), forearmDepth: depth(1.105, .435),
    thighDepth: depth(.76, .113), calfDepth: depth(.435, .118), ankleDepth: depth(.14, .12),
    footLength, forefootWidth, medialArchHeight,
    ratios: {
      headsTall: height / headHeight, shouldersPerHeadWidth: shoulderWidth / headWidth,
      shouldersToPelvis: shoulderWidth / pelvisWidth, chestToWaist: chestWidth / waistWidth,
      shoulderToWristPerHeight: (upperArmLength + forearmLength) / height,
      torsoToLeg: torsoLength / legLength, handPerHeight: handLength / height, footPerHeight: footLength / height,
    },
  };
}
