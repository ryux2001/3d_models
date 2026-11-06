import { Group, Mesh, MeshStandardMaterial, Vector3 } from 'three';
import { JOINT_NAMES, type CharacterAsset, type JointName } from '../types';
import { createControlCage } from './controlCage';
import { JOINT_ANCHORS, LANDMARKS, REFERENCE_HEIGHT } from './landmarks';
import { sculptSurface } from './sculptSurface';
import { subdivide, toBufferGeometry } from './subdivision';
import { finishSurfaceV32, refineControlCageV32 } from './refinementV32';

export type AnatomyRevision = '3.1' | '3.2';

export function createAnatomy(height = REFERENCE_HEIGHT, revision: AnatomyRevision = '3.2'): CharacterAsset {
  if (!Number.isFinite(height)) throw new Error('V3 height must be finite.');
  const root = new Group();
  root.name = 'CharacterRoot';
  root.scale.setScalar(Math.min(2.4, Math.max(1.2, height)) / REFERENCE_HEIGHT);
  const baseCage = createControlCage();
  const cage = revision === '3.1' ? baseCage : refineControlCageV32(baseCage);
  const evaluated = sculptSurface(subdivide(subdivide(cage)));
  const surface = revision === '3.1' ? evaluated : finishSurfaceV32(evaluated);
  const geometry = toBufferGeometry(surface);
  const floor = geometry.boundingBox!.min.y;
  const normalizationScale = REFERENCE_HEIGHT / (geometry.boundingBox!.max.y - floor);
  geometry.translate(0, -floor, 0).scale(normalizationScale, normalizationScale, normalizationScale);
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  const material = new MeshStandardMaterial({ color: '#b7a99c', roughness: .86, metalness: 0 });
  const body = new Mesh(geometry, material);
  body.name = 'V3_AnatomySurface';
  root.add(body);
  // Semantic anchors only. The continuous surface is NOT bound to these groups yet.
  const joints = {} as Record<JointName, Group>;
  for (const name of JOINT_NAMES) {
    const node = new Group();
    node.name = name;
    node.position.copy(new Vector3(...JOINT_ANCHORS[name]).sub(new Vector3(0, floor, 0)).multiplyScalar(normalizationScale));
    root.add(node);
    joints[name] = node;
  }
  root.userData = {
    generator: 'anatomy-v3', revision, pose: 'A', fullBody: true, rigged: false, referenceHeight: REFERENCE_HEIGHT,
    normalization: { floor, scale: normalizationScale }, deformationLoops: surface.loops,
    controlVertices: cage.vertices.length, controlFaces: cage.faces.length,
    vertices: surface.vertices.length, triangles: geometry.index!.count / 3,
    regions: ['pelvis', 'abdomen', 'ribcage', 'shoulders', 'trapezius', 'neck', 'head',
      'upperArms', 'forearms', 'hands', 'thumbs', 'thighs', 'calves', 'feet'],
  };
  if (revision === '3.2') {
    root.userData.measurementChinY = refineControlCageV32({
      vertices: [new Vector3(...LANDMARKS.chin)], faces: [],
    }).vertices[0].y;
  }
  let disposed = false;
  return {
    root, joints,
    resetPose() {
      for (const name of JOINT_NAMES) {
        joints[name].position.set(...JOINT_ANCHORS[name]).sub(new Vector3(0, floor, 0)).multiplyScalar(normalizationScale);
        joints[name].quaternion.identity();
      }
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      root.removeFromParent();
      geometry.dispose();
      material.dispose();
    },
  };
}

/** Reproduce the frozen V3.1 result without adding a UI mode. */
export function createAnatomyV31(height = REFERENCE_HEIGHT): CharacterAsset {
  return createAnatomy(height, '3.1');
}
