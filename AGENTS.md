# AGENTS.md — Procedural Character Studio

## Objetivo

Construir un laboratorio web de portfolio para validar un pipeline de **personajes 3D procedurales → animación → GLB → PixelOver → sprites pixel art → Godot**. El producto inicial es un prototipo técnico, no el videojuego, ni un servicio público con usuarios.

## Stack obligatorio

- **Next.js App Router + TypeScript + React + Tailwind CSS**.
- **Three.js** como núcleo del personaje: geometría, jerarquías, pivotes, materiales, clips y archivos GLB.
- **React Three Fiber** para visualizar la escena Three.js dentro de `<Canvas>`.
- **@react-three/drei** solo para helpers útiles de cámara/depuración.
- No introducir Vite, JavaScript vanilla como aplicación independiente, Express, backend, autenticación, base de datos, Python ni nuevas dependencias salvo necesidad justificada.

## Fronteras técnicas

1. `src/app/page.tsx` puede mantenerse como Server Component.
2. Visor, controles y descargas: **Client Components**, con `'use client'`.
3. WebGL y navegador nunca en el ámbito global de módulos que el servidor pueda importar. Si es necesario, `next/dynamic` con `{ ssr: false }` **dentro de un Client Component**.
4. Construir el modelo **fuera de JSX**, en funciones TypeScript puras que devuelvan `THREE.Group`, pivotes y clips reutilizables. Mostrarlo en R3F mediante `<primitive object={...} />`.
5. No reconstruir geometría, clips ni mixers en cada render React. Limpiar recursos/efectos y evitar dobles animaciones.
6. No incluir suelo, grillas, cámara ni gizmos en la escena GLB exportada.

## Prioridades visuales

1. Anatomía humana estilizada y silueta clara desde cámara lateral ortográfica (personaje hacia `+X`, cámara desde `+Z`).
2. Pivotes en articulaciones; nombres estables y únicos de nodos.
3. Martillo unido a mano y animación corporal real: torso, caderas, hombros y recuperación.
4. Verificar legibilidad aproximada a 64 y 96 px de altura.
5. Simplificar polígonos y detalle fino; no sacrificar proporciones ni movimiento.

## Animación y exportación

- Clips `Idle` y `HammerHeavyAttack` como `THREE.AnimationClip` y `KeyframeTrack`, reproducibles con `AnimationMixer`.
- No depender de `useFrame`, `requestAnimationFrame` ni interpolaciones no horneadas para las animaciones que deben quedar dentro del GLB.
- Exportar con `GLTFExporter`, `binary: true`, `trs: true`, y `animations: clips`.
- Validar **reimportando** el archivo con `GLTFLoader` y reproduciendo los clips **del GLB**, no los objetos originales.
- Una jerarquía de `THREE.Group` no es automáticamente `THREE.Bone`/`SkinnedMesh`. No afirmar que PixelOver podrá editarla como un rig de huesos.
- Si se introducen esqueletos reales, revisar clonación y exportación: `root.clone(true)` puede no bastar para skinned meshes.

## Trabajo con Codex

- Implementar una fase cada vez: A visor → B anatomía → C clips → D GLB/reimportación → E PixelOver; F portfolio solo después.
- Usar pnpm y conservar `pnpm-lock.yaml` como archivo de bloqueo. Ejecutar `pnpm exec tsc --noEmit` y `pnpm build` y corregir los errores. Ejecutar `pnpm lint` si existe el script en `package.json`.
- Informar de archivos modificados, pasos para probar y limitaciones reales.
- No afirmar que el resultado visual se ve bien si no se ha inspeccionado.
- Cambios pequeños, commits entre fases, sin introducir sistemas de combate, multijugador ni economía de Godot en esta web.
- Consultar `GUIA_PIPELINE_THREEJS_CODEX_PIXELOVER.md` si el archivo se añade al repositorio como documentación del proyecto.
