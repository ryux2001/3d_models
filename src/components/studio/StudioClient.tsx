'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import styles from '@/app/page.module.css';

type CameraView = 'profile' | 'orbit';

const CharacterViewport = dynamic(
  () => import('./CharacterViewport').then((module) => module.CharacterViewport),
  {
    ssr: false,
    loading: () => <div className={styles.canvasLoading}>INITIALIZING WEBGL VIEWPORT…</div>,
  },
);

export function StudioClient() {
  const [view, setView] = useState<CameraView>('profile');

  return (
    <>
      <div className={styles.viewportStage}>
        <div className={styles.stageGlow} />
        <div className={styles.stageGrid} />
        <CharacterViewport view={view} />
        <div className={styles.axisLegend}><span>X</span> WORLD AXIS <i /> <span>Y</span></div>
        <div className={styles.viewportCorner}>01 <span>/</span> 01</div>
      </div>

      <div className={styles.viewportToolbar}>
        <div className={styles.toolbarGroup}>
          <button
            className={`${styles.toolButton} ${view === 'profile' ? styles.toolSelected : ''}`}
            onClick={() => setView('profile')}
            aria-pressed={view === 'profile'}
          >
            <span>◉</span> Profile
          </button>
          <button
            className={`${styles.toolButton} ${view === 'orbit' ? styles.toolSelected : ''}`}
            onClick={() => setView('orbit')}
            aria-pressed={view === 'orbit'}
          >
            <span>◌</span> Orbit
          </button>
        </div>
        <span className={styles.toolbarHint}>DRAG TO ORBIT <b>·</b> SCROLL TO ZOOM</span>
        <button className={styles.iconButton} aria-label="Expandir visor" disabled>⤢</button>
      </div>
    </>
  );
}
