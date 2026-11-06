import styles from "./page.module.css";
import { StudioClient } from "@/components/studio/StudioClient";

function Mark() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={styles.mark}>
      <path d="m16 3 12 7v12l-12 7-12-7V10l12-7Z" />
      <path d="m4.5 10 11.5 7 11.5-7M16 17v12M10 6.5l12 7" />
    </svg>
  );
}

export default function Home() {
  return (
    <main className={styles.workspace}>
      <header className={styles.topbar}>
        <a className={styles.brand} href="#inicio" aria-label="Procedural Character Studio">
          <Mark />
          <span className={styles.brandText}>
            <strong>FORM<span>/</span>FORGE</strong>
            <small>PROCEDURAL CHARACTER STUDIO</small>
          </span>
        </a>

        <div className={styles.projectName}>
          <span className={styles.breadcrumb}>WORKSPACE</span>
          <span className={styles.breadcrumbSlash}>/</span>
          <span>Hammer warrior</span>
          <span className={styles.unsavedDot} aria-label="Sesión temporal sin persistencia" />
        </div>

        <div className={styles.topbarActions}>
          <span className={styles.localBadge}><span /> LOCAL DRAFT</span>
          <button className={styles.saveButton} disabled>Save project <kbd>⌘ S</kbd></button>
          <button className={styles.avatar} aria-label="Perfil" disabled>R</button>
        </div>
      </header>

      <div className={styles.bodyLayout}>
        <aside className={styles.leftRail}>
          <div className={styles.railGroup}>
            <span className={styles.railLabel}>STUDIO</span>
            <div className={`${styles.railItem} ${styles.railItemActive}`}>
              <span className={styles.railIcon}>◈</span><span>Character lab</span>
              <i />
            </div>
            <div className={styles.railItem} aria-disabled="true">
              <span className={styles.railIcon}>▤</span><span>Asset library</span>
              <span className={styles.soon}>SOON</span>
            </div>
          </div>

          <div className={styles.railBottom}>
            <div className={styles.pipelineCard}>
              <span className={styles.pipelineEyebrow}>PIPELINE STATUS</span>
              <div className={styles.pipelineTrack}><span /></div>
               <strong>Full-body anatomy</strong>
               <small>V3.2 <span>·</span> A-pose review</small>
            </div>
            <div className={styles.railFooter}><span className={styles.onlineDot} /> ALL SYSTEMS LOCAL</div>
          </div>
        </aside>

        <section className={styles.mainArea} aria-labelledby="page-title">
          <div className={styles.pageHeading}>
            <div>
              <div className={styles.eyebrow}><span /> CHARACTER WORKBENCH</div>
              <h1 id="page-title">Build your <em>character.</em></h1>
              <p>Shape a 3D character, prepare its motion, and take it into pixel art.</p>
            </div>
             <div className={styles.phasePill}><span>V3.2</span> FULL BODY <b>·</b> REVIEW</div>
          </div>

          <StudioClient />
        </section>
      </div>
    </main>
  );
}
