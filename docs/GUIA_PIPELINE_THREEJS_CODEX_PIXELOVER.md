# Procedural Character Studio — de 3D procedural a pixel art
## Guía práctica: Next.js + TypeScript + React Three Fiber + Three.js + Codex + PixelOver + Godot

**Revisión:** 5 de noviembre de 2026  
**Estado:** laboratorio funcional por construir; no se ha validado todavía el pipeline completo.  
**Objetivo inmediato:** obtener un guerrero 3D estilizado, anatómicamente legible, con articulaciones y un martillo; animarlo, exportarlo en `.glb` con sus clips, importarlo de nuevo para verificarlo y probar su conversión a pixel art en PixelOver.  
**Objetivo futuro (opcional):** convertir el laboratorio en una aplicación web de portfolio con editor, presets y exportaciones.

> **Idea central:** Codex generará y modificará código que construye modelos 3D; Next.js proporciona la aplicación, React Three Fiber integra Three.js con React, y Three.js genera la geometría, las articulaciones, las animaciones y los archivos GLB. **PixelOver se ocupa de evaluar el estilo pixel art**, no de corregir una anatomía o animación defectuosa. No estamos creando todavía un juego ni un generador comercial.

---

## 0. Qué queremos validar

Antes de añadir cuentas, bases de datos o IA dentro de la web, responderemos estas preguntas:

1. ¿Es posible obtener por código un personaje **humanoide estilizado de perfil**, con anatomía aceptable?
2. ¿Sus extremidades giran alrededor de articulaciones correctas, sin deformaciones graves?
3. ¿Puede realizar un `Idle` y un ataque pesado de martillo con anticipación, impacto y recuperación?
4. ¿Se exportan **ambas animaciones dentro de un GLB**, y pueden reproducirse después de cargar ese archivo, sin depender del código original?
5. ¿PixelOver puede importar el GLB y mostrar animaciones y una silueta legible a **64 y 96 píxeles de altura**?

**Éxito de la prueba:** un personaje, dos animaciones, GLB verificable, y evaluación visual en PixelOver.

**Si falla:** no multiplicar personajes ni detalles. Comparar este camino con rigs 3D ya hechos o rigs 2D. Three.js no mejora automáticamente el modelado o la animación frente a Godot o Blender.

---

## 1. Tecnologías y herramientas necesarias

| Herramienta | ¿La tienes? | ¿Necesitas instalarla ahora? | Para qué sirve |
|---|---|---|---|
| Node.js | Sí | Solo comprobar versión | Ejecutar Next.js y herramientas npm |
| npm | Sí | No | Instalar dependencias |
| VS Code | Sí | No | Programar y revisar cambios |
| Codex | Sí | No | Agente que programa el generador |
| **Next.js** | Se creará con npm | **Sí, como proyecto** | Framework web con App Router |
| **TypeScript** | Lo añade la plantilla | **Sí, incluido** | Tipos para jerarquías, clips y exportaciones |
| **React** | Lo añade Next.js | **Sí, incluido** | Componentes y estado de la interfaz |
| **Three.js** | Dependencia npm | **Sí** | Modelos, escenas, animaciones, importación/exportación |
| **React Three Fiber** | Dependencia npm | **Sí** | Renderizar Three.js desde React |
| **Drei** | Dependencia npm | **Sí** | Ayudas para cámara, controles y depuración |
| **@types/three** | Dependencia de desarrollo | **Sí** | Definiciones TypeScript de Three.js |
| Tailwind CSS | Lo añade la plantilla | **Sí, incluido** | Interfaz del editor |
| Git | Recomendable | Solo si no está instalado | Control de versiones |
| PixelOver | Por comprobar | **Demo para la validación** | Importar GLB y explorar el pixelado |
| Godot | Ya utilizado | No para la fase inicial | Recibir sprites cuando se valide el pipeline |
| Blender | Opcional | **No** | Inspeccionar GLB o hacer ajustes futuros |
| Krita y Flux | Opcionales | **No** | Referencias o retoques posteriores |

**No necesitas por ahora:** base de datos, autenticación, Docker, Python, una clave de API de OpenAI, servicios de generación 3D, servidor de renderizado ni Blender.

### Enlaces oficiales

- Next.js: https://nextjs.org/docs/app/getting-started/installation
- React Three Fiber: https://r3f.docs.pmnd.rs/getting-started/installation
- Three.js: https://threejs.org/docs/
- PixelOver: https://pixelover.io/ y https://docs.pixelover.io/
- Node.js: https://nodejs.org/
- Git: https://git-scm.com/downloads

### Versión de Node.js

En VS Code → **Terminal → Nueva terminal**:

```bash
node -v
npm -v
```

Según la documentación oficial consultada, Next.js requiere al menos **Node.js 20.9**. Conviene instalar una versión LTS moderna y compatible; si tu Node es antiguo, actualízalo antes de empezar. No confundas esto con los requisitos de la guía anterior de Vite.

---

## 2. Crear la aplicación Next.js desde cero

### Opción recomendada: asistente interactivo

En la carpeta donde guardes tus proyectos:

```bash
npx create-next-app@latest procedural-character-studio
```

El asistente puede variar según la versión. Si pregunta, elige:

| Pregunta | Respuesta recomendada |
|---|---|
| TypeScript | **Sí** |
| Linter | **ESLint** |
| Tailwind CSS | **Sí** |
| App Router | **Sí** |
| Carpeta `src/` | **Sí** |
| Alias de importaciones | `@/*` (predeterminado) |
| React Compiler u opciones experimentales | Mantener predeterminados estables; no son requisitos |
| AGENTS.md si el asistente lo ofrece | Puedes generarlo y después **fusionarlo** con el adjunto; no conservar instrucciones contradictorias |

Entra al proyecto e instala el soporte 3D:

```bash
cd procedural-character-studio
npm install three @react-three/fiber @react-three/drei
npm install -D @types/three
npm run dev
```

Abre **http://localhost:3000** (o el puerto que indique la terminal).

**Qué instala cada cosa:**

- `create-next-app`: Next.js, React, TypeScript, Tailwind y configuración básica.
- `three`: geometría, materiales, `AnimationClip`, `GLTFExporter`, `GLTFLoader`.
- `@react-three/fiber`: componente `<Canvas>` y enlaces entre React y Three.js.
- `@react-three/drei`: utilidades como `OrbitControls`, `Grid` y helpers.
- `@types/three`: tipos para TypeScript.

No instales `vite` dentro del proyecto Next.js: **Next.js sustituye a Vite** como framework y servidor de desarrollo.

### Comandos habituales

```bash
npm run dev          # Next.js en desarrollo: normalmente localhost:3000
npm run build        # Compilación de producción
npm run start        # Servidor de producción después del build
npx tsc --noEmit     # Comprobar TypeScript sin generar archivos
npm run lint         # Solo si package.json incluye script lint
```

**Nota sobre Next.js reciente:** `next build` y ESLint son comprobaciones separadas. No des por hecho que la compilación ejecuta el linter; revisa los scripts reales de tu `package.json`.

### Abrir en VS Code

```bash
code .
```

Si `code .` no funciona, abre la carpeta desde **Archivo → Abrir carpeta**.

### ¿Ya creaste el prototipo con Vite?

No instales Next.js encima del mismo proyecto sin plan. Crea **una carpeta Next.js nueva**, conserva la anterior como referencia y **migra solo la lógica reutilizable** de Three.js: generador de personaje, clips y exportador. No copies `index.html`, `main.js` ni scripts de Vite a la estructura Next.

### Git

`create-next-app` puede inicializar Git automáticamente. Comprueba primero:

```bash
git status
```

Si todavía no existe repositorio:

```bash
git init
```

Después registra una versión inicial (si Git está configurado):

```bash
git add .
git commit -m "Crear base Next.js del estudio procedural"
```

`.gitignore` debe excluir, al menos, `node_modules/`, `.next/`, archivos sensibles `.env*` y salidas temporales. No publiques claves privadas ni modelos de terceros sin licencia.

---

## 3. Qué aporta Next.js y cómo encaja con Three.js

El objetivo es tener una aplicación web ampliable para portfolio. **Next.js no crea modelos 3D**: estructura la aplicación, rutas, componentes, datos y futuras APIs.

```text
NAVEGADOR
┌────────────────────────────────────────────────────────────────────┐
│ Next.js + React + Tailwind                                        │
│ ┌──────────────────────────────────┬──────────────────────────────┐ │
│ │ VISOR 3D                        │ PANEL DE EDICIÓN             │ │
│ │ React Three Fiber <Canvas>      │ - Proporciones               │ │
│ │ Three.js: modelo articulado     │ - Martillo y armaduras       │ │
│ │ Cámara lateral / 3⁄4            │ - Idle / Ataque / Pausa      │ │
│ │                                  │ - Exportar / Validar GLB     │ │
│ └──────────────────────────────────┴──────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
                  ↓ GLB con AnimationClips
               PixelOver → sprites → Godot
```

### Regla arquitectónica decisiva

Divide el proyecto en **tres capas**:

1. **Núcleo de Three.js, independiente de React:** funciones TypeScript que devuelven `THREE.Group`, pivotes, materiales y `THREE.AnimationClip`. Esta capa es la fuente real del modelo exportable.
2. **Visor React Three Fiber:** usa `<Canvas>`, `<primitive object={character.root} />`, cámara, luces y controles. Solo visualiza y reproduce modelos; **no debe ser la única representación del personaje**.
3. **Interfaz Next.js:** paneles, botones, sliders y más adelante páginas, almacenamiento o API.

Esta separación importa: **el GLB debe exportarse a partir de objetos Three.js reales**, no a partir de componentes React ni de una captura del canvas.

### Next.js: servidor y navegador

- Los archivos `page.tsx` de App Router son **Server Components por defecto**.
- Three.js/WebGL, los eventos del visor y las descargas necesitan ejecutarse **en el navegador**.
- Los componentes interactivos deben usar `'use client'`.
- Si hay errores de renderizado en servidor, carga el visor mediante `next/dynamic` con `{ ssr: false }` **dentro de un Client Component**.
- `'use client'` por sí solo **no garantiza** que todo código se ejecute únicamente en el navegador durante la prerenderización. No accedas a `window`, `document` o WebGL en el ámbito global del módulo.
- No necesitas API Route ni Server Action para construir y descargar el GLB en esta primera fase: el exportador puede trabajar en el cliente.

**Importante:** `ssr: false` no puede declararse directamente desde un Server Component. Usa un componente cliente intermedio.

---

## 4. Estructura de archivos recomendada

No crees todos los archivos desde el primer día. Esta es la **estructura objetivo** para las fases A–D:

```text
procedural-character-studio/
├── AGENTS.md                       # Reglas específicas para Codex
├── README.md                       # Arranque, características y límites
├── package.json
├── package-lock.json
├── tsconfig.json
├── next.config.ts                  # Solo si hay configuración necesaria
├── eslint.config.mjs
├── .gitignore
├── public/
│   └── references/                 # Referencias con permisos de uso
├── docs/
│   ├── notas-pipeline.md           # Qué funciona y qué falla
│   └── pruebas-pixelover.md        # Resultados y capturas del experimento
└── src/
    ├── app/
    │   ├── layout.tsx              # Layout global
    │   ├── page.tsx                # Página principal (Server Component)
    │   └── globals.css             # Tailwind y estilos generales
    ├── components/
    │   └── studio/
    │       ├── StudioClient.tsx     # Estado y controles; 'use client'
    │       ├── CharacterViewport.tsx# Canvas R3F; 'use client'
    │       └── CharacterControls.tsx# Botones/controles; 'use client'
    ├── lib/
    │   ├── character/
    │   │   ├── createCharacter.ts   # Objeto THREE.Group, geometría
    │   │   ├── rig.ts               # Pivotes y nombres de nodos
    │   │   ├── proportions.ts       # Valores configurables
    │   │   └── equipment.ts         # Martillo
    │   ├── animation/
    │   │   ├── createClips.ts       # AnimationClips exportables
    │   │   └── playback.ts          # Lógica de AnimationMixer
    │   └── io/
    │       ├── exportGlb.ts         # GLTFExporter
    │       └── validateGlb.ts       # GLTFLoader + comprobaciones
    └── types/
        └── character.ts             # Tipos de personaje y clips
```

**No necesitas una carpeta `exports/` servida por Next.js:** el botón podrá descargar el `.glb` al ordenador. Si guardas ejemplos de salida en el repositorio, hazlo en una carpeta documentada y con archivos pequeños.

---

## 5. Primer ejemplo funcional de visor Next.js + R3F

Este ejemplo **solo comprueba el montaje de WebGL**. No representa el personaje final. Codex lo podrá sustituir por la geometría procedural.

### `src/app/page.tsx`

```tsx
import { StudioClient } from '@/components/studio/StudioClient';

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <h1 className="mb-4 text-2xl font-bold">Procedural Character Studio</h1>
      <StudioClient />
    </main>
  );
}
```

### `src/components/studio/StudioClient.tsx`

```tsx
'use client';

import dynamic from 'next/dynamic';

const CharacterViewport = dynamic(
  () => import('./CharacterViewport').then((module) => module.CharacterViewport),
  {
    ssr: false,
    loading: () => <div className="h-[540px]">Cargando visor 3D...</div>,
  }
);

export function StudioClient() {
  return (
    <div className="h-[540px] overflow-hidden rounded-xl border border-slate-700">
      <CharacterViewport />
    </div>
  );
}
```

### `src/components/studio/CharacterViewport.tsx`

```tsx
'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

export function CharacterViewport() {
  return (
    <Canvas
      orthographic
      camera={{ position: [0, 2, 8], zoom: 100, near: 0.1, far: 100 }}
      style={{ width: '100%', height: '100%' }}
    >
      <color attach="background" args={['#1b2333']} />
      <ambientLight intensity={1.1} />
      <directionalLight position={[3, 6, 5]} intensity={2} />
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[0.9, 1.8, 0.55]} />
        <meshStandardMaterial color="#5275aa" />
      </mesh>
      <gridHelper args={[10, 10]} />
      <OrbitControls makeDefault />
    </Canvas>
  );
}
```

**Qué debería ocurrir:** aparece un volumen azul 3D que puedes rotar. Si se ve bien, ya tienes Next.js, React, Tailwind, WebGL y React Three Fiber funcionando.

**Ojo:** al rotar con `OrbitControls` se sale de la vista lateral. Después añadiremos un botón de restablecer la cámara de perfil. La cuadrícula es solo para pruebas y **no se exportará**.

---

## 6. Personaje procedural: anatomía antes que detalle

### Diseño mínimo de la primera versión

- Guerrero humanoide estilizado, orientado hacia la **derecha de la pantalla** (`+X`).
- Cámara de perfil mirando al plano `XY` desde `+Z`.
- Hombros, pelvis, codos, rodillas y tobillos colocados con proporciones coherentes.
- Piezas simples y legibles; volumen suficiente en manos, botas, torso y cabeza.
- Martillo grande, reconocible a tamaño de sprite y unido a una mano.
- Superposición sutil de piezas en articulaciones: evita huecos al doblarlas.
- Colores grandes y claros; los detalles finos desaparecerán con el pixelado.

### Jerarquía sugerida (Three.js puro)

```text
CharacterRoot (THREE.Group)
└── Hips
    ├── Torso
    │   ├── Neck → Head
    │   ├── Shoulder_L → UpperArm_L → Elbow_L → Forearm_L → Hand_L
    │   └── Shoulder_R → UpperArm_R → Elbow_R → Forearm_R → Hand_R
    │                                                   └── WeaponGrip → Hammer
    ├── Hip_L → UpperLeg_L → Knee_L → LowerLeg_L → Foot_L
    └── Hip_R → UpperLeg_R → Knee_R → LowerLeg_R → Foot_R
```

**Cada articulación es un pivote:** se crea un `THREE.Group` en la posición del hombro, codo, etc.; la geometría visible se coloca desplazada respecto al origen del grupo. Rotamos el pivote, no una malla arbitraria desde el centro.

**Diferencia que debes conservar:** una jerarquía de `THREE.Group` con piezas rígidas **no es un esqueleto de `THREE.Bone` + `SkinnedMesh`**. Puede animarse y exportarse mediante transformaciones de nodos, pero no da deformación suave de la piel ni garantiza controles de huesos en PixelOver. Es suficiente para la **primera prueba**, no necesariamente para un editor final de animación esquelética.

### Interoperabilidad con React Three Fiber

El generador de personaje debería devolver una estructura tipada como esta (esquema orientativo):

```ts
import * as THREE from 'three';

export interface CharacterAsset {
  root: THREE.Group;
  joints: Record<string, THREE.Object3D>;
}

export function createCharacter(): CharacterAsset {
  const root = new THREE.Group();
  root.name = 'CharacterRoot';

  // Codex añadirá los pivotes, las mallas y el arma.
  return { root, joints: {} };
}
```

Después R3F lo muestra con `<primitive object={asset.root} />`, pero **el modelo sigue existiendo como objetos Three.js puros**. Mantén la referencia a esos objetos y a sus clips fuera de la UI de exportación: el exportador necesitará exactamente la jerarquía correspondiente. Evita reconstruir el personaje en cada render de React; usa referencias estables y una única fuente de datos para parámetros y clips.

---

## 7. Animaciones: el requisito más importante

### Clips de la primera prueba

**`Idle`**

- Aproximadamente 1–1,5 s, en bucle.
- Respiración leve y oscilación suave, pies razonablemente estables.

**`HammerHeavyAttack`**

- Aproximadamente 0,8–1,2 s (solo referencia inicial).
- Poses: reposo → anticipación → levantar arma → aceleración → impacto → recuperación → reposo.
- Movimiento coordinado de caderas, torso, hombros, brazos y cabeza del martillo.
- El arma no debe confundirse con el torso desde la vista lateral.

Después de validar el pipeline: carrera, salto, esquiva perfecta, Long Sword y contraataques.

### Lo que se ve en el navegador no tiene por qué exportarse

Esto puede crear una animación visible **sin** que quede guardada en GLB:

```ts
// Ejemplo de movimiento que, por sí solo, NO es un clip exportable.
function update(time: number, shoulder: THREE.Object3D) {
  shoulder.rotation.z = Math.sin(time) * 0.3;
}
```

Para exportar animaciones usaremos **`THREE.AnimationClip` y `THREE.KeyframeTrack`**, reproducidos mediante `THREE.AnimationMixer`.

- `QuaternionKeyframeTrack` para rotaciones.
- `VectorKeyframeTrack` para posiciones y escalas.
- Nombres estables y únicos para nodos de la jerarquía.
- Clips asociados a esos nodos y listados explícitamente en el exportador.
- Si se usan interpolaciones procedurales, **hornear** las muestras a tracks antes de exportar.

Ejemplo conceptual (TypeScript):

```ts
import * as THREE from 'three';

const idleClip = new THREE.AnimationClip('Idle', 1, [
  new THREE.VectorKeyframeTrack(
    'CharacterRoot.position',
    [0, 0.5, 1],
    [0, 0, 0,  0, 0.03, 0,  0, 0, 0]
  ),
]);
```

Las rutas deben coincidir con los nombres reales de los nodos del objeto exportado. Para la rotación de articulaciones, Codex debe calcular cuaterniones válidos a partir de poses. No debe suponer que cualquier función `useFrame` se convertirá automáticamente en animación GLB.

### Responsabilidad del núcleo vs. del visor

- **Núcleo Three.js:** crea `CharacterAsset` + `AnimationClip[]`.
- **Visor R3F:** reproduce o pausa clips con `AnimationMixer`, puede usar `useFrame` para **actualizar el mixer**; no debe introducir movimientos esenciales ajenos a los clips.
- **Exportador:** usa el `CharacterAsset` y esos clips reales.

### El combate se implementará en Godot

| Fase del ataque | Responsabilidad visual | Responsabilidad de Godot |
|---|---|---|
| Anticipación | Pose y preparación | Reglas de control/cancelación |
| Golpe activo | Arco del martillo | Hitbox, daño |
| Impacto | Pose, inercia | Hitstop, sonido, cámara, partículas |
| Recuperación | Volver a guardia | Ventana de vulnerabilidad |

La esquiva perfecta y las colisiones del juego **no se programan en esta web**.

---

## 8. Cámara y criterios visuales de pixel art

- Cámara **ortográfica** principal; el personaje mira hacia `+X`, y la cámara observa desde `+Z`.
- Botón para restaurar la vista lateral después de orbitar.
- Encadre y escala constantes en todas las animaciones.
- Luces sencillas: ambiente + direccional; mantener colores claros.
- Objetos auxiliares (ejes, cuadrícula, helpers) solo en el visor.
- Comprobar el personaje de perfil a **64 y 96 píxeles de altura**; estos valores son candidatos, no una decisión permanente de resolución.
- Exagerar las poses y separar el martillo del cuerpo si el sprite no se entiende.

**Importante:** los efectos de postprocesado, la cuadrícula, la cámara del visor y el pixelado de pantalla **no se exportan como aspecto pixelado dentro del GLB**. Primero exportamos el personaje 3D y después PixelOver renderiza los sprites.

---

## 9. Exportación GLB en Next.js (ejecución en navegador)

Three.js incluye `GLTFExporter`; no hay que instalar otro paquete aparte de `three`.

```ts
import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';

export async function buildGlb(
  root: THREE.Group,
  clips: THREE.AnimationClip[]
): Promise<ArrayBuffer> {
  // Escena aislada: no exportar cuadrícula, luces o helpers del visor.
  // Los nombres y la estructura de nodos deben corresponder a las pistas.
  const exportScene = new THREE.Scene();
  exportScene.add(root.clone(true));

  const exporter = new GLTFExporter();
  const output = await exporter.parseAsync(exportScene, {
    binary: true,
    animations: clips,
    trs: true,
    onlyVisible: true,
  });

  if (!(output instanceof ArrayBuffer)) {
    throw new Error('Se esperaba un GLB binario.');
  }
  return output;
}
```

**Advertencia técnica:** `root.clone(true)` funciona como punto de partida para una jerarquía de mallas rígidas y nombres únicos. Si más adelante usamos `SkinnedMesh` y huesos reales, no hay que asumir que un clonado estándar conserva correctamente todo el esqueleto; se deberá usar una técnica de clonación compatible o exportar una jerarquía dedicada. Comprobar siempre que las pistas se enlazan a los nodos clonados por nombre.

Descargar el GLB (solo desde un botón en un Client Component):

```ts
export function downloadBuffer(buffer: ArrayBuffer, filename: string) {
  const blob = new Blob([buffer], { type: 'model/gltf-binary' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
```

El ejemplo es una **base**, no una promesa de que todas las animaciones estén bien enlazadas: el siguiente paso es obligatorio.

### Validar reimportando lo exportado

```ts
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
```

Pide a Codex una vista de validación que tome el **GLB recién creado**, lo cargue desde su `ArrayBuffer` o desde un `Blob` local mediante `GLTFLoader`, y compruebe:

- El personaje y el martillo siguen presentes.
- Las proporciones, orientación y jerarquía de nodos se conservan.
- El resultado contiene `Idle` y `HammerHeavyAttack` en `gltf.animations`.
- Un **nuevo** `AnimationMixer` reproduce los clips desde `gltf.scene` importada.
- No se reutiliza el objeto original ni sus clips para fingir la validación.
- No aparecen errores de consola ni rotaciones congeladas.

**Si el GLB se descarga, pero sus clips no se reproducen tras reimportarlo, la fase D no está terminada.**

Documentación oficial: https://threejs.org/docs/pages/GLTFExporter.html

---

## 10. Validar en PixelOver

1. Instala la demo o abre tu versión de PixelOver.
2. Importa el `.glb` desde **Archivo → Abrir** o arrastrándolo.
3. Comprueba que se reconoce como **escena 3D**, no como una imagen plana.
4. Busca los clips de animación y reproduce `Idle` y `HammerHeavyAttack`.
5. Configura una vista lateral ortográfica, escala y encuadre constantes.
6. Compara la legibilidad visual con el personaje renderizado aproximadamente a **64 px** y **96 px** de altura.
7. Prueba gradualmente pixelado, reducción de paleta, indexación, dithering e iluminación.
8. Anota qué arreglos necesita: articulación, silueta, orientación, clips o paleta.
9. Guarda el proyecto `.pixelover`.

La documentación oficial confirma importación de escenas `.gltf/.glb` con componentes 3D, pero **la compatibilidad práctica de nuestros clips y su edición dentro de PixelOver debe comprobarse**. Una jerarquía rígida no necesariamente se expondrá como huesos editables.

### Si PixelOver no reproduce las animaciones

1. **No aparecen en el GLB** → problema de `AnimationClip` / exportación en Three.js.
2. **Aparecen pero fallan al reimportarlas en la web** → rutas de pistas, nodos, clonación o clip.
3. **Funcionan en la web reimportada, pero fallan en PixelOver** → prueba una escena GLB mínima; después evalúa compatibilidad de jerarquías rígidas frente a rig esquelético real.

### ¿Y la demo gratuita?

La demo permite experimentar, pero su licencia **restringe la exportación**. No compres la versión completa hasta comprobar que los modelos y animaciones se ven bien. Consulta las condiciones exactas de tu versión en: https://docs.pixelover.io/manual/licenses/

---

## 11. Exportar sprites a Godot (cuando PixelOver funcione)

1. En una edición de PixelOver que permita exportar, configura la salida a PNG/spritesheet.
2. Mantén escala, encuadre, transparencia, origen de pies y dimensiones de celda consistentes entre animaciones.
3. Registra la resolución, paleta, FPS y parámetros de render usados.
4. Importa la hoja en Godot y crea las animaciones con `SpriteFrames` / `AnimatedSprite2D`.
5. Implementa en Godot las hitboxes, el daño, el hitstop, las esquivas perfectas, las partículas y la lógica de combate.

**Valores para probar, no fijar de antemano:** 64 / 96 / 128 px de altura; 12 / 16 / 24 FPS visuales. Juzgar con una animación completa, no solo un fotograma bonito.

Fuente: https://docs.pixelover.io/manual/export/

---

## 12. Plan por fases para Codex

### Fase A — Next.js y visor funcionando

**Entregable:** página `/` con visor R3F, cámara ortográfica, luces, volumen 3D de prueba, cuadrícula y control para restablecer vista lateral.

**Aceptación:** `npm run dev` muestra la escena, `npm run build` y `npx tsc --noEmit` pasan. No hay errores de hidratación ni `window is not defined`.

### Fase B — anatomía y pivotes

**Entregable:** generador de `THREE.Group` puro con un guerrero, pivotes, martillo unido a mano y depuración de articulaciones.

**Aceptación:** proporciones convincentes y giros de las articulaciones coherentes desde el perfil.

### Fase C — animación exportable

**Entregable:** `Idle` y `HammerHeavyAttack` como `AnimationClip`, panel de reproducción y pausa.

**Aceptación:** clips distinguibles, reproducidos por `AnimationMixer`; anticipación, impacto y recuperación legibles.

### Fase D — GLB, descarga y prueba de reimportación

**Entregable:** `GLTFExporter`, descarga `.glb` y validación con `GLTFLoader` reproduciendo los clips importados.

**Aceptación:** el modelo **y los dos clips** sobreviven el viaje GLB → importador.

### Fase E — PixelOver

**Entregable:** evaluación de silueta, animación y pixelado a 64/96 px; registro de resultados.

**Aceptación:** suficiente calidad para continuar el proyecto.

### Fase F — portfolio (NO antes de E)

Opcionales: presets anatómicos, varias armaduras, Long Sword, spritesheets automatizados, proyectos guardados, galerías, autenticación, almacenamiento e integración de IA dentro de la web. No implementar todavía bases de datos, pagos, usuarios ni colaboración en tiempo real.

---

## 13. Prompts listos para Codex

### Prompt 1 — Fases A y B

> Este repositorio es **Procedural Character Studio**, una aplicación en **Next.js App Router + TypeScript + React + Tailwind + React Three Fiber + Three.js**. Su objetivo es validar un pipeline para crear sprites pixel art en PixelOver a partir de personajes 3D procedurales. No es el videojuego final.
>
> Trabaja **solo en las fases A y B**. Examina primero `package.json`, la estructura actual y `AGENTS.md`. Crea un editor sencillo en la ruta principal con visor `<Canvas>` R3F, cámara ortográfica lateral mirando desde `+Z`, iluminación básica, fondo neutro y controles para orbitar/restaurar cámara. El canvas ha de cargarse de forma segura en el navegador sin errores SSR/hidratación.
>
> Genera mediante **Three.js puro** (en `src/lib/character`) un guerrero humanoide estilizado de perfil con proporciones aceptables, piezas geométricas simples, pivotes de hombros/codos/cadera/rodillas y un martillo unido a la mano. Devuelve una jerarquía `THREE.Group` con nombres únicos y estables; no construyas la geometría solo mediante JSX. R3F únicamente presenta el asset con `<primitive>`.
>
> Prioriza anatomía, silueta y articulaciones frente a detalles cosméticos. Mantén utilidades de cuadrícula y pivotes fuera de la futura jerarquía exportable. Construye un panel mínimo con opción de ver articulaciones, cambiar vista y parámetros sencillos. **No crees animaciones ni exportación GLB todavía**.
>
> Ejecuta `npx tsc --noEmit` y `npm run build` y corrige los errores. Si existe script de lint, ejecútalo. Indica qué archivos cambiaste, cómo arrancar y qué debo revisar visualmente. No afirmes haber visto la calidad del personaje si no has inspeccionado el resultado.

### Prompt 2 — Fase C

> Ya existe el personaje articulado. Implementa **solo la fase C**: `Idle` y `HammerHeavyAttack` como `THREE.AnimationClip`, con tracks de keyframes enlazados a nombres únicos de los pivotes reales. Reprodúcelos desde React Three Fiber con `THREE.AnimationMixer` y controles de reproducción/pausa. El ataque debe incluir anticipación, participación del torso y hombros, golpe e inercia de recuperación. No uses `useFrame` para definir movimientos indispensables que luego no queden guardados en los clips; `useFrame` puede actualizar el mixer. El núcleo de animación debe ser reutilizable y ajeno a React. Comprueba TypeScript y build; explica cómo verificar las poses.

### Prompt 3 — Fase D

> Implementa **solo la fase D**. Añade exportación `.glb` usando `GLTFExporter`, `binary: true`, `trs: true` y la lista explícita `[idleClip, hammerHeavyAttackClip]`, utilizando una escena de exportación que contenga solo el personaje y el martillo. No exportes cámara, cuadrícula ni gizmos. Asegúrate de que los nombres de nodos en la jerarquía exportada coinciden con las pistas.
>
> Añade un botón de descarga **en un Client Component** y una prueba de reimportación con `GLTFLoader`. La comprobación debe cargar el GLB recién generado, enumerar los clips presentes y reproducirlos sobre la jerarquía **importada**, sin usar el personaje original. Gestiona errores y muestra el resultado en la interfaz. Verifica `npx tsc --noEmit`, `npm run build` y lint si existe. No implementes PixelOver ni spritesheets todavía.

### Protocolo de trabajo con Codex

1. Da **una fase** cada vez.
2. Guarda un commit cuando la fase funcione.
3. Examina el personaje en el navegador; manda una captura a Codex si la anatomía no convence.
4. Corrige proporciones/pivotes antes de añadir detalles o más animaciones.
5. Si una animación se ve bien pero no se exporta, prioriza arreglar GLB antes de hacer otra.
6. Exige que Codex indique qué comprobó **realmente** y qué falta validar manualmente.

---

## 14. Instrucciones permanentes para Codex: `AGENTS.md`

Se adjunta una versión actualizada de `AGENTS.md` para la **raíz** de este repositorio. Úsala junto con esta guía:

- Stack: Next.js, App Router, TypeScript, React, Tailwind, R3F y Three.js.
- El visor y los controles son **Client Components**; evitar SSR de WebGL.
- El modelo y los clips se construyen en el núcleo de Three.js puro, independiente de React.
- No confundir `THREE.Group` con un rig deformable `Bone`/`SkinnedMesh`.
- Siempre verificar el GLB mediante reimportación y reproducción de clips.
- Las fases A–E se hacen antes de proyectos guardados, backend, cuentas o integración de IA por API.
- Ejecutar comprobaciones TS/build y no afirmar resultados visuales sin inspeccionarlos.

**Si `create-next-app` generó otro `AGENTS.md`, revisa ambos y conserva una única versión coherente.**

---

## 15. Errores habituales en Next.js + Three.js

| Síntoma | Causa frecuente | Qué comprobar |
|---|---|---|
| `window is not defined` | Código de navegador ejecutado durante renderizado del servidor | Componentes cliente, importación diferida del visor, quitar acceso global a `window` |
| Error de hidratación | SSR y primer render de cliente no coinciden | Separar el visor WebGL de la página servidor |
| `ssr: false` no permitido | `dynamic()` declarado en Server Component | Moverlo a `StudioClient.tsx` con `'use client'` |
| Visor en blanco | Contenedor de Canvas sin altura | Establecer altura explícita; revisar consola |
| Módulo de Three.js no transpila | Addon ESM en versión concreta | Actualizar dependencias; solo si falla, probar `transpilePackages: ['three']` en `next.config.ts` |
| React Three Fiber incompatible | Versión de React y Fiber no emparejada | Comprobar versiones; R3F v9 se empareja con React 19 |
| El personaje se reinicia al mover sliders | Se crea un modelo nuevo en cada render | Mantener asset y clips estables; reconstruir solo cuando cambian parámetros relevantes |
| Doble animación o fugas | Mixer, loops o controles sin limpieza | Limpiar listeners/acciones y evitar duplicación en Strict Mode |
| El brazo gira desde la mitad | Pivote mal colocado | Corregir origen del grupo y posición de la malla |
| Animación solo visible en el navegador | `useFrame` cambia rotaciones pero no crea clips | Crear y exportar `AnimationClip`/tracks |
| GLB inmóvil | Clips ausentes, rutas o nodos incorrectos | Comprobar `gltf.animations` y ejecutar mixer sobre importado |
| GLB falla tras clonar un rig esquelético | `SkinnedMesh` necesita clonación específica | Revisar clonación y exportación de huesos reales |
| PixelOver no muestra clips | Posible incompatibilidad de pistas/rig | Probar GLB básico y validar antes con `GLTFLoader` |
| Pixelado poco legible | Silueta o poses débiles | Cambiar escala, separar silueta y simplificar diseño |
| La demo no exporta sprites | Limitación de licencia | Validar visualmente y decidir compra después |

No añadas `next-transpile-modules`: es un método legado. En un Next moderno, la alternativa integrada, **si realmente hace falta**, es `transpilePackages`.

---

## 16. Limitaciones deliberadas

- Next.js **no mejora la calidad geométrica por sí mismo**; mejora el desarrollo de la aplicación y su potencial de portfolio.
- React Three Fiber facilita integrar el visor en React, pero el núcleo exportable debe seguir siendo Three.js.
- Los rigs de piezas rígidas son más simples que el skinning, pero pueden limitar giros de torso o movimientos orgánicos.
- El pixelado elimina detalle fino; **no corrige** anatomía, silueta ni timing.
- Convertir un modelo 3D procedural en un personaje artístico atractivo puede requerir iteraciones y criterio visual.
- Si un asset ya riggeado o Blender resulta mucho más eficiente para movimientos complejos, reconsideraremos el pipeline.
- La exportación GLB **no convierte automáticamente un resultado de R3F en spritesheets**. PixelOver u otro renderizador será una etapa aparte.

---

## 17. Checklist inicial

### Instalación y primera ejecución

- [ ] `node -v` y `npm -v` funcionan; Node compatible con Next.js.
- [ ] Ejecutar `npx create-next-app@latest procedural-character-studio`.
- [ ] Elegir TypeScript, Tailwind, ESLint, App Router y carpeta `src/`.
- [ ] Entrar con `cd procedural-character-studio`.
- [ ] Instalar `three @react-three/fiber @react-three/drei`.
- [ ] Instalar `@types/three` como dependencia de desarrollo.
- [ ] Ejecutar `npm run dev` y abrir `http://localhost:3000`.
- [ ] Copiar/fusionar `AGENTS.md` actualizado en la raíz.
- [ ] Pasar a Codex el **Prompt 1** (sección 13).
- [ ] Verificar visor, cámara, anatomía, articulaciones y martillo.
- [ ] Ejecutar `npx tsc --noEmit` y `npm run build`.

### Validación del pipeline

- [ ] Hay un guerrero con proporciones y pivotes convincentes.
- [ ] `Idle` y `HammerHeavyAttack` son clips exportables distintos.
- [ ] El GLB conserva geometría, materiales y las dos animaciones.
- [ ] `GLTFLoader` reimporta y reproduce los clips del GLB.
- [ ] PixelOver muestra correctamente el modelo y los movimientos.
- [ ] El sprite a 64 y 96 píxeles mantiene silueta y legibilidad.
- [ ] El esfuerzo por cambiar un arma o duración de ataque es razonable.

Si los tres últimos fallan repetidamente, habrá que replantear la técnica antes de ampliar el editor.

---

## 18. Documentación oficial para consultar

Verificada durante la actualización a Next.js (5 de noviembre de 2026):

1. Next.js — instalación y requisitos: https://nextjs.org/docs/app/getting-started/installation
2. Next.js — carga diferida y `ssr: false`: https://nextjs.org/docs/app/guides/lazy-loading
3. Next.js — Server y Client Components: https://nextjs.org/docs/app/getting-started/server-and-client-components
4. React Three Fiber — instalación y compatibilidad: https://r3f.docs.pmnd.rs/getting-started/installation
5. Three.js — GLTFExporter: https://threejs.org/docs/pages/GLTFExporter.html
6. Three.js — GLTFLoader: https://threejs.org/docs/pages/GLTFLoader.html
7. Three.js — sistema de animación: https://threejs.org/manual/#en/animation-system
8. PixelOver — importación: https://docs.pixelover.io/manual/import/
9. PixelOver — primeros pasos 3D: https://docs.pixelover.io/tutorials/first_steps3d/
10. PixelOver — animación: https://docs.pixelover.io/manual/animation/
11. PixelOver — exportación: https://docs.pixelover.io/manual/export/
12. PixelOver — licencias: https://docs.pixelover.io/manual/licenses/

---

## Tu próximo paso

**Crea el proyecto con `create-next-app`, instala las dependencias 3D, copia el `AGENTS.md` actualizado y pasa el Prompt 1 a Codex.** No implementes de entrada exportación, generador mediante prompts ni todas las animaciones: primero revisaremos una anatomía y una silueta que realmente funcionen desde el perfil.
