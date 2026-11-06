'use client';

import styles from '@/app/page.module.css';

export function AnatomyInspector({ height, showRig, wireframe, onHeightChange, onShowRigChange, onWireframeChange }: {
  height: number; showRig: boolean; wireframe: boolean;
  onHeightChange: (value: number) => void; onShowRigChange: (value: boolean) => void;
  onWireframeChange: (value: boolean) => void;
}) {
  return <aside className={styles.inspector} aria-label="Inspección anatómica V3">
    <div className={styles.inspectorHeader}>
      <h2>Anatomía V3.2</h2><span className={styles.comingTag}>A-POSE</span>
    </div>
    <section className={styles.inspectorSection}>
      <h2 className={styles.controlHeading}>SUPERFICIE CONTINUA</h2>
      <p className={styles.anatomyText}>Cabeza, torso, brazos, manos, pelvis, piernas y pies unidos en una sola malla. A-pose simétrica, sin ropa ni accesorios.</p>
      <dl className={styles.anatomyFacts}>
        <div><dt>Construcción</dt><dd>Malla de control anatómica</dd></div>
        <div><dt>Suavizado</dt><dd>Catmull–Clark · 2 pasos</dd></div>
        <div><dt>Forma</dt><dd>Desplazamientos por región</dd></div>
        <div><dt>Orientación</dt><dd>+X · metros</dd></div>
      </dl>
    </section>
    <section className={styles.inspectorSection}>
      <h2 className={styles.controlHeading}>REFERENCIA DE ESCALA</h2>
      <label className={styles.settingRow} htmlFor="character-height"><span>Altura corporal prevista</span><output className={styles.value}>{height.toFixed(2)} m</output></label>
      <input id="character-height" className={styles.slider} type="range" min={1.2} max={2.4} step={.05}
        value={height} onChange={(event) => onHeightChange(Number(event.target.value))} />
      <p className={styles.anatomyText}>Altura de la planta de los pies a la coronilla. El cuerpo se apoya en Y = 0; las miniaturas usan la altura corporal completa.</p>
    </section>
    <section className={styles.inspectorSection}>
      <h2 className={styles.controlHeading}>COMPROBAR LA FORMA</h2>
      <label className={styles.checkRow}><input type="checkbox" checked={wireframe}
        onChange={(event) => onWireframeChange(event.target.checked)} />Ver triangulación</label>
      <label className={styles.checkRow}><input type="checkbox" checked={showRig}
        onChange={(event) => onShowRigChange(event.target.checked)} />Mostrar referencias anatómicas</label>
      <p className={styles.anatomyText}>16 referencias de articulación y bucles de geometría en hombros, codos, muñecas, caderas, rodillas y tobillos. La superficie todavía no está vinculada a un rig.</p>
    </section>
    <section className={styles.inspectorSection}>
      <h2 className={styles.controlHeading}>LECTURA DE REFERENCIAS</h2>
      <p className={styles.anatomyText}>Hombros amplios, cintura contenida y cabeza estilizada. Revisa el perfil de pecho y mandíbula, y la continuidad de clavículas y espalda al orbitar.</p>
      <p className={styles.anatomyText}>Las manos tienen dedos agrupados y pulgar conectado. Skinning y animaciones quedan pendientes; esta pose es estática.</p>
    </section>
  </aside>;
}
