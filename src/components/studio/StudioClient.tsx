'use client';

import dynamic from 'next/dynamic';
import { useCallback, useState } from 'react';
import { DEFAULT_HEIGHT } from '@/lib/characters/hammer-warrior/proportions';
import type { JointName, JointPose } from '@/lib/characters/types';
import type { CameraRequest } from './CharacterViewport';
import { CharacterControls } from './CharacterControls';
import styles from '@/app/page.module.css';

const CharacterViewport = dynamic(
  () => import('./CharacterViewport').then((module) => module.CharacterViewport),
  { ssr: false, loading: () => <div className={styles.canvasLoading}>INITIALIZING WEBGL VIEWPORT…</div> },
);

export function StudioClient() {
  const [cameraRequest, setCameraRequest] = useState<CameraRequest>({ view: 'profile', revision: 0 });
  const [activeView, setActiveView] = useState<CameraRequest['view'] | null>('profile');
  const [height, setHeight] = useState(DEFAULT_HEIGHT);
  const [showRig, setShowRig] = useState(false);
  const [selectedJoint, setSelectedJoint] = useState<JointName>('Elbow_R');
  const [pose, setPose] = useState<JointPose>({});
  const onOrbitStart = useCallback(() => setActiveView(null), []);

  function requestView(view: CameraRequest['view']) {
    setActiveView(view);
    setCameraRequest((previous) => ({ view, revision: previous.revision + 1 }));
  }

  function resetCharacter() {
    setHeight(DEFAULT_HEIGHT);
    setPose({});
    requestView('profile');
  }

  return (
    <>
      <div className={styles.studioGrid}>
        <section className={styles.viewportCard} aria-label="Vista previa 3D">
          <div className={styles.viewportTopline}>
            <div className={styles.viewportLabel}><span className={styles.liveDot} /> SCENE VIEWPORT <span className={styles.divider}>/</span> <span className={styles.muted}>HAMMER WARRIOR</span></div>
            <div className={styles.viewBadges}><span>ORTHOGRAPHIC</span><span>{activeView === 'profile' ? 'PROFILE · +Z' : 'ORBIT'}</span></div>
          </div>
          <div className={styles.viewportStage}>
            <CharacterViewport cameraRequest={cameraRequest} height={height} pose={pose}
              showRig={showRig} onOrbitStart={onOrbitStart} />
            <div className={styles.axisLegend}><span>+X</span> FACING <i /> <span>+Y</span> UP</div>
            <div className={styles.viewportCorner}>01 <span>/</span> 01</div>
          </div>
          <div className={styles.viewportToolbar}>
            <div className={styles.toolbarGroup}>
              {(['profile', 'orbit'] as const).map((view) => (
                <button key={view} className={`${styles.toolButton} ${activeView === view ? styles.toolSelected : ''}`}
                  onClick={() => requestView(view)} aria-pressed={activeView === view}>
                  {view === 'profile' ? '◉ Profile' : '◌ Orbit'}
                </button>
              ))}
            </div>
            <span className={styles.toolbarHint}>DRAG TO ORBIT · SCROLL TO ZOOM</span>
          </div>
        </section>
        <CharacterControls height={height} showRig={showRig} selectedJoint={selectedJoint} pose={pose}
          onHeightChange={setHeight} onShowRigChange={setShowRig} onJointChange={setSelectedJoint}
          onAngleChange={(angle) => setPose((previous) => ({ ...previous, [selectedJoint]: angle }))}
          onResetPose={() => setPose({})} />
      </div>
      <footer className={styles.bottomBar}>
        <div className={styles.bottomStatus}><span className={styles.statusSquare} /> <span>SCENE</span><b>RIGID CHARACTER</b><i /><span>UNITS</span><b>METERS</b></div>
        <div className={styles.bottomActions}>
          <button className={styles.secondaryAction} onClick={() => setShowRig((value) => !value)} aria-pressed={showRig}>⌑ {showRig ? 'Hide rig' : 'Show rig'}</button>
          <button className={styles.secondaryAction} disabled title="Disponible en la fase D">↗ Export GLB <small>PHASE D</small></button>
          <button className={styles.primaryAction} onClick={resetCharacter}>Reset character</button>
        </div>
      </footer>
    </>
  );
}
