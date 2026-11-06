'use client';

import { useEffect, useRef, type RefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Color, Matrix4, MeshBasicMaterial, OrthographicCamera, SRGBColorSpace, Vector3, WebGLRenderTarget } from 'three';
import type { CharacterAsset } from '@/lib/characters/types';
import styles from '@/app/page.module.css';

export type PreviewCanvases = RefObject<(HTMLCanvasElement | null)[]>;
const PIXEL_SIZES = [64, 96] as const;

export function PixelPreviewPanel({ canvases, silhouette, onSilhouetteChange, anatomyFocus = false }: {
  canvases: PreviewCanvases; silhouette: boolean; onSilhouetteChange: (value: boolean) => void; anatomyFocus?: boolean;
}) {
  return <section className={styles.pixelPanel} aria-labelledby="pixel-heading">
    <div className={styles.pixelHeader}>
      <h2 id="pixel-heading">Prueba de lectura pixel art</h2>
      <label className={styles.checkRow}><input type="checkbox" checked={silhouette}
        onChange={(event) => onSilhouetteChange(event.target.checked)} />Silueta</label>
    </div>
    <p className={styles.controlHelp}>{anatomyFocus ? '64 / 96 px por altura anatómica de referencia (60 % del cuerpo)' : '64 / 96 px por altura corporal completa'} · ampliación ×2 sin suavizado · misma orientación que el visor.</p>
    <div className={styles.pixelSamples}>
      {PIXEL_SIZES.map((pixels, index) => <figure key={pixels}>
        <canvas ref={(node) => { canvases.current[index] = node; }}
          width={Math.ceil(pixels * 1.7)} height={Math.ceil(pixels * 1.7)}
          aria-label={`Previsualización aproximada de personaje a ${pixels} píxeles`} />
        <figcaption>{pixels} px <span>· ×2</span></figcaption>
      </figure>)}
    </div>
    <p className={styles.controlHelp}>Escala corporal fija; agacharse reduce la altura visible. Sin paleta limitada ni procesado de PixelOver.</p>
  </section>;
}

/** Reuses R3F's renderer. No extra WebGL context or character reconstruction. */
export function PixelCapture({ assetRef, canvases, height, silhouette, revision, anatomyFocus = false }: {
  assetRef: RefObject<CharacterAsset | null>; canvases: PreviewCanvases;
  height: number; silhouette: boolean; revision: string;
  anatomyFocus?: boolean;
}) {
  const { gl, scene, camera } = useThree();
  const resources = useRef<{
    targets: WebGLRenderTarget[]; camera: OrthographicCamera; material: MeshBasicMaterial;
    lastCamera: Matrix4; direction: Vector3; dirty: boolean;
  } | null>(null);
  useEffect(() => {
    const targets = PIXEL_SIZES.map((pixels) => {
      const size = Math.ceil(pixels * 1.7);
      const target = new WebGLRenderTarget(size, size, { depthBuffer: true });
      target.texture.colorSpace = SRGBColorSpace;
      return target;
    });
    const state = {
      targets, camera: new OrthographicCamera(-1, 1, 1, -1, 0.1, 100),
      material: new MeshBasicMaterial({ color: '#e8eef7' }),
      lastCamera: new Matrix4(), direction: new Vector3(), dirty: true,
    };
    state.camera.layers.set(1);
    resources.current = state;
    return () => {
      resources.current = null;
      targets.forEach((target) => target.dispose());
      state.material.dispose();
    };
  }, []);
  useEffect(() => { if (resources.current) resources.current.dirty = true; }, [height, silhouette, revision, anatomyFocus]);
  useFrame(() => {
    const state = resources.current;
    const asset = assetRef.current;
    if (!state || !asset) return;
    camera.updateMatrixWorld();
    if (!state.dirty && state.lastCamera.equals(camera.matrixWorld)) return;
    state.lastCamera.copy(camera.matrixWorld);
    state.dirty = false;
    // Layer 1 excludes the grid and joint helpers.
    asset.root.traverse((node) => node.layers.enable(1));
    scene.traverse((node) => { if ('isLight' in node) node.layers.enable(1); });
    const previewCamera = state.camera;
    camera.getWorldDirection(state.direction);
    const center = new Vector3((anatomyFocus ? 0 : 0.06) * height / 1.8, height * (anatomyFocus ? .725 : .5), 0);
    previewCamera.position.copy(center).addScaledVector(state.direction, -8);
    previewCamera.up.copy(camera.up);
    previewCamera.lookAt(center);
    const oldTarget = gl.getRenderTarget();
    const oldBackground = scene.background;
    const oldOverride = scene.overrideMaterial;
    const oldAutoClear = gl.autoClear;
    try {
      scene.background = new Color('#15202e');
      scene.overrideMaterial = silhouette ? state.material : null;
      gl.autoClear = true;
      for (let index = 0; index < state.targets.length; index++) {
        const target = state.targets[index];
        const half = target.height / (PIXEL_SIZES[index] / (height * (anatomyFocus ? .6 : 1))) / 2;
        previewCamera.left = -half; previewCamera.right = half;
        previewCamera.top = half; previewCamera.bottom = -half;
        previewCamera.updateProjectionMatrix();
        gl.setRenderTarget(target);
        gl.render(scene, previewCamera);
        const buffer = new Uint8Array(target.width * target.height * 4);
        gl.readRenderTargetPixels(target, 0, 0, target.width, target.height, buffer);
        const context = canvases.current[index]?.getContext('2d');
        if (!context) continue;
        const image = context.createImageData(target.width, target.height);
        const stride = target.width * 4;
        for (let row = 0; row < target.height; row++) {
          image.data.set(buffer.subarray(row * stride, (row + 1) * stride), (target.height - row - 1) * stride);
        }
        context.putImageData(image, 0, 0);
      }
    } finally {
      scene.background = oldBackground;
      scene.overrideMaterial = oldOverride;
      gl.autoClear = oldAutoClear;
      gl.setRenderTarget(oldTarget);
    }
  });
  return null;
}
