'use client';

import dynamic from 'next/dynamic';
import { useCallback, useRef, useState } from 'react';
import { DEFAULT_HEIGHT } from '@/lib/characters/hammer-warrior/proportions';
import type { JointName, JointPose } from '@/lib/characters/types';
import type { CameraRequest } from './CharacterViewport';
import { CharacterControls } from './CharacterControls';
import { AnatomyInspector } from './AnatomyInspector';
import { PixelPreviewPanel } from './PixelPreview';
import type { InspectionPose } from '@/lib/characters/hammer-warrior/inspectionPoses';
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
  const [inspectionPose, setInspectionPose] = useState<InspectionPose>('rest');
  const [silhouette, setSilhouette] = useState(false);
  const [version, setVersion] = useState<'v2' | 'v3'>('v3');
  const [anatomyFocus, setAnatomyFocus] = useState(false);
  const [wireframe, setWireframe] = useState(false);
  const previewCanvases = useRef<(HTMLCanvasElement | null)[]>([]);
  const onOrbitStart = useCallback(() => setActiveView(null), []);

  function requestView(view: CameraRequest['view']) {
    setActiveView(view);
    setCameraRequest((previous) => ({ view, revision: previous.revision + 1 }));
  }

  function resetCharacter() {
    setHeight(DEFAULT_HEIGHT);
    setPose({});
    setInspectionPose('rest');
    requestView('profile');
  }

  return (
    <>
      <div className={styles.comparisonBar}>
        <div role="group" aria-label="Generador anatómico" className={styles.versionButtons}>
          <button aria-pressed={version === 'v2'} onClick={() => setVersion('v2')}>V2 · Hammer warrior</button>
          <button aria-pressed={version === 'v3'} onClick={() => setVersion('v3')}>V3.2 · Humanoide</button>
        </div>
        <label className={styles.checkRow}><input type="checkbox" checked={anatomyFocus}
          onChange={(event) => setAnatomyFocus(event.target.checked)} />Encuadre de torso y cabeza</label>
        <p className={styles.comparisonNote}>{version === 'v3' ? 'Humanoide completo en A-pose · una superficie continua, sin skinning.' : 'Generador V2 conservado · personaje vestido y articulado.'} El encuadre se comparte para comparar.</p>
      </div>
      <div className={styles.studioGrid}>
        <section className={styles.viewportCard} aria-label="Vista previa 3D">
          <div className={styles.viewportTopline}>
            <div className={styles.viewportLabel}><span className={styles.liveDot} /> SCENE VIEWPORT <span className={styles.divider}>/</span> <span className={styles.muted}>{version === 'v3' ? 'ANATOMY V3.2 · A-POSE' : 'HAMMER WARRIOR V2'}</span></div>
            <div className={styles.viewBadges}><span>ORTHOGRAPHIC</span><span>{activeView === 'profile' ? 'PROFILE · +Z' : activeView === 'front' ? 'FRONT · +X' : activeView === 'quarter' ? 'THREE QUARTERS' : activeView === 'back' ? 'BACK · −X' : 'ORBIT'}</span></div>
          </div>
          <div className={styles.viewportStage}>
            <CharacterViewport cameraRequest={cameraRequest} height={height} pose={pose}
              showRig={showRig} onOrbitStart={onOrbitStart} inspectionPose={inspectionPose}
              previewCanvases={previewCanvases} silhouette={silhouette}
              version={version} anatomyFocus={anatomyFocus} wireframe={version === 'v3' && wireframe} />
            <div className={styles.axisLegend}><span>+X</span> FACING <i /> <span>+Y</span> UP</div>
            <div className={styles.viewportCorner}>01 <span>/</span> 01</div>
          </div>
          <div className={styles.viewportToolbar}>
            <div className={styles.toolbarGroup}>
              {(['profile', 'front', 'quarter', 'back', 'orbit'] as const).map((view) => (
                <button key={view} className={`${styles.toolButton} ${activeView === view ? styles.toolSelected : ''}`}
                  onClick={() => requestView(view)} aria-pressed={activeView === view}>
                  {{ profile: 'Lateral', front: 'Frontal', quarter: 'Tres cuartos', back: 'Espalda', orbit: 'Órbita' }[view]}
                </button>
              ))}
            </div>
            <span className={styles.toolbarHint}>DRAG TO ORBIT · SCROLL TO ZOOM</span>
          </div>
          <PixelPreviewPanel canvases={previewCanvases} silhouette={silhouette} onSilhouetteChange={setSilhouette} anatomyFocus={anatomyFocus} />
        </section>
        {version === 'v3' ? <AnatomyInspector height={height} showRig={showRig} wireframe={wireframe}
          onHeightChange={setHeight} onShowRigChange={setShowRig} onWireframeChange={setWireframe} /> : <CharacterControls height={height} showRig={showRig} selectedJoint={selectedJoint} pose={pose}
          inspectionPose={inspectionPose} onInspectionPoseChange={(preset) => { setInspectionPose(preset); setPose({}); }}
          onHeightChange={setHeight} onShowRigChange={setShowRig} onJointChange={setSelectedJoint}
          onAngleChange={(angle) => setPose((previous) => ({ ...previous, [selectedJoint]: angle }))}
          onResetPose={() => setPose({})} />}
      </div>
      <footer className={styles.bottomBar}>
        <div className={styles.bottomStatus}><span className={styles.statusSquare} /> <span>SCENE</span><b>{version === 'v3' ? 'V3 · ANATOMY STUDY' : 'V2 · RIGID CHARACTER'}</b><i /><span>UNITS</span><b>METERS</b></div>
        <div className={styles.bottomActions}>
          <button className={styles.secondaryAction} onClick={() => setShowRig((value) => !value)} aria-pressed={showRig}>⌑ {showRig ? 'Hide rig' : 'Show rig'}</button>
          <button className={styles.secondaryAction} disabled title="Disponible en la fase D">↗ Export GLB <small>PHASE D</small></button>
          <button className={styles.primaryAction} onClick={resetCharacter}>Reset character</button>
        </div>
      </footer>
    </>
  );
}
