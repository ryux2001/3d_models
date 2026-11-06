'use client';

import { useEffect, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Grid, OrbitControls } from '@react-three/drei';
import { AxesHelper, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial, SphereGeometry } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { createCharacter, heightScale } from '@/lib/characters/hammer-warrior';
import { applyInspectionPose, type InspectionPose } from '@/lib/characters/hammer-warrior/inspectionPoses';
import { createAnatomy, VISIBLE_ANCHORS } from '@/lib/characters/anatomy-v3';
import { PixelCapture, type PreviewCanvases } from './PixelPreview';
import { JOINT_NAMES, type CharacterAsset, type JointPose } from '@/lib/characters/types';
import { disposeObject } from '@/lib/characters/shared/dispose';
import styles from '@/app/page.module.css';

export type CameraRequest = { view: 'profile' | 'front' | 'quarter' | 'back' | 'orbit'; revision: number };

type ViewportProps = {
  cameraRequest: CameraRequest;
  height: number;
  pose: JointPose;
  showRig: boolean;
  inspectionPose: InspectionPose;
  previewCanvases: PreviewCanvases;
  silhouette: boolean;
  version: 'v2' | 'v3';
  anatomyFocus: boolean;
  wireframe: boolean;
  onOrbitStart: () => void;
};

function CameraPreset({ request, height, anatomyFocus }: { request: CameraRequest; height: number; anatomyFocus: boolean }) {
  const { camera, controls, size } = useThree();
  useEffect(() => {
    const orbit = controls as OrbitControlsImpl | null;
    const target = [(anatomyFocus ? 0 : 0.06) * height / 1.8, height * (anatomyFocus ? .725 : .55), 0] as const;
    // reset() also clears pending damping left over from a drag.
    orbit?.reset();
    if (request.view === 'profile') camera.position.set(target[0], target[1], 8);
    else if (request.view === 'front') camera.position.set(8, target[1], 0);
    else if (request.view === 'back') camera.position.set(-8, target[1], 0);
    else if (request.view === 'quarter') camera.position.set(6, target[1] + 0.5, 6);
    else camera.position.set(4.5, 3, 6);
    // Three.js cameras are mutable scene objects; update them only in effects.
    // eslint-disable-next-line react-hooks/immutability
    camera.zoom = Math.min(size.width / (height * (anatomyFocus ? .78 : 1.05)), size.height / (height * (anatomyFocus ? .74 : 1.3)));
    camera.lookAt(...target);
    camera.updateProjectionMatrix();
    orbit?.target.set(...target);
    orbit?.update();
  }, [camera, controls, request, size.width, size.height, height, anatomyFocus]);
  return null;
}

function CharacterModel({ height, pose, showRig, inspectionPose, previewCanvases, silhouette, version, anatomyFocus, wireframe }: Omit<ViewportProps, 'cameraRequest' | 'onOrbitStart'>) {
  // Only an empty host is allocated during render. Geometry is owned by the effect,
  // so Strict Mode setup → cleanup → setup never reuses disposed resources.
  const [host] = useState(() => new Group());
  const assetRef = useRef<CharacterAsset | null>(null);
  const debugRef = useRef<Group | null>(null);

  useEffect(() => {
    const asset = version === 'v3' ? createAnatomy() : createCharacter();
    const debug = new Group();
    debug.name = 'ViewportJointDebug';
    const geometry = new SphereGeometry(0.018, 8, 6);
    const material = new MeshBasicMaterial({ color: '#ffce64', depthTest: false });
    for (const name of version === 'v3' ? VISIBLE_ANCHORS : JOINT_NAMES) {
      const marker = new Group();
      marker.name = name;
      const dot = new Mesh(geometry, material);
      dot.renderOrder = 10;
      const axes = new AxesHelper(0.1);
      const axesMaterials = Array.isArray(axes.material) ? axes.material : [axes.material];
      axesMaterials.forEach((entry) => { entry.depthTest = false; });
      axes.renderOrder = 10;
      marker.add(dot, axes);
      debug.add(marker);
    }
    // Siblings, not children: debug aids never belong to the exportable root.
    host.add(asset.root, debug);
    assetRef.current = asset;
    debugRef.current = debug;
    return () => {
      assetRef.current = null;
      debugRef.current = null;
      asset.dispose();
      debug.removeFromParent();
      disposeObject(debug);
    };
  }, [host, version]);

  useEffect(() => {
    const asset = assetRef.current;
    const debug = debugRef.current;
    if (!asset || !debug) return;
    asset.root.scale.setScalar(heightScale(height));
    if (version === 'v2') applyInspectionPose(asset, inspectionPose, pose);
    else asset.resetPose();
    asset.root.traverse((node) => {
      if (node instanceof Mesh && node.material instanceof MeshStandardMaterial) node.material.wireframe = wireframe;
    });
    asset.root.updateMatrixWorld(true);
    debug.visible = showRig;
    for (const name of version === 'v3' ? VISIBLE_ANCHORS : JOINT_NAMES) {
      const marker = debug.getObjectByName(name)!;
      asset.joints[name].getWorldPosition(marker.position);
      asset.joints[name].getWorldQuaternion(marker.quaternion);
    }
  }, [height, pose, showRig, inspectionPose, version, wireframe]);

  return <><primitive object={host} dispose={null} />
    <PixelCapture assetRef={assetRef} canvases={previewCanvases} height={height}
      silhouette={silhouette} anatomyFocus={anatomyFocus} revision={`${version}:${wireframe}:${inspectionPose}:${JSON.stringify(pose)}`} /></>;
}

export function CharacterViewport({ cameraRequest, onOrbitStart, ...modelProps }: ViewportProps) {
  return (
    <div className={styles.canvasContainer}>
      <Canvas orthographic dpr={[1, 1.5]}
        camera={{ position: [0.2, 1.18, 8], zoom: 140, near: 0.1, far: 100 }}
        gl={{ antialias: true, alpha: false }}>
        <color attach="background" args={['#0b121c']} />
        <ambientLight intensity={modelProps.version === 'v3' ? .9 : 1.25} />
        <directionalLight position={[3, 6, 5]} intensity={modelProps.version === 'v3' ? 1.65 : 2.2}
          color={modelProps.version === 'v3' ? '#ffffff' : '#e0f0ff'} />
        <directionalLight position={[-4, 2, -4]} intensity={modelProps.version === 'v3' ? 1.35 : .8}
          color={modelProps.version === 'v3' ? '#ffffff' : '#4d9bd3'} />
        <CharacterModel key={modelProps.version} {...modelProps} />
        <Grid position={[0, -0.005, 0]} args={[12, 12]} cellSize={0.25}
          cellThickness={0.5} cellColor="#273e55" sectionSize={1}
          sectionThickness={0.8} sectionColor="#355979" fadeDistance={12}
          fadeStrength={1.5} infiniteGrid />
        <OrbitControls makeDefault target={[0.2, 1.18, 0]} enableDamping
          dampingFactor={0.08} enablePan={false} minZoom={35} maxZoom={400}
          onStart={onOrbitStart} />
        <CameraPreset request={cameraRequest} height={modelProps.height} anatomyFocus={modelProps.anatomyFocus} />
      </Canvas>
    </div>
  );
}
