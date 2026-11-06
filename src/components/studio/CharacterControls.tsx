'use client';

import { HEIGHT_RANGE } from '@/lib/characters/hammer-warrior/proportions';
import { JOINT_NAMES, type JointName, type JointPose } from '@/lib/characters/types';
import styles from '@/app/page.module.css';
import { INSPECTION_POSES, type InspectionPose } from '@/lib/characters/hammer-warrior/inspectionPoses';

type Props = {
  height: number;
  showRig: boolean;
  selectedJoint: JointName;
  pose: JointPose;
  onHeightChange: (height: number) => void;
  onShowRigChange: (show: boolean) => void;
  onJointChange: (joint: JointName) => void;
  onAngleChange: (angle: number) => void;
  onResetPose: () => void;
  inspectionPose: InspectionPose;
  onInspectionPoseChange: (pose: InspectionPose) => void;
};

export function CharacterControls(props: Props) {
  const angle = props.pose[props.selectedJoint] ?? 0;
  return (
    <aside className={styles.inspector} aria-label="Configuración del personaje">
      <div className={styles.inspectorHeader}>
        <div><span className={styles.eyebrow}>INSPECTOR</span><h2>Hammer warrior</h2></div>
        <span className={styles.comingTag}>RIGID RIG</span>
      </div>
      <section className={styles.inspectorSection}>
        <h2 className={styles.controlHeading}>POSES DE INSPECCIÓN</h2>
        <div className={styles.poseButtons}>
          {INSPECTION_POSES.map((preset) => <button key={preset.id} aria-pressed={props.inspectionPose === preset.id}
            className={`${styles.toolButton} ${props.inspectionPose === preset.id ? styles.toolSelected : ''}`}
            onClick={() => props.onInspectionPoseChange(preset.id)}>{preset.label}</button>)}
        </div>
        <p className={styles.controlHelp}>Poses estáticas. Los ajustes Local Z se suman a la pose seleccionada.</p>
      </section>
      <section className={styles.inspectorSection}>
        <h2 className={styles.controlHeading}>01 · PROPORTIONS</h2>
        <label className={styles.settingRow} htmlFor="character-height">
          <span>Character height</span><output className={styles.value}>{props.height.toFixed(2)} m</output>
        </label>
        <input id="character-height" className={styles.slider} type="range" {...HEIGHT_RANGE}
          value={props.height} onChange={(event) => props.onHeightChange(Number(event.target.value))} />
        <div className={styles.rangeScale}><span>1.2 m</span><span>2.4 m</span></div>
        <p className={styles.controlHelp}>Uniform scale · feet origin at Y = 0 in the rest pose.</p>
      </section>
      <section className={styles.inspectorSection}>
        <h2 className={styles.controlHeading}>02 · EQUIPMENT</h2>
        <div className={styles.equipmentCard}>
          <div className={styles.equipmentGlyph}>⚒</div>
          <div><strong>Heavy hammer</strong><small>Attached to Hand_R / WeaponGrip</small></div>
        </div>
      </section>
      <section className={styles.inspectorSection}>
        <h2 className={styles.controlHeading}>03 · JOINT DEBUG</h2>
        <label className={styles.checkRow}>
          <input type="checkbox" checked={props.showRig}
            onChange={(event) => props.onShowRigChange(event.target.checked)} />
          Show joint positions & axes
        </label>
        <label className={styles.controlLabel} htmlFor="joint-select">Joint</label>
        <select id="joint-select" className={styles.jointSelect} value={props.selectedJoint}
          onChange={(event) => props.onJointChange(event.target.value as JointName)}>
          {JOINT_NAMES.map((name) => <option key={name} value={name}>{name}</option>)}
        </select>
        <label className={styles.settingRow} htmlFor="joint-angle">
          <span>Local Z offset</span><output className={styles.value}>{angle}°</output>
        </label>
        <input id="joint-angle" className={styles.slider} type="range" min={-120} max={120} step={1}
          value={angle} onChange={(event) => props.onAngleChange(Number(event.target.value))} />
        <button className={styles.resetButton} onClick={props.onResetPose}>Reset all joints</button>
        <p className={styles.controlHelp}>Restaura la pose seleccionada sin ajustes manuales.</p>
        <p className={styles.controlHelp}>Manual pivot test, not an animation. Extreme angles can intersect meshes or move feet off the ground.</p>
      </section>
      <section className={`${styles.inspectorSection} ${styles.animationSection}`}>
        <h2 className={styles.controlHeading}>04 · ANIMATIONS</h2>
        {['Idle', 'HammerHeavyAttack'].map((name) => (
          <div className={styles.animationItem} key={name}>
            <span className={styles.playGlyph}>▶</span>
            <div><strong>{name}</strong><small>Not implemented</small></div>
            <span className={styles.pending}>PHASE C</span>
          </div>
        ))}
      </section>
      <div className={styles.inspectorNote}><span>i</span><p>Rigid articulated pieces, not a skinned skeleton. Validate anatomy before adding clips.</p></div>
    </aside>
  );
}
