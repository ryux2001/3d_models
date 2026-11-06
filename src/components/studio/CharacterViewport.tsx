'use client';

import { useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Edges, Grid, OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import styles from '@/app/page.module.css';

type CameraView = 'profile' | 'orbit';

function CameraPreset({ view }: { view: CameraView }) {
  const { camera, controls } = useThree();

  useEffect(() => {
    const orbitControls = controls as OrbitControlsImpl | null;
    const target = [0, 0.725, 0] as const;

    if (view === 'profile') {
      camera.position.set(0, 0.725, 8);
    } else {
      camera.position.set(5.4, 4.1, 6.6);
    }

    camera.lookAt(...target);
    camera.updateProjectionMatrix();
    orbitControls?.target.set(...target);
    orbitControls?.update();
  }, [camera, controls, view]);

  return null;
}

function TestGeometry() {
  return (
    <mesh position={[0, 0.725, 0]}>
      <boxGeometry args={[1.45, 1.45, 1.45]} />
      <meshStandardMaterial color="#28618c" roughness={0.42} metalness={0.28} />
      <Edges scale={1.006} threshold={15} color="#69bcff" />
    </mesh>
  );
}

export function CharacterViewport({ view }: { view: CameraView }) {
  return (
    <div className={styles.canvasContainer}>
      <Canvas
        orthographic
        dpr={[1, 1.5]}
        camera={{ position: [0, 0.725, 8], zoom: 86, near: 0.1, far: 100 }}
        gl={{ antialias: true, alpha: false }}
      >
        <color attach="background" args={['#0b121c']} />
        <ambientLight intensity={1.25} />
        <directionalLight position={[-3, 6, 5]} intensity={2.2} color="#e0f0ff" />
        <directionalLight position={[4, 2, -4]} intensity={0.8} color="#4d9bd3" />
        <TestGeometry />
        <Grid
          position={[0, 0, 0]}
          args={[12, 12]}
          cellSize={0.5}
          cellThickness={0.5}
          cellColor="#273e55"
          sectionSize={2}
          sectionThickness={0.8}
          sectionColor="#355979"
          fadeDistance={12}
          fadeStrength={1.5}
          infiniteGrid
        />
        <OrbitControls
          makeDefault
          target={[0, 0.725, 0]}
          enableDamping
          dampingFactor={0.08}
          enablePan={false}
          minZoom={45}
          maxZoom={150}
        />
        <CameraPreset view={view} />
      </Canvas>
    </div>
  );
}
