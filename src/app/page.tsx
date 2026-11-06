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

function SectionTitle({ number, children }: { number: string; children: React.ReactNode }) {
  return (
    <div className={styles.sectionTitle}>
      <span className={styles.sectionNumber}>{number}</span>
      <h2>{children}</h2>
    </div>
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
          <span>Untitled character</span>
          <span className={styles.unsavedDot} aria-label="Cambios sin guardar" />
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
              <strong>Prototype setup</strong>
              <small>Stage 01 <span>·</span> Workspace</small>
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
            <div className={styles.phasePill}><span>01</span> BLOCKOUT <b>·</b> NOT STARTED</div>
          </div>

          <div className={styles.studioGrid}>
            <section className={styles.viewportCard} aria-label="Vista previa 3D">
              <div className={styles.viewportTopline}>
                <div className={styles.viewportLabel}><span className={styles.liveDot} /> SCENE VIEWPORT <span className={styles.divider}>/</span> <span className={styles.muted}>TEST GEOMETRY</span></div>
                <div className={styles.viewBadges}><span>ORTHOGRAPHIC</span><span>PROFILE · +Z</span></div>
              </div>

              <StudioClient />
            </section>

            <aside className={styles.inspector} aria-label="Panel de configuración">
              <div className={styles.inspectorHeader}>
                <div><span className={styles.eyebrow}>INSPECTOR</span><h2>Character setup</h2></div>
                <button className={styles.moreButton} aria-label="Más opciones" disabled>···</button>
              </div>

              <section className={styles.inspectorSection}>
                <SectionTitle number="01">PROPORTIONS</SectionTitle>
                <div className={styles.settingRow}><span>Character height</span><span className={styles.value}>1.8 <small>m</small></span></div>
                <div className={styles.rangeTrack}><span style={{ width: "58%" }} /></div>
                <div className={styles.rangeScale}><span>1.2 m</span><span>2.4 m</span></div>
                <div className={`${styles.settingRow} ${styles.settingRowSecond}`}><span>Body preset</span><button className={styles.selectMock} disabled>Humanoid <span>⌄</span></button></div>
              </section>

              <section className={styles.inspectorSection}>
                <SectionTitle number="02">EQUIPMENT</SectionTitle>
                <div className={styles.equipmentCard}>
                  <div className={styles.equipmentGlyph}>＋</div>
                  <div><strong>Primary weapon</strong><small>No weapon assigned</small></div>
                  <span className={styles.comingTag}>SOON</span>
                </div>
              </section>

              <section className={`${styles.inspectorSection} ${styles.animationSection}`}>
                <SectionTitle number="03">ANIMATIONS</SectionTitle>
                <div className={styles.animationItem}>
                  <span className={styles.playGlyph}>▶</span>
                  <div><strong>Idle</strong><small>Looping stance</small></div>
                  <span className={styles.pending}>PENDING</span>
                </div>
                <div className={styles.animationItem}>
                  <span className={styles.playGlyph}>▶</span>
                  <div><strong>Hammer heavy attack</strong><small>Impact sequence</small></div>
                  <span className={styles.pending}>PENDING</span>
                </div>
                <button className={styles.addAnimation} disabled><span>＋</span> Add animation <small>NOT AVAILABLE</small></button>
              </section>

              <div className={styles.inspectorNote}><span>i</span><p>Character controls unlock as the procedural model is built.</p></div>
            </aside>
          </div>

          <footer className={styles.bottomBar}>
            <div className={styles.bottomStatus}><span className={styles.statusSquare} /> <span>SCENE</span><b>TEST GEOMETRY</b><i /> <span>UNITS</span><b>METERS</b></div>
            <div className={styles.bottomActions}>
              <button className={styles.secondaryAction} disabled><span>⌑</span> Show rig</button>
              <button className={styles.secondaryAction} disabled><span>↗</span> Export GLB <small>LOCKED</small></button>
              <button className={styles.primaryAction} disabled>Build character <span>↗</span></button>
            </div>
          </footer>
        </section>
      </div>
    </main>
  );
}
