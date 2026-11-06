# Cómo está construido Hammer warrior

Documento de explicación y código fuente completo del personaje en la fase B.2.

Los encabezados `hammer-warrior/...`, `shared/...` y `types.ts` son relativos a `src/lib/characters/`. Los encabezados `components/...` y `app/...` son relativos a `src/`.

Se incluyen todos los archivos del generador, los cuatro componentes del estudio y los archivos de la página, layout y estilos que los presentan. Los bloques de código son copias completas de los archivos actuales, sin números de línea ni fragmentos omitidos. Esta es una instantánea: si el proyecto cambia después, el documento no se actualiza automáticamente.

### 1. Idea general: un personaje ensamblado mediante código

El personaje no se carga desde Blender, un GLB ni una imagen. Se genera ejecutando `createCharacter()` con Three.js. El resultado es un árbol de objetos tridimensionales que contiene piezas de geometría, materiales y articulaciones.

Hay tres conceptos distintos:

| Concepto | Qué representa aquí |
|---|---|
| Geometría | Los vértices y triángulos que forman un muslo, una manga, una cabeza o una bota. |
| Material | El color y la respuesta a la luz de piel, ropa, cuero o metal. |
| Nodo/pivote | Un objeto `Group` cuya posición y orientación organizan y mueven las piezas hijas. |

Una `Mesh` une geometría y material. Un `Group` organiza objetos, pero por sí mismo no dibuja una superficie. Las articulaciones del personaje son grupos colocados en posiciones anatómicas.

La anatomía actual usa piezas rígidas superpuestas, no una única piel deformable. Al doblar un codo, el antebrazo gira como una pieza completa. Los volúmenes de unión disimulan la separación entre piezas; no calculan deformación muscular.

### 2. Convenciones espaciales

- Las unidades de referencia son metros.
- `+Y` apunta hacia arriba.
- `+X` es el frente del personaje: la nariz y los pies avanzan en esa dirección.
- `Z` separa los lados del cuerpo.
- La cámara lateral observa desde `+Z`.
- La cámara frontal observa desde `+X` hacia el personaje.
- El suelo de referencia está en `Y = 0`.

Las posiciones de un hijo son locales a su padre. Por ejemplo, el codo no se coloca directamente en una coordenada global del mundo: está a `-upperArm` en Y respecto al hombro. Cuando gira el hombro, ese desplazamiento también gira y transporta el codo.

De manera conceptual, la transformación mundial de un hijo se obtiene multiplicando la transformación mundial del padre por la transformación local del hijo. Esta herencia explica por qué mover el torso arrastra cuello, cabeza y brazos.

### 3. Jerarquía de articulaciones

Este árbol muestra los pivotes y el enganche del arma. Las mallas corporales también cuelgan de ellos, pero se omiten del árbol para facilitar su lectura.

```text
CharacterRoot
└── Hips
    ├── Torso
    │   ├── Neck
    │   │   └── Head
    │   ├── Shoulder_L
    │   │   └── Elbow_L
    │   │       └── Hand_L
    │   └── Shoulder_R
    │       └── Elbow_R
    │           └── Hand_R
    │               └── WeaponGrip
    │                   └── Hammer
    │                       ├── Hammer_Handle
    │                       ├── Hammer_Head
    │                       └── Hammer_Band
    ├── Hip_L
    │   └── Knee_L
    │       └── Ankle_L
    └── Hip_R
        └── Knee_R
            └── Ankle_R
```

Hay 16 articulaciones identificadas por `JOINT_NAMES`. `CharacterRoot`, `WeaponGrip` y `Hammer` son grupos adicionales, no articulaciones de esa lista.

Las caderas están a 0,94 m de altura en el modelo base. Los muslos y las tibias miden 0,40 m entre pivotes; los tobillos quedan a 0,14 m, distancia que completa la geometría del pie hasta el suelo. La separación de hombros y caderas se aplica con signos opuestos en Z. Las caderas también tienen un pequeño desfase en X para separar los apoyos de perfil.

### 4. Cómo se crean las formas orgánicas

`BODY_PROFILES` describe las piezas como una sucesión de secciones horizontales. Cada sección tiene esta forma:

```text
[y, radioDelantero, semianchuraZ, desplazamientoX?, radioTrasero?]
```

Por ejemplo, `[0.255, 0.154, 0.21, 0, 0.125]` describe una sección situada a 0,255 m del origen local: sobresale 0,154 m hacia delante, 0,125 m hacia atrás y 0,21 m hacia cada lado de Z.

El helper `createProfileGeometry()` hace lo siguiente:

1. Recorre las secciones ordenadas por Y.
2. Genera el contorno de cada sección. Para el cuerpo utiliza 12 puntos alrededor de una elipse modificada.
3. Usa el radio delantero para los puntos con componente X positiva y el trasero para los de componente X negativa.
4. Une cada par de secciones consecutivas con dos triángulos por lado.
5. Cierra los extremos con tapas trianguladas.
6. Calcula las normales que determinan cómo responde la superficie a la iluminación.

Cambiar la anchura y la profundidad entre secciones crea cintura, pecho, deltoides, pantorrilla o estrechamiento de muñeca. El desplazamiento en X permite inclinar o desplazar el volumen sin mover el pivote. El radio trasero independiente permite diferenciar pecho y espalda o la parte anterior y posterior del muslo.

El contorno es poligonal aunque el sombreado del cuerpo sea suave. Por eso una estética low-poly no exige que todos los triángulos se vean planos. Las tapas usan vértices separados para que sus normales no deformen el sombreado lateral.

El modo biselado usa un contorno de ocho vértices y geometría no indexada para conservar caras marcadas. Se usa en la cabeza del martillo y su banda. El parámetro `segments` determina la resolución del modo elíptico; no cambia ese contorno biselado fijo.

### 5. Ensamblaje de la anatomía y el vestuario

`createCharacter()` primero crea el rig, después los materiales y finalmente añade las mallas a sus pivotes.

- **Pelvis y cinturón:** cuelgan de `Hips`.
- **Abdomen, chaqueta, camiseta frontal y solapas:** cuelgan de `Torso`.
- **Cuello:** cuelga de `Neck`.
- **Cabeza, nariz, pelo y rasgos faciales:** cuelgan de `Head`.
- **Deltoides y brazo superior:** cuelgan del hombro correspondiente.
- **Antebrazo y puño de manga:** cuelgan del codo.
- **Palma, pulgar y nudillos:** cuelgan de la mano.
- **Muslo y cobertura de cadera:** cuelgan de la cadera individual.
- **Rodillera, unión de rodilla, pantorrilla y caña de bota:** cuelgan de la rodilla.
- **Pie y cobertura del tobillo:** cuelgan del tobillo.

El helper local `sculpt()` convierte un perfil en una malla. Dentro de una instancia del personaje, guarda la geometría en un `Map`: ambos brazos o ambas piernas pueden compartir la misma geometría sin generar dos copias idénticas. Esa caché es local al personaje, no global.

El helper `roundDetail()` reutiliza una esfera de radio 1 y la escala de forma distinta en X, Y y Z para producir elipsoides. Se usa para orejas, ojos, pulgares, nudillos, articulaciones y otros detalles pequeños. Sus dimensiones se expresan como factores de escala de esa esfera: son semiejes, no el ancho total de la pieza.

La chaqueta no es una simulación de tela. Es un conjunto de volúmenes marrones con una pieza clara por delante que sugiere una camiseta bajo una abertura. Tampoco hay texturas pintadas ni mapas de piel: los colores provienen de materiales.

### 6. Materiales e iluminación

Cada personaje obtiene sus propios `MeshStandardMaterial`. Piel, tela y pelo tienen alta rugosidad; acero y dorado añaden metalicidad y sombreado facetado.

Los materiales pertenecen al modelo, pero las luces pertenecen al visor. El visor añade una luz ambiental y dos direccionales. Por tanto, el aspecto visible es el resultado conjunto de geometría, normales, materiales e iluminación. Cambiar una luz puede modificar mucho la lectura del mismo modelo sin modificar sus vértices.

### 7. Cómo se sujeta el martillo

El martillo tiene tres mallas: mango cilíndrico de ocho lados, cabeza biselada y banda central. Su origen es el punto de agarre, y el mango se extiende a lo largo de su Y local.

`WeaponGrip` pertenece a `Hand_R`. Así, la cadena hombro → codo → mano mueve automáticamente el arma. No se recalcula la posición del martillo para perseguir la mano en cada frame.

El giro de `WeaponGrip` compensa los ángulos iniciales del hombro y codo derechos. Eso mantiene vertical el martillo en la pose base que devuelve el generador. La pose de inspección llamada **Reposo** añade un giro en la mano para inclinarlo hacia delante y despejar la cara. La pose base del generador y el preset de reposo del inspector no son exactamente iguales.

### 8. Proporciones y altura

La referencia es 1,8 m. `heightScale()` limita la altura solicitada al intervalo 1,2–2,4 m y devuelve `altura / 1.8`.

La escala se aplica uniformemente a `CharacterRoot`. Una altura de 2,4 m produce una escala aproximada de 1,333, y una de 1,2 m produce una escala aproximada de 0,667. Se escalan también cabeza, arma y distancias entre articulaciones. No cambia la constitución corporal ni se alargan huesos por separado.

Modificar el deslizador no reconstruye las geometrías. El visor actualiza la escala del personaje existente.

### 9. Poses de inspección y restauración

`createRig()` guarda una copia de las posiciones y cuaterniones iniciales. `resetPose()` restaura ambos. Los cuaterniones representan orientación; las posiciones también deben restaurarse porque las poses de inspección ajustan el apoyo.

Hay dos funciones diferentes:

- `applyJointPose()` restaura la base y añade giros locales Z. Sigue exportada como herramienta sencilla.
- `applyInspectionPose()` es la que usa el visor B.2: restaura la base, aplica el preset, ajusta apoyo y añade después los giros manuales Z.

Los presets almacenan rotaciones Euler en grados sobre X, Y y Z. Se convierten a radianes antes de aplicarlas; las rotaciones originales de `REST_POSE` ya están en radianes.

Para apoyar los pies, `applyInspectionPose()` actualiza las matrices mundiales, calcula la caja envolvente de cada malla `Foot_L`/`Foot_R` y observa su mínimo Y. Después compensa la pelvis y las caderas individuales. Es una solución de inspección estática: no resuelve una cadena IK ni garantiza continuidad al interpolar entre presets. El cálculo presupone la raíz sin rotación y la escala uniforme positiva que utiliza este visor.

Los offsets manuales se aplican **después** de la compensación de apoyo. Por eso un ajuste manual extremo puede despegar un pie del suelo. Cambiar de preset limpia esos offsets; **Reset all joints** los borra manteniendo el preset; **Reset character** vuelve a reposo, altura de referencia y vista lateral.

### 10. Cómo llega el modelo a React

El flujo es:

```text
app/page.tsx
  → StudioClient
    → CharacterControls: modifica el estado
    → CharacterViewport: crea Canvas y la escena
      → CharacterModel: crea el asset en un efecto
        → createCharacter()
          → createRig() + materiales + perfiles + arma
      → primitive: muestra el Group existente
      → PixelCapture: genera las miniaturas
```

`page.tsx` presenta la estructura de la página. `StudioClient` guarda altura, pose, articulación seleccionada, cámara y visibilidad del rig. Carga el visor dinámicamente con SSR desactivado.

`CharacterModel` crea el asset dentro de un efecto, no en cada render de React. El grupo contenedor se conserva mediante estado y las referencias al personaje y a los helpers se conservan mediante refs. Otro efecto actualiza escala, pose y marcadores cuando cambian los controles.

`<primitive object={host} dispose={null} />` incorpora el árbol Three.js a React Three Fiber. `dispose={null}` deja la limpieza en manos del código del proyecto, evitando que R3F libere automáticamente recursos cuya propiedad controla el generador.

Los marcadores del rig son hermanos de `CharacterRoot`, no hijos. Copian posición y orientación mundiales de las articulaciones, pero no forman parte del personaje. Las cámaras, luces y grilla también se crean en el visor.

### 11. Cámara y miniaturas de 64/96 px

La cámara principal es ortográfica: los objetos no se hacen más pequeños por estar más lejos de la cámara como ocurriría con perspectiva. Hay presets lateral, frontal, tres cuartos y órbita; el encuadre se adapta a la altura.

Las miniaturas reutilizan el renderer WebGL y la instancia del personaje. `PixelCapture` crea dos render targets persistentes: 109 × 109 y 164 × 164 píxeles. Son mayores que 64/96 para dejar margen al arma y al encuadre.

La escala de captura se fija mediante `64 / altura` o `96 / altura` píxeles por metro. Es una referencia corporal aproximada, no una caja recortada que obliga a que todo, incluido el martillo, mida 64/96 px. Agacharse reduce la altura visible en lugar de ampliar automáticamente al personaje.

La cámara de miniaturas sigue la dirección de observación, pero usa su propio centro y escala. El zoom del visor principal no altera la escala de las miniaturas. La capa de render 1 incluye personaje y luces; excluye grilla y marcadores.

Después de renderizar se leen los píxeles, se invierte el orden de las filas y se copian a canvas 2D. CSS aplica `image-rendering: pixelated` y una ampliación ×2. El modo silueta sustituye temporalmente los materiales por un material uniforme; se restaura el estado del renderer al terminar.

`useFrame` aquí solo comprueba cambios de cámara y ejecuta capturas cuando hace falta. No anima el cuerpo ni sustituye clips de animación. La lectura GPU es síncrona; está planteada para estas miniaturas pequeñas, no para exportación masiva de sprites.

### 12. Gestión de memoria

Quitar un objeto de una escena no libera por sí solo sus recursos de GPU. `disposeObject()` recorre el árbol y reúne geometrías y materiales en conjuntos para liberar una sola vez cada recurso compartido.

`createCharacter().dispose()` es idempotente: una segunda llamada no vuelve a liberar el mismo asset. El efecto del visor se encarga de liberar el personaje y los helpers al desmontarse. Las miniaturas liberan sus render targets y material por separado.

### 13. Dónde modificar cada aspecto

| Quiero cambiar… | Archivo principal |
|---|---|
| Anchura del pecho, forma del muslo, grosor de muñeca | `hammer-warrior/proportions.ts`, `BODY_PROFILES` |
| Distancias entre articulaciones | `proportions.ts` y posiciones de `hammer-warrior/rig.ts` |
| Añadir o recolocar una malla corporal | `hammer-warrior/createCharacter.ts` |
| Colores y propiedades del material | `shared/materials.ts` |
| Forma del martillo | `hammer-warrior/equipment.ts` |
| Posición/orientación del agarre | Bloque `WeaponGrip` en `createCharacter.ts` |
| Poses estáticas | `hammer-warrior/inspectionPoses.ts` |
| Algoritmo que une perfiles | `shared/geometry.ts` |
| Encuadres y luces | `components/studio/CharacterViewport.tsx` |
| Captura de miniaturas y silueta | `components/studio/PixelPreview.tsx` |
| Botones y estado del inspector | `CharacterControls.tsx` y `StudioClient.tsx` |
| Tamaños, distribución y ampliación visual | `app/page.module.css` |

Cambiar una longitud requiere revisar tanto la distancia entre pivotes como los perfiles que cubren esa distancia. Algunos valores de los perfiles derivan de `PROPORTIONS`, pero otros puntos intermedios son números explícitos. No es todavía un sistema anatómico completamente paramétrico.

### 14. Límites de la implementación actual

No hay `Bone`, `Skeleton`, `SkinnedMesh`, pesos de vértices, IK, límites articulares, colisiones corporales ni dedos articulados. Tampoco hay clips `Idle`/`HammerHeavyAttack`, exportador GLB o validación de edición del rig en PixelOver. Los nombres de esas animaciones en la interfaz son indicadores de trabajo pendiente.

Las piezas pueden intersectarse en ajustes arbitrarios. Las miniaturas prueban legibilidad aproximada; no aplican paleta limitada, outlines ni el procesado de PixelOver. La base actual permite inspeccionar y posar un personaje rígido procedural, pero no es todavía el pipeline final de animación y sprites.

---

## hammer-warrior/createCharacter.ts

```ts
import { Group, Mesh, SphereGeometry, type Material, type Object3D } from 'three';
import type { CharacterAsset } from '../types';
import { disposeObject } from '../shared/dispose';
import { createProfileGeometry, type ProfileRing } from '../shared/geometry';
import { createWarriorMaterials } from '../shared/materials';
import { createHammer } from './equipment';
import { createRig } from './rig';
import { BODY_PROFILES as body, DEFAULT_HEIGHT, heightScale, REST_POSE } from './proportions';

export function createCharacter(height = DEFAULT_HEIGHT): CharacterAsset {
  const scale = heightScale(height);
  const rig = createRig();
  const { root, joints } = rig;
  const materials = createWarriorMaterials();
  const jointGeometry = new SphereGeometry(1, 12, 8);
  // Mirrored limbs share geometry within this asset, never between assets.
  const profiles = new Map<readonly ProfileRing[], ReturnType<typeof createProfileGeometry>>();
  function sculpt(parent: Object3D, name: string, material: Material, rings: readonly ProfileRing[]) {
    let geometry = profiles.get(rings);
    if (!geometry) {
      geometry = createProfileGeometry(rings, { section: 'ellipse', segments: 12 });
      profiles.set(rings, geometry);
    }
    const mesh = new Mesh(geometry, material);
    mesh.name = name;
    parent.add(mesh);
    return mesh;
  }
  function roundDetail(parent: Object3D, name: string, material: Material,
    size: [number, number, number], position: [number, number, number]) {
    const mesh = new Mesh(jointGeometry, material);
    mesh.name = name;
    mesh.scale.set(...size);
    mesh.position.set(...position);
    parent.add(mesh);
    return mesh;
  }

  sculpt(joints.Hips, 'Pelvis_Mesh', materials.cloth, body.pelvis);
  sculpt(joints.Hips, 'Belt_Mesh', materials.leather, body.belt);
  roundDetail(joints.Hips, 'Buckle_Mesh', materials.gold, [0.015, 0.027, 0.034], [0.123, 0.087, 0]);
  sculpt(joints.Torso, 'Abdomen_Mesh', materials.shirt, body.abdomen);
  sculpt(joints.Torso, 'Chest_Mesh', materials.jacket, body.chest);
  // A light inset reads as an open jacket without modelling tiny seams or buttons.
  sculpt(joints.Torso, 'Shirt_Front', materials.shirt, body.shirtFront);
  for (const side of ['L', 'R'] as const) {
    const sign = side === 'R' ? 1 : -1;
    sculpt(joints.Torso, `Jacket_Lapel_${side}`, materials.leather, body.lapel).position.z = sign * 0.076;
  }
  sculpt(joints.Neck, 'Neck_Mesh', materials.skin, body.neck);
  sculpt(joints.Head, 'Head_Mesh', materials.skin, body.head);
  sculpt(joints.Head, 'Nose_Mesh', materials.skin, body.nose);
  sculpt(joints.Head, 'Hair_Mesh', materials.hair, body.hair);
  sculpt(joints.Head, 'Hair_Back_Mesh', materials.hair, body.hairBack);
  const quiff = roundDetail(joints.Head, 'Hair_Quiff', materials.hair, [0.065, 0.035, 0.08], [0.028, 0.17, 0.012]);
  quiff.rotation.x = 0.25;
  quiff.rotation.z = -0.25;
  for (const side of ['L', 'R'] as const) {
    const sign = side === 'R' ? 1 : -1;
    roundDetail(joints.Head, `Ear_${side}`, materials.skin, [0.023, 0.033, 0.016], [-0.006, 0.063, sign * 0.101]);
    roundDetail(joints.Head, `Eye_${side}`, materials.face, [0.009, 0.008, 0.015], [0.088, 0.097, sign * 0.047]);
    const brow = roundDetail(joints.Head, `Brow_${side}`, materials.hair, [0.01, 0.006, 0.021], [0.085, 0.116, sign * 0.048]);
    brow.rotation.x = sign * 0.10;
  }
  roundDetail(joints.Head, 'Mouth_Mesh', materials.face, [0.005, 0.003, 0.025], [0.099, 0.015, 0]);

  for (const side of ['L', 'R'] as const) {
    const shoulder = joints[`Shoulder_${side}`];
    const elbow = joints[`Elbow_${side}`];
    const hip = joints[`Hip_${side}`];
    const knee = joints[`Knee_${side}`];
    roundDetail(hip, `HipJoint_${side}`, materials.cloth, [0.088, 0.10, 0.096], [0, -0.012, 0]);
    sculpt(shoulder, `ShoulderCap_${side}`, materials.jacket, body.shoulder);
    sculpt(shoulder, `UpperArm_${side}`, materials.jacket, body.upperArm);
    roundDetail(elbow, `ElbowCap_${side}`, materials.skin, [0.052, 0.052, 0.054], [0, 0, 0]);
    sculpt(elbow, `Forearm_${side}`, materials.skin, body.forearm);
    sculpt(elbow, `Sleeve_Cuff_${side}`, materials.jacket, body.cuff);
    const hand = joints[`Hand_${side}`];
    sculpt(hand, `HandMesh_${side}`, materials.skin, body.hand);
    const sign = side === 'R' ? 1 : -1;
    roundDetail(hand, `Thumb_${side}`, materials.skin, [0.025, 0.035, 0.02], [0.028, -0.035, -sign * 0.032]);
    roundDetail(hand, `Knuckles_${side}`, materials.skin, [0.025, 0.025, 0.043], [0.025, -0.073, 0]);
    sculpt(hip, `UpperLeg_${side}`, materials.cloth, body.thigh);
    // Small front patches, not the previous thick rings around each knee.
    sculpt(knee, `KneeCap_${side}`, materials.leather, body.knee);
    roundDetail(knee, `KneeJoint_${side}`, materials.cloth, [0.056, 0.057, 0.056], [0, 0, 0]);
    sculpt(knee, `LowerLeg_${side}`, materials.cloth, body.shin);
    sculpt(knee, `BootShaft_${side}`, materials.leather, body.bootShaft);
    sculpt(joints[`Ankle_${side}`], `Foot_${side}`, materials.leather, body.foot);
    roundDetail(joints[`Ankle_${side}`], `AnkleJoint_${side}`, materials.leather, [0.046, 0.06, 0.049], [0, 0, 0]);
  }

  const grip = new Group();
  grip.name = 'WeaponGrip';
  grip.position.set(0.015, -0.035, 0);
  // Keep the hammer upright while bringing the hand further forward in profile.
  grip.rotation.z = -(REST_POSE.shoulderR + REST_POSE.elbowR);
  grip.add(createHammer(materials));
  joints.Hand_R.add(grip);
  root.scale.setScalar(scale);
  let disposed = false;
  return {
    ...rig,
    dispose() {
      if (disposed) return;
      disposed = true;
      root.removeFromParent();
      disposeObject(root);
    },
  };
}
```

## hammer-warrior/proportions.ts

```ts
import type { ProfileRing } from '../shared/geometry';

export const HEIGHT_RANGE = { min: 1.2, max: 2.4, step: 0.05 } as const;
export const DEFAULT_HEIGHT = 1.8;

/** Dimensions in metres at the reference height. +Y up, facing +X. */
export const PROPORTIONS = {
  hipsY: 0.94,
  hipSpacing: 0.12,
  shoulderY: 0.49,
  shoulderSpacing: 0.215,
  upperArm: 0.29,
  forearm: 0.26,
  thigh: 0.40,
  shin: 0.40,
  ankleY: 0.14,
} as const;

/** Rest angles in radians. Kept together so the weapon can counter the grip angle. */
export const REST_POSE = {
  shoulderR: 0.42,
  elbowR: 1.02,
  shoulderL: -0.14,
  elbowL: 0.20,
} as const;

/** Elliptical sections: masculine shoulders, fitted jacket, trousers and tall boots. */
export const BODY_PROFILES = {
  pelvis: [[-0.12, 0.05, 0.09, 0, 0.07], [-0.075, 0.095, 0.155, 0, 0.13], [-0.015, 0.108, 0.17, 0, 0.135], [0.065, 0.10, 0.15, 0, 0.11]],
  belt: [[0.055, 0.105, 0.153, 0, 0.115], [0.065, 0.111, 0.158, 0, 0.12], [0.09, 0.109, 0.156, 0, 0.118], [0.10, 0.102, 0.15, 0, 0.11]],
  abdomen: [[-0.025, 0.104, 0.15, 0, 0.112], [0.055, 0.098, 0.14, 0, 0.10], [0.14, 0.114, 0.16, 0, 0.105], [0.235, 0.133, 0.185, 0, 0.115]],
  chest: [[0.09, 0.103, 0.15, 0, 0.106], [0.17, 0.12, 0.172, 0, 0.115], [0.255, 0.154, 0.21, 0, 0.125], [0.325, 0.16, 0.227, 0, 0.13], [0.375, 0.138, 0.223, 0, 0.12], [0.41, 0.09, 0.17, -0.004, 0.09], [0.455, 0.058, 0.07, -0.005, 0.065]],
  shirtFront: [[0.10, 0.008, 0.037, 0.105], [0.19, 0.01, 0.045, 0.132], [0.275, 0.01, 0.06, 0.157], [0.33, 0.01, 0.065, 0.16], [0.39, 0.008, 0.04, 0.12], [0.425, 0.007, 0.022, 0.075]],
  lapel: [[0.235, 0.01, 0.012, 0.158], [0.30, 0.015, 0.025, 0.15], [0.37, 0.014, 0.027, 0.123], [0.41, 0.009, 0.014, 0.085]],
  neck: [[-0.055, 0.052, 0.057], [-0.015, 0.058, 0.061], [0.035, 0.056, 0.059], [0.07, 0.05, 0.054]],
  head: [[-0.045, 0.038, 0.055, 0.025], [-0.025, 0.065, 0.075, 0.023], [0.015, 0.09, 0.091, 0.012], [0.065, 0.102, 0.104], [0.11, 0.102, 0.103, -0.006], [0.155, 0.093, 0.096, -0.012], [0.185, 0.069, 0.079, -0.018], [0.20, 0.033, 0.048, -0.018]],
  nose: [[0.038, 0.007, 0.014, 0.104], [0.055, 0.021, 0.02, 0.115], [0.075, 0.015, 0.016, 0.113], [0.105, 0.006, 0.011, 0.099]],
  hair: [[0.135, 0.095, 0.101, -0.012], [0.17, 0.10, 0.107, -0.018], [0.20, 0.081, 0.094, -0.018], [0.22, 0.036, 0.055, -0.02]],
  hairBack: [[0.015, 0.009, 0.056, -0.083], [0.065, 0.019, 0.086, -0.089], [0.12, 0.024, 0.096, -0.082], [0.16, 0.023, 0.086, -0.071]],
  shoulder: [[-0.115, 0.061, 0.061], [-0.07, 0.082, 0.079, 0, 0.073], [-0.02, 0.086, 0.088, 0, 0.078], [0.035, 0.065, 0.077], [0.06, 0.032, 0.04]],
  upperArm: [[-PROPORTIONS.upperArm - 0.025, 0.044, 0.047], [-0.24, 0.054, 0.054, 0, 0.062], [-0.175, 0.072, 0.062, 0.004, 0.067], [-0.10, 0.078, 0.07, 0, 0.069], [-0.035, 0.074, 0.076], [0.025, 0.058, 0.062]],
  cuff: [[-0.055, 0.059, 0.061], [-0.045, 0.067, 0.067], [-0.005, 0.067, 0.067], [0.01, 0.056, 0.059]],
  forearm: [[-PROPORTIONS.forearm - 0.02, 0.028, 0.036], [-0.215, 0.033, 0.041], [-0.15, 0.047, 0.052, -0.003, 0.045], [-0.08, 0.06, 0.061, -0.004, 0.054], [-0.025, 0.052, 0.056], [0.025, 0.043, 0.047]],
  hand: [[-0.098, 0.018, 0.034, 0.012], [-0.08, 0.029, 0.046, 0.012], [-0.035, 0.032, 0.045, 0.008], [0.005, 0.028, 0.035], [0.025, 0.025, 0.031]],
  thigh: [[-PROPORTIONS.thigh - 0.025, 0.052, 0.055], [-0.325, 0.065, 0.066, 0.005, 0.061], [-0.23, 0.088, 0.081, 0.005, 0.073], [-0.13, 0.102, 0.094, 0, 0.095], [-0.045, 0.098, 0.103, 0, 0.115], [0.045, 0.075, 0.085, 0, 0.091]],
  knee: [[-0.045, 0.006, 0.018, 0.055], [-0.02, 0.012, 0.032, 0.057], [0.015, 0.013, 0.032, 0.057], [0.04, 0.006, 0.018, 0.055]],
  shin: [[-PROPORTIONS.shin - 0.02, 0.034, 0.043], [-0.31, 0.038, 0.047, 0, 0.048], [-0.22, 0.048, 0.06, 0, 0.074], [-0.135, 0.052, 0.068, 0, 0.083], [-0.045, 0.054, 0.059], [0.025, 0.051, 0.055]],
  bootShaft: [[-0.425, 0.046, 0.049], [-0.34, 0.043, 0.049, 0, 0.051], [-0.25, 0.051, 0.06, 0, 0.073], [-0.185, 0.055, 0.069, 0, 0.084], [-0.16, 0.056, 0.07, 0, 0.085]],
  foot: [[-PROPORTIONS.ankleY, 0.108, 0.06, 0.05], [-0.125, 0.13, 0.072, 0.06], [-0.095, 0.14, 0.075, 0.064], [-0.055, 0.132, 0.075, 0.06], [-0.01, 0.095, 0.065, 0.025], [0.045, 0.058, 0.055, -0.006], [0.075, 0.05, 0.051, -0.008]],
} as const satisfies Record<string, readonly ProfileRing[]>;

export function heightScale(height: number) {
  if (!Number.isFinite(height)) throw new Error('Character height must be finite.');
  return Math.min(HEIGHT_RANGE.max, Math.max(HEIGHT_RANGE.min, height)) / DEFAULT_HEIGHT;
}
```

## hammer-warrior/rig.ts

```ts
import { Group, MathUtils, type Object3D } from 'three';
import { JOINT_NAMES, type CharacterAsset, type JointName, type JointPose } from '../types';
import { PROPORTIONS as p, REST_POSE } from './proportions';

export function createRig() {
  const root = new Group();
  root.name = 'CharacterRoot';
  const joints = {} as Record<JointName, Group>;
  function joint(name: JointName, parent: Object3D, x: number, y: number, z: number) {
    const node = new Group();
    node.name = name;
    node.position.set(x, y, z);
    parent.add(node);
    joints[name] = node;
    return node;
  }

  const hips = joint('Hips', root, 0, p.hipsY, 0);
  const torso = joint('Torso', hips, 0, 0.10, 0);
  const neck = joint('Neck', torso, 0, 0.49, 0);
  joint('Head', neck, 0.015, 0.05, 0);
  for (const side of ['L', 'R'] as const) {
    const sign = side === 'R' ? 1 : -1;
    const shoulder = joint(`Shoulder_${side}`, torso, 0, p.shoulderY - 0.10, sign * p.shoulderSpacing);
    const elbow = joint(`Elbow_${side}`, shoulder, 0, -p.upperArm, 0);
    joint(`Hand_${side}`, elbow, 0, -p.forearm, 0);
    const hip = joint(`Hip_${side}`, hips, sign * 0.055, 0, sign * p.hipSpacing);
    const knee = joint(`Knee_${side}`, hip, 0, -p.thigh, 0);
    joint(`Ankle_${side}`, knee, 0, -p.shin, 0);
  }

  // Arms are separated in profile. The near hand holds the hammer forward.
  joints.Shoulder_R.rotation.z = REST_POSE.shoulderR;
  joints.Elbow_R.rotation.z = REST_POSE.elbowR;
  joints.Shoulder_L.rotation.z = REST_POSE.shoulderL;
  joints.Elbow_L.rotation.z = REST_POSE.elbowL;
  const rest = new Map(JOINT_NAMES.map((name) => [name, joints[name].quaternion.clone()]));
  const positions = new Map(JOINT_NAMES.map((name) => [name, joints[name].position.clone()]));
  const resetPose = () => {
    for (const name of JOINT_NAMES) {
      joints[name].quaternion.copy(rest.get(name)!);
      joints[name].position.copy(positions.get(name)!);
    }
  };
  return { root, joints, resetPose };
}

/** Debug offsets in degrees about local Z; these are not animation clips. */
export function applyJointPose(asset: CharacterAsset, pose: JointPose) {
  asset.resetPose();
  for (const name of JOINT_NAMES) {
    const degrees = pose[name];
    if (degrees !== undefined && Number.isFinite(degrees)) {
      asset.joints[name].rotateZ(MathUtils.degToRad(degrees));
    }
  }
}
```

## hammer-warrior/inspectionPoses.ts

```ts
import { Box3, MathUtils } from 'three';
import type { CharacterAsset, JointName, JointPose } from '../types';

export const INSPECTION_POSES = [
  { id: 'rest', label: 'Reposo' },
  { id: 'prepare', label: 'Preparación' },
  { id: 'raised', label: 'Martillo elevado' },
  { id: 'crouch', label: 'Agachado' },
] as const;
export type InspectionPose = (typeof INSPECTION_POSES)[number]['id'];
type Rotation = readonly [x: number, y: number, z: number];
const POSES: Record<InspectionPose, Partial<Record<JointName, Rotation>>> = {
  rest: { Hand_R: [0, 0, -22], Hip_L: [0, 0, 9], Knee_L: [0, 0, -9], Ankle_L: [0, 0, 0] },
  prepare: {
    Torso: [0, -8, -10], Shoulder_R: [-10, 0, 70], Elbow_R: [0, 0, 42],
    Shoulder_L: [12, 0, 28], Elbow_L: [0, 0, 65],
    Hip_R: [0, 0, 30], Knee_R: [0, 0, -40], Ankle_R: [0, 0, 10],
    Hip_L: [0, 0, -12], Knee_L: [0, 0, -12], Ankle_L: [0, 0, 24],
  },
  raised: {
    Torso: [0, 0, 5], Shoulder_R: [-12, 0, 150], Elbow_R: [0, 0, 25],
    Shoulder_L: [18, 0, 45], Elbow_L: [0, 0, 75],
    Hip_L: [0, 0, 12], Knee_L: [0, 0, -12],
  },
  crouch: {
    Torso: [0, 0, -18], Head: [0, 0, 12],
    Shoulder_R: [-8, 0, 65], Elbow_R: [0, 0, 45],
    Shoulder_L: [12, 0, 38], Elbow_L: [0, 0, 55],
    Hip_R: [0, 0, 52], Knee_R: [0, 0, -104], Ankle_R: [0, 0, 52],
    Hip_L: [0, 0, 45], Knee_L: [0, 0, -90], Ankle_L: [0, 0, 45],
  },
};

/** Static inspection only: absolute preset rotations followed by manual local-Z offsets. */
export function applyInspectionPose(asset: CharacterAsset, preset: InspectionPose, offsets: JointPose) {
  asset.resetPose();
  for (const [name, rotation] of Object.entries(POSES[preset])) {
    asset.joints[name as JointName].rotation.set(...rotation.map(MathUtils.degToRad) as [number, number, number]);
  }
  // Ground each leg independently before lowering the shared pelvis. No runtime IK.
  asset.root.updateMatrixWorld(true);
  const feet = (['L', 'R'] as const).map((side) => {
    const foot = asset.root.getObjectByName(`Foot_${side}`)!;
    return { side, floor: new Box3().setFromObject(foot).min.y / asset.root.scale.y };
  });
  const floor = Math.min(...feet.map((foot) => foot.floor));
  asset.joints.Hips.position.y -= floor;
  for (const foot of feet) asset.joints[`Hip_${foot.side}`].position.y -= foot.floor - floor;
  for (const [name, degrees] of Object.entries(offsets)) {
    if (Number.isFinite(degrees)) asset.joints[name as JointName].rotateZ(MathUtils.degToRad(degrees!));
  }
  asset.root.updateMatrixWorld(true);
}
```

## hammer-warrior/equipment.ts

```ts
import { CylinderGeometry, Group, Mesh } from 'three';
import type { WarriorMaterials } from '../shared/materials';
import { createProfileGeometry } from '../shared/geometry';

/** Origin is the grip. The handle runs along local Y. */
export function createHammer(materials: WarriorMaterials) {
  const hammer = new Group();
  hammer.name = 'Hammer';
  const handle = new Mesh(new CylinderGeometry(0.022, 0.026, 0.72, 8), materials.leather);
  handle.name = 'Hammer_Handle';
  handle.position.y = 0.22;
  const head = new Mesh(createProfileGeometry([
    [-0.11, 0.17, 0.085], [-0.075, 0.205, 0.115],
    [0.075, 0.205, 0.115], [0.11, 0.17, 0.085],
  ]), materials.steel);
  head.name = 'Hammer_Head';
  head.position.y = 0.56;
  const band = new Mesh(createProfileGeometry([
    [-0.12, 0.035, 0.09], [-0.085, 0.05, 0.122],
    [0.085, 0.05, 0.122], [0.12, 0.035, 0.09],
  ]), materials.gold);
  band.name = 'Hammer_Band';
  band.position.y = 0.56;
  hammer.add(handle, head, band);
  return hammer;
}
```

## hammer-warrior/index.ts

```ts
export { createCharacter } from './createCharacter';
export { applyJointPose } from './rig';
export { DEFAULT_HEIGHT, HEIGHT_RANGE, heightScale } from './proportions';
```

## shared/geometry.ts

```ts
import { BufferGeometry, Float32BufferAttribute } from 'three';

/** Horizontal section: Y, front radius, half-width in Z, X offset, optional back radius. */
export type ProfileRing = readonly [y: number, depth: number, width: number, x?: number, backDepth?: number];

export type ProfileOptions = { section?: 'bevel' | 'ellipse'; segments?: number };

/** Elliptical anatomy has smooth sides and separate flat caps; bevelled equipment stays faceted. */
export function createProfileGeometry(rings: readonly ProfileRing[], options: ProfileOptions = {}): BufferGeometry {
  if (rings.length < 2) throw new Error('A profile requires at least two rings.');
  const smooth = options.section === 'ellipse';
  const segments = options.segments ?? 12;
  if (!Number.isInteger(segments) || segments < 8 || segments > 32) {
    throw new Error('Profile segments must be an integer between 8 and 32.');
  }
  const outline = smooth ? Array.from({ length: segments }, (_, index) => {
    const angle = index / segments * Math.PI * 2;
    return [Math.cos(angle), Math.sin(angle)];
  }) : [
    [1, 0.55], [0.55, 1], [-0.55, 1], [-1, 0.55],
    [-1, -0.55], [-0.55, -1], [0.55, -1], [1, -0.55],
  ];
  const count = outline.length;
  const positions: number[] = [];
  const indices: number[] = [];
  rings.forEach(([y, depth, width, x = 0, backDepth = depth], ring) => {
    if (![y, depth, width, x, backDepth].every(Number.isFinite) || depth <= 0 || width <= 0 || backDepth <= 0) {
      throw new Error('Profile dimensions must be finite and radii positive.');
    }
    if (ring > 0 && y <= rings[ring - 1][0]) throw new Error('Profile rings must ascend in Y.');
    for (const [dx, dz] of outline) positions.push(x + dx * (dx < 0 ? backDepth : depth), y, dz * width);
    if (ring === 0) return;
    for (let side = 0; side < count; side++) {
      const next = (side + 1) % count;
      const a = (ring - 1) * count + side;
      const b = (ring - 1) * count + next;
      const c = ring * count + next;
      const d = ring * count + side;
      indices.push(a, d, c, a, c, b);
    }
  });
  for (const [ring, top] of [[0, false], [rings.length - 1, true]] as const) {
    const [y, depth, width, x = 0, backDepth = depth] = rings[ring];
    // Duplicate cap rim so the side's normals never average with a horizontal cap.
    const rim = positions.length / 3;
    for (const [dx, dz] of outline) positions.push(x + dx * (dx < 0 ? backDepth : depth), y, dz * width);
    const center = positions.length / 3;
    positions.push(x, y, 0);
    for (let side = 0; side < count; side++) {
      const a = rim + side;
      const b = rim + (side + 1) % count;
      indices.push(...(top ? [center, b, a] : [center, a, b]));
    }
  }
  const indexed = new BufferGeometry();
  indexed.setAttribute('position', new Float32BufferAttribute(positions, 3));
  indexed.setIndex(indices);
  const geometry = smooth ? indexed : indexed.toNonIndexed();
  if (!smooth) indexed.dispose();
  geometry.computeVertexNormals();
  return geometry;
}
```

## shared/materials.ts

```ts
import { MeshStandardMaterial } from 'three';

/** No global instances: resources belong to the character that creates them. */
export function createWarriorMaterials() {
  return {
    skin: new MeshStandardMaterial({ color: '#c99872', roughness: 0.85 }),
    jacket: new MeshStandardMaterial({ color: '#935138', roughness: 0.8 }),
    shirt: new MeshStandardMaterial({ color: '#d4c1a0', roughness: 1 }),
    cloth: new MeshStandardMaterial({ color: '#454956', roughness: 1 }),
    leather: new MeshStandardMaterial({ color: '#60422f', roughness: 0.9 }),
    hair: new MeshStandardMaterial({ color: '#705039', roughness: 1 }),
    face: new MeshStandardMaterial({ color: '#29201b', roughness: 1 }),
    steel: new MeshStandardMaterial({ color: '#a5afb0', roughness: 0.55, metalness: 0.45, flatShading: true }),
    gold: new MeshStandardMaterial({ color: '#b59552', roughness: 0.65, metalness: 0.3, flatShading: true }),
  };
}

export type WarriorMaterials = ReturnType<typeof createWarriorMaterials>;
```

## shared/dispose.ts

```ts
import { BufferGeometry, Material, type Object3D } from 'three';

/** Each asset owns its resources. Shared geometry/materials are disposed once. */
export function disposeObject(root: Object3D) {
  const geometries = new Set<BufferGeometry>();
  const materials = new Set<Material>();
  root.traverse((object) => {
    const renderable = object as Object3D & {
      geometry?: BufferGeometry;
      material?: Material | Material[];
    };
    if (renderable.geometry) geometries.add(renderable.geometry);
    if (renderable.material) {
      const list = Array.isArray(renderable.material) ? renderable.material : [renderable.material];
      list.forEach((material) => materials.add(material));
    }
  });
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
}
```

## types.ts

```ts
import type { Group } from 'three';

export const JOINT_NAMES = [
  'Hips', 'Torso', 'Neck', 'Head',
  'Shoulder_L', 'Elbow_L', 'Hand_L',
  'Shoulder_R', 'Elbow_R', 'Hand_R',
  'Hip_L', 'Knee_L', 'Ankle_L',
  'Hip_R', 'Knee_R', 'Ankle_R',
] as const;

export type JointName = (typeof JOINT_NAMES)[number];
export type JointPose = Partial<Record<JointName, number>>;

/** Rigid articulated meshes, not a Bone/SkinnedMesh skeleton. */
export interface CharacterAsset {
  root: Group;
  joints: Record<JointName, Group>;
  resetPose: () => void;
  dispose: () => void;
}
```

## components/studio/StudioClient.tsx

```tsx
'use client';

import dynamic from 'next/dynamic';
import { useCallback, useRef, useState } from 'react';
import { DEFAULT_HEIGHT } from '@/lib/characters/hammer-warrior/proportions';
import type { JointName, JointPose } from '@/lib/characters/types';
import type { CameraRequest } from './CharacterViewport';
import { CharacterControls } from './CharacterControls';
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
      <div className={styles.studioGrid}>
        <section className={styles.viewportCard} aria-label="Vista previa 3D">
          <div className={styles.viewportTopline}>
            <div className={styles.viewportLabel}><span className={styles.liveDot} /> SCENE VIEWPORT <span className={styles.divider}>/</span> <span className={styles.muted}>HAMMER WARRIOR</span></div>
            <div className={styles.viewBadges}><span>ORTHOGRAPHIC</span><span>{activeView === 'profile' ? 'PROFILE · +Z' : activeView === 'front' ? 'FRONT · +X' : activeView === 'quarter' ? 'THREE QUARTERS' : 'ORBIT'}</span></div>
          </div>
          <div className={styles.viewportStage}>
            <CharacterViewport cameraRequest={cameraRequest} height={height} pose={pose}
              showRig={showRig} onOrbitStart={onOrbitStart} inspectionPose={inspectionPose}
              previewCanvases={previewCanvases} silhouette={silhouette} />
            <div className={styles.axisLegend}><span>+X</span> FACING <i /> <span>+Y</span> UP</div>
            <div className={styles.viewportCorner}>01 <span>/</span> 01</div>
          </div>
          <div className={styles.viewportToolbar}>
            <div className={styles.toolbarGroup}>
              {(['profile', 'front', 'quarter', 'orbit'] as const).map((view) => (
                <button key={view} className={`${styles.toolButton} ${activeView === view ? styles.toolSelected : ''}`}
                  onClick={() => requestView(view)} aria-pressed={activeView === view}>
                  {{ profile: 'Lateral', front: 'Frontal', quarter: 'Tres cuartos', orbit: 'Órbita' }[view]}
                </button>
              ))}
            </div>
            <span className={styles.toolbarHint}>DRAG TO ORBIT · SCROLL TO ZOOM</span>
          </div>
          <PixelPreviewPanel canvases={previewCanvases} silhouette={silhouette} onSilhouetteChange={setSilhouette} />
        </section>
        <CharacterControls height={height} showRig={showRig} selectedJoint={selectedJoint} pose={pose}
          inspectionPose={inspectionPose} onInspectionPoseChange={(preset) => { setInspectionPose(preset); setPose({}); }}
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
```

## components/studio/CharacterViewport.tsx

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Grid, OrbitControls } from '@react-three/drei';
import { AxesHelper, Group, Mesh, MeshBasicMaterial, SphereGeometry } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { createCharacter, heightScale } from '@/lib/characters/hammer-warrior';
import { applyInspectionPose, type InspectionPose } from '@/lib/characters/hammer-warrior/inspectionPoses';
import { PixelCapture, type PreviewCanvases } from './PixelPreview';
import { JOINT_NAMES, type CharacterAsset, type JointPose } from '@/lib/characters/types';
import { disposeObject } from '@/lib/characters/shared/dispose';
import styles from '@/app/page.module.css';

export type CameraRequest = { view: 'profile' | 'front' | 'quarter' | 'orbit'; revision: number };

type ViewportProps = {
  cameraRequest: CameraRequest;
  height: number;
  pose: JointPose;
  showRig: boolean;
  inspectionPose: InspectionPose;
  previewCanvases: PreviewCanvases;
  silhouette: boolean;
  onOrbitStart: () => void;
};

function CameraPreset({ request, height }: { request: CameraRequest; height: number }) {
  const { camera, controls, size } = useThree();
  useEffect(() => {
    const orbit = controls as OrbitControlsImpl | null;
    const target = [0.12 * height / 1.8, height * 0.72, 0] as const;
    // reset() also clears pending damping left over from a drag.
    orbit?.reset();
    if (request.view === 'profile') camera.position.set(target[0], target[1], 8);
    else if (request.view === 'front') camera.position.set(8, target[1], 0);
    else if (request.view === 'quarter') camera.position.set(6, target[1] + 0.5, 6);
    else camera.position.set(4.5, 3, 6);
    // Three.js cameras are mutable scene objects; update them only in effects.
    // eslint-disable-next-line react-hooks/immutability
    camera.zoom = Math.min(size.width / (height * 1.65), size.height / (height * 1.65));
    camera.lookAt(...target);
    camera.updateProjectionMatrix();
    orbit?.target.set(...target);
    orbit?.update();
  }, [camera, controls, request, size.width, size.height, height]);
  return null;
}

function CharacterModel({ height, pose, showRig, inspectionPose, previewCanvases, silhouette }: Omit<ViewportProps, 'cameraRequest' | 'onOrbitStart'>) {
  // Only an empty host is allocated during render. Geometry is owned by the effect,
  // so Strict Mode setup → cleanup → setup never reuses disposed resources.
  const [host] = useState(() => new Group());
  const assetRef = useRef<CharacterAsset | null>(null);
  const debugRef = useRef<Group | null>(null);

  useEffect(() => {
    const asset = createCharacter();
    const debug = new Group();
    debug.name = 'ViewportJointDebug';
    const geometry = new SphereGeometry(0.018, 8, 6);
    const material = new MeshBasicMaterial({ color: '#ffce64', depthTest: false });
    for (const name of JOINT_NAMES) {
      const marker = new Group();
      marker.name = name;
      const dot = new Mesh(geometry, material);
      dot.renderOrder = 10;
      const axes = new AxesHelper(0.1);
      const axesMaterials = Array.isArray(axes.material) ? axes.material : [axes.material];
      axesMaterials.forEach((entry) => { entry.depthTest = false; });
      axes.renderOrder = 10;
      marker.add(dot, axes);
      debug.add(marker);
    }
    // Siblings, not children: debug aids never belong to the exportable root.
    host.add(asset.root, debug);
    assetRef.current = asset;
    debugRef.current = debug;
    return () => {
      assetRef.current = null;
      debugRef.current = null;
      asset.dispose();
      debug.removeFromParent();
      disposeObject(debug);
    };
  }, [host]);

  useEffect(() => {
    const asset = assetRef.current;
    const debug = debugRef.current;
    if (!asset || !debug) return;
    asset.root.scale.setScalar(heightScale(height));
    applyInspectionPose(asset, inspectionPose, pose);
    asset.root.updateMatrixWorld(true);
    debug.visible = showRig;
    for (const name of JOINT_NAMES) {
      const marker = debug.getObjectByName(name)!;
      asset.joints[name].getWorldPosition(marker.position);
      asset.joints[name].getWorldQuaternion(marker.quaternion);
    }
  }, [height, pose, showRig, inspectionPose]);

  return <><primitive object={host} dispose={null} />
    <PixelCapture assetRef={assetRef} canvases={previewCanvases} height={height}
      silhouette={silhouette} revision={`${inspectionPose}:${JSON.stringify(pose)}`} /></>;
}

export function CharacterViewport({ cameraRequest, onOrbitStart, ...modelProps }: ViewportProps) {
  return (
    <div className={styles.canvasContainer}>
      <Canvas orthographic dpr={[1, 1.5]}
        camera={{ position: [0.2, 1.18, 8], zoom: 140, near: 0.1, far: 100 }}
        gl={{ antialias: true, alpha: false }}>
        <color attach="background" args={['#0b121c']} />
        <ambientLight intensity={1.25} />
        <directionalLight position={[3, 6, 5]} intensity={2.2} color="#e0f0ff" />
        <directionalLight position={[-4, 2, -4]} intensity={0.8} color="#4d9bd3" />
        <CharacterModel {...modelProps} />
        <Grid position={[0, -0.005, 0]} args={[12, 12]} cellSize={0.25}
          cellThickness={0.5} cellColor="#273e55" sectionSize={1}
          sectionThickness={0.8} sectionColor="#355979" fadeDistance={12}
          fadeStrength={1.5} infiniteGrid />
        <OrbitControls makeDefault target={[0.2, 1.18, 0]} enableDamping
          dampingFactor={0.08} enablePan={false} minZoom={35} maxZoom={400}
          onStart={onOrbitStart} />
        <CameraPreset request={cameraRequest} height={modelProps.height} />
      </Canvas>
    </div>
  );
}
```

## components/studio/CharacterControls.tsx

```tsx
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
```

## components/studio/PixelPreview.tsx

```tsx
'use client';

import { useEffect, useRef, type RefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Color, Matrix4, MeshBasicMaterial, OrthographicCamera, SRGBColorSpace, Vector3, WebGLRenderTarget } from 'three';
import type { CharacterAsset } from '@/lib/characters/types';
import styles from '@/app/page.module.css';

export type PreviewCanvases = RefObject<(HTMLCanvasElement | null)[]>;
const PIXEL_SIZES = [64, 96] as const;

export function PixelPreviewPanel({ canvases, silhouette, onSilhouetteChange }: {
  canvases: PreviewCanvases; silhouette: boolean; onSilhouetteChange: (value: boolean) => void;
}) {
  return <section className={styles.pixelPanel} aria-labelledby="pixel-heading">
    <div className={styles.pixelHeader}>
      <h2 id="pixel-heading">Prueba de lectura pixel art</h2>
      <label className={styles.checkRow}><input type="checkbox" checked={silhouette}
        onChange={(event) => onSilhouetteChange(event.target.checked)} />Silueta</label>
    </div>
    <p className={styles.controlHelp}>64 / 96 px de altura en reposo · ampliación ×2 sin suavizado · misma orientación que el visor.</p>
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
export function PixelCapture({ assetRef, canvases, height, silhouette, revision }: {
  assetRef: RefObject<CharacterAsset | null>; canvases: PreviewCanvases;
  height: number; silhouette: boolean; revision: string;
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
  useEffect(() => { if (resources.current) resources.current.dirty = true; }, [height, silhouette, revision]);
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
    const center = new Vector3(0.12 * height / 1.8, height * 0.73, 0);
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
        const half = target.height / (PIXEL_SIZES[index] / height) / 2;
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
```

## app/page.tsx

```tsx
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
               <strong>Anatomy & pose inspection</strong>
               <small>Phase B.2 <span>·</span> Visual validation</small>
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
             <div className={styles.phasePill}><span>B.2</span> ANATOMY <b>·</b> INSPECTION</div>
          </div>

          <StudioClient />
        </section>
      </div>
    </main>
  );
}
```

## app/layout.tsx

```tsx
import { Geist, Geist_Mono } from "next/font/google";
import type { Metadata } from "next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Form/Forge — Procedural Character Studio",
  description: "A focused workspace for building procedural 3D characters.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

## app/globals.css

```css
@import "tailwindcss";

:root {
  color-scheme: dark;
  --background: #080c12;
  --foreground: #e8eef7;
}

html {
  min-height: 100%;
}

html,
body {
  max-width: 100vw;
  overflow-x: hidden;
}

body {
  min-height: 100%;
  color: var(--foreground);
  background: var(--background);
  font-family: Arial, Helvetica, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

* {
  box-sizing: border-box;
  padding: 0;
  margin: 0;
}

a {
  color: inherit;
  text-decoration: none;
}
```

## app/page.module.css

```css
.workspace {
  --ink: #080c12;
  --panel: #0d131d;
  --panel-raised: #111a27;
  --line: rgba(157, 180, 207, 0.12);
  --line-strong: rgba(157, 180, 207, 0.2);
  --text: #e8eef7;
  --muted: #77869a;
  --faint: #4d5a6c;
  --blue: #47a9ff;
  --blue-bright: #69bcff;
  display: flex;
  min-height: 100vh;
  flex-direction: column;
  overflow: hidden;
  color: var(--text);
  background: var(--ink);
  font-family: Arial, Helvetica, sans-serif;
}

.workspace * { box-sizing: border-box; }
.workspace button { color: inherit; font: inherit; }
.workspace button:disabled { cursor: default; }

.topbar {
  height: 68px;
  flex: 0 0 68px;
  display: flex;
  align-items: center;
  gap: 34px;
  padding: 0 26px;
  border-bottom: 1px solid var(--line);
  background: #0a0f17;
}

.brand { display: flex; min-width: 215px; align-items: center; gap: 11px; color: var(--text); text-decoration: none; }
.mark { width: 31px; height: 31px; fill: none; stroke: var(--blue); stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.35; filter: drop-shadow(0 0 5px #238bdb66); }
.brandText { display: flex; flex-direction: column; gap: 3px; }
.brandText strong { font-size: 12px; letter-spacing: .16em; }
.brandText strong span { color: var(--blue); }
.brandText small { color: var(--muted); font-size: 8px; letter-spacing: .13em; }
.projectName { display: flex; align-items: center; gap: 10px; color: #aebacc; font-size: 12px; }
.breadcrumb, .breadcrumbSlash { color: var(--faint); font-size: 9px; letter-spacing: .12em; }
.unsavedDot { width: 5px; height: 5px; border-radius: 50%; background: var(--blue); box-shadow: 0 0 8px #47a9ff99; }
.topbarActions { display: flex; align-items: center; gap: 14px; margin-left: auto; }
.localBadge { display: flex; align-items: center; gap: 7px; color: #98a7b9; font-size: 9px; letter-spacing: .08em; }
.localBadge > span { width: 6px; height: 6px; border-radius: 50%; background: #5c88b5; }
.saveButton { height: 32px; padding: 0 9px 0 12px; border: 1px solid var(--line-strong); border-radius: 5px; background: #101722; color: #7c899a !important; font-size: 10px !important; }
.saveButton kbd { margin-left: 10px; padding: 3px 4px; border: 1px solid var(--line); border-radius: 3px; color: #596779; font-size: 8px; }
.avatar { width: 29px; height: 29px; border: 1px solid #315b7a; border-radius: 50%; background: #102236; color: #9dcfff !important; font-size: 11px !important; }

.bodyLayout { display: flex; flex: 1; min-height: 0; }
.leftRail { width: 214px; flex: 0 0 214px; display: flex; flex-direction: column; justify-content: space-between; padding: 27px 14px 18px; border-right: 1px solid var(--line); background: #0a0f17; }
.railGroup { display: flex; flex-direction: column; gap: 7px; }
.railLabel { padding: 0 10px 9px; color: #536174; font-size: 9px; letter-spacing: .13em; }
.railItem { position: relative; display: flex; height: 39px; align-items: center; gap: 11px; padding: 0 10px; border: 1px solid transparent; border-radius: 5px; color: #8997a9; font-size: 11px; }
.railIcon { width: 15px; color: #71849b; text-align: center; font-size: 14px; }
.railItemActive { border-color: #23527b55; background: linear-gradient(90deg, #12304a88, #10223644); color: #d5eaff; }
.railItemActive .railIcon { color: var(--blue); }
.railItemActive i { position: absolute; top: 9px; bottom: 9px; left: -15px; width: 2px; border-radius: 2px; background: var(--blue); box-shadow: 0 0 9px #47a9ff88; }
.soon { margin-left: auto; color: #526176; font-size: 7px; letter-spacing: .08em; }
.railBottom { display: flex; flex-direction: column; gap: 21px; }
.pipelineCard { padding: 12px 11px; border: 1px solid var(--line); border-radius: 6px; background: #0d141e; }
.pipelineEyebrow { color: #647389; font-size: 8px; letter-spacing: .1em; }
.pipelineTrack { height: 3px; margin: 12px 0 11px; border-radius: 3px; background: #1a2737; }
.pipelineTrack span { display: block; width: 14%; height: 100%; border-radius: 3px; background: var(--blue); box-shadow: 0 0 7px #47a9ff88; }
.pipelineCard strong, .pipelineCard small { display: block; }
.pipelineCard strong { color: #c3cedd; font-size: 10px; font-weight: 500; }
.pipelineCard small { margin-top: 5px; color: #66758a; font-size: 9px; }
.pipelineCard small span { padding: 0 3px; color: var(--blue); }
.railFooter { display: flex; align-items: center; gap: 7px; padding-left: 2px; color: #586679; font-size: 8px; letter-spacing: .08em; }
.onlineDot { width: 5px; height: 5px; border-radius: 50%; background: #4e8bbd; }

.mainArea { display: flex; min-width: 0; flex: 1; flex-direction: column; padding: 27px 30px 0; }
.pageHeading { display: flex; align-items: flex-end; justify-content: space-between; gap: 18px; margin: 0 auto 21px; width: 100%; max-width: 1450px; }
.eyebrow { display: flex; align-items: center; gap: 7px; color: #728197; font-size: 8px; letter-spacing: .15em; }
.eyebrow > span { width: 5px; height: 5px; border-radius: 1px; background: var(--blue); box-shadow: 0 0 7px #47a9ff88; }
.pageHeading h1 { margin-top: 9px; color: #e7edf6; font-size: clamp(22px, 2vw, 29px); font-weight: 500; letter-spacing: -.055em; }
.pageHeading h1 em, .stageCenter h2 em { color: var(--blue-bright); font-style: normal; }
.pageHeading p { margin-top: 6px; color: #77869a; font-size: 11px; }
.phasePill { display: flex; align-items: center; gap: 7px; margin-bottom: 3px; padding: 7px 9px; border: 1px solid #253a50; border-radius: 4px; color: #8ea3ba; font-size: 8px; letter-spacing: .07em; white-space: nowrap; }
.phasePill span { color: var(--blue); }
.phasePill b { color: #52647a; font-weight: 400; }

.studioGrid { display: grid; width: 100%; max-width: 1450px; min-height: 0; flex: 1; grid-template-columns: minmax(0, 1fr) 286px; gap: 14px; margin: 0 auto; }
.viewportCard, .inspector { min-height: 0; overflow: hidden; border: 1px solid var(--line); border-radius: 6px; background: var(--panel); }
.viewportCard { display: flex; flex-direction: column; }
.viewportTopline { display: flex; height: 39px; flex: 0 0 39px; align-items: center; justify-content: space-between; padding: 0 13px; border-bottom: 1px solid var(--line); }
.viewportLabel { display: flex; align-items: center; gap: 7px; color: #aab7c8; font-size: 8px; letter-spacing: .08em; }
.liveDot { width: 5px; height: 5px; border-radius: 50%; background: #3b87c5; box-shadow: 0 0 6px #47a9ff88; }
.divider { margin: 0 1px; color: #3a485a; }
.muted { color: #59687c; }
.viewBadges { display: flex; gap: 6px; }
.viewBadges span { padding: 4px 6px; border: 1px solid #243144; border-radius: 3px; color: #738399; font-size: 7px; letter-spacing: .06em; }
.viewportStage { position: relative; display: block; min-height: 310px; flex: 1; overflow: hidden; isolation: isolate; background-color: #0b121c; background-image: radial-gradient(ellipse at 50% 49%, #15283a 0%, #101b29 32%, #0b121c 75%); }
.canvasContainer { position: absolute; z-index: 0; inset: 0; }
.canvasLoading { position: absolute; inset: 0; display: grid; place-items: center; background: #0b121c; color: #6da4d0; font-size: 8px; letter-spacing: .15em; }
.stageGlow { position: absolute; z-index: -1; top: 10%; left: 50%; width: min(46vw, 520px); height: 75%; transform: translateX(-50%); border-radius: 50%; background: radial-gradient(ellipse, #1676b519, transparent 68%); }
.stageGrid { position: absolute; z-index: -1; inset: 0; opacity: .52; background-image: linear-gradient(#6686a10b 1px, transparent 1px), linear-gradient(90deg, #6686a10b 1px, transparent 1px); background-size: 32px 32px; mask-image: linear-gradient(transparent, #000 17%, #000 82%, transparent); }
.stageAxis { position: absolute; z-index: -1; right: 0; bottom: 24%; left: 0; height: 1px; background: linear-gradient(90deg, transparent, #43617c33 18%, #64809c44 50%, #43617c33 82%, transparent); }
.stageCenter { display: flex; flex-direction: column; align-items: center; padding: 24px; text-align: center; transform: translateY(-4px); }
.cubeWrap { display: grid; width: 55px; height: 55px; margin-bottom: 20px; place-items: center; border: 1px solid #3a79a555; border-radius: 12px; background: linear-gradient(145deg, #18345288, #10213399); box-shadow: 0 0 35px #1e8bd11c, inset 0 0 20px #258bd80d; }
.cubeIcon { width: 31px; height: 31px; fill: none; stroke: #62b8f6; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.25; filter: drop-shadow(0 0 4px #47a9ff55); }
.stageOverline { color: #6da4d0; font-size: 8px; letter-spacing: .19em; }
.stageCenter h2 { margin-top: 11px; color: #dbe5f2; font-size: clamp(19px, 2vw, 26px); font-weight: 500; letter-spacing: -.045em; line-height: 1.22; }
.stageCenter p { margin-top: 10px; color: #75859a; font-size: 10px; }
.createButton { display: flex; align-items: center; gap: 8px; margin-top: 21px; padding: 9px 11px; border: 1px solid #315474; border-radius: 4px; background: #14263a; color: #8ebde5 !important; font-size: 9px !important; }
.createButton > span { color: var(--blue); font-size: 14px; }
.createButton b { margin-left: 3px; padding-left: 9px; border-left: 1px solid #31506c; color: #5f7c98; font-size: 7px; font-weight: 500; letter-spacing: .07em; }
.axisLegend { position: absolute; z-index: 1; bottom: 13px; left: 14px; display: flex; align-items: center; gap: 5px; color: #61758c; font-size: 7px; letter-spacing: .08em; pointer-events: none; }
.axisLegend span { color: #5a9ed4; }
.axisLegend i { width: 14px; height: 1px; margin: 0 2px; background: #5088b355; }
.viewportCorner { position: absolute; z-index: 1; right: 14px; bottom: 13px; color: #8191a5; font-size: 8px; pointer-events: none; }
.viewportCorner span { padding: 0 4px; color: #405065; }
.viewportToolbar { display: flex; height: 43px; flex: 0 0 43px; align-items: center; justify-content: space-between; padding: 0 10px; border-top: 1px solid var(--line); }
.toolbarGroup { display: flex; gap: 4px; }
.toolButton { height: 27px; padding: 0 8px; border: 1px solid transparent; border-radius: 4px; background: transparent; color: #647387 !important; font-size: 9px !important; }
.toolButton:not(:disabled) { cursor: pointer; transition: color .15s ease, background .15s ease, border-color .15s ease; }
.toolButton:not(:disabled):hover { border-color: #294866; color: #b5dfff !important; }
.toolButton span { margin-right: 5px; font-size: 11px; }
.toolSelected { border-color: #294866; background: #122238; color: #92c9f3 !important; }
.toolbarHint { color: #536176; font-size: 7px; letter-spacing: .08em; }
.toolbarHint b { margin-left: 5px; color: #6285a6; font-weight: 500; }
.iconButton { width: 27px; height: 27px; border: 1px solid var(--line); border-radius: 4px; background: transparent; color: #687b92 !important; font-size: 15px !important; }

.inspector { display: flex; flex-direction: column; overflow-y: auto; }
.inspectorHeader { display: flex; align-items: center; justify-content: space-between; padding: 15px 15px 13px; border-bottom: 1px solid var(--line); }
.inspectorHeader .eyebrow { font-size: 7px; }
.inspectorHeader h2 { margin-top: 6px; color: #dbe4ef; font-size: 13px; font-weight: 500; }
.moreButton { width: 27px; height: 27px; border: 1px solid var(--line); border-radius: 4px; background: transparent; color: #77869a !important; font-size: 17px !important; line-height: 1; }
.inspectorSection { padding: 14px 15px; border-bottom: 1px solid var(--line); }
.sectionTitle { display: flex; align-items: center; gap: 7px; margin-bottom: 14px; }
.sectionNumber { color: #4c83ae; font-size: 8px; }
.sectionTitle h2 { color: #8291a5; font-size: 8px; font-weight: 500; letter-spacing: .1em; }
.settingRow { display: flex; align-items: center; justify-content: space-between; color: #9ba9ba; font-size: 9px; }
.value { color: #d7e2ef; font-size: 10px; font-variant-numeric: tabular-nums; }
.value small { color: #718097; font-size: 8px; }
.rangeTrack { height: 3px; margin-top: 11px; border-radius: 4px; background: #233144; }
.rangeTrack span { position: relative; display: block; height: 100%; border-radius: 4px; background: #338ed0; }
.rangeTrack span::after { position: absolute; top: 50%; right: -4px; width: 8px; height: 8px; transform: translateY(-50%); border: 2px solid #8acfff; border-radius: 50%; background: #183047; content: ""; }
.rangeScale { display: flex; justify-content: space-between; margin-top: 6px; color: #59687b; font-size: 7px; }
.settingRowSecond { margin-top: 16px; }
.selectMock { min-width: 106px; display: flex; justify-content: space-between; padding: 6px 8px; border: 1px solid #263547; border-radius: 4px; background: #101925; color: #8292a5 !important; font-size: 8px !important; }
.selectMock span { color: #5c6d82; }
.equipmentCard { display: flex; align-items: center; gap: 9px; padding: 9px; border: 1px dashed #2a3d53; border-radius: 5px; background: #0d1723; }
.equipmentGlyph { display: grid; width: 28px; height: 28px; place-items: center; border: 1px solid #2b4c69; border-radius: 4px; color: #6baee0; font-size: 15px; }
.equipmentCard strong, .equipmentCard small, .animationItem strong, .animationItem small { display: block; }
.equipmentCard strong { color: #aebdce; font-size: 9px; font-weight: 500; }
.equipmentCard small { margin-top: 4px; color: #64748a; font-size: 8px; }
.comingTag { margin-left: auto; color: #57718b; font-size: 7px; letter-spacing: .07em; }
.animationSection { padding-bottom: 12px; }
.animationSection .sectionTitle { margin-bottom: 6px; }
.animationItem { display: flex; min-height: 47px; align-items: center; gap: 9px; border-bottom: 1px solid #1b2635; }
.playGlyph { display: grid; width: 23px; height: 23px; place-items: center; border: 1px solid #2a3b50; border-radius: 4px; color: #6e8198; font-size: 8px; }
.animationItem strong { color: #aebccd; font-size: 8px; font-weight: 500; }
.animationItem small { margin-top: 4px; color: #637287; font-size: 7px; }
.pending { margin-left: auto; color: #60738a; font-size: 6px; letter-spacing: .06em; }
.addAnimation { display: flex; width: 100%; align-items: center; gap: 6px; margin-top: 9px; padding: 7px 0; border: 0; background: transparent; color: #718096 !important; text-align: left; font-size: 8px !important; }
.addAnimation > span { color: #5a9dd1; font-size: 13px; }
.addAnimation small { margin-left: auto; color: #4d5e72; font-size: 6px; }
.inspectorNote { display: flex; gap: 8px; margin: auto 12px 12px; padding: 9px; border: 1px solid #203b53; border-radius: 4px; background: #10203488; }
.inspectorNote > span { display: grid; width: 13px; height: 13px; flex: 0 0 13px; place-items: center; border: 1px solid #4987b8; border-radius: 50%; color: #70b6e9; font-size: 8px; }
.inspectorNote p { color: #788da4; font-size: 8px; line-height: 1.5; }

.bottomBar { display: flex; min-height: 57px; align-items: center; justify-content: space-between; gap: 16px; margin: 13px auto 0; width: 100%; max-width: 1450px; border-top: 1px solid var(--line); }
.bottomStatus { display: flex; align-items: center; gap: 7px; color: #657489; font-size: 7px; letter-spacing: .06em; }
.bottomStatus b { color: #9aa8b8; font-size: 7px; font-weight: 500; }
.bottomStatus i { width: 1px; height: 12px; margin: 0 5px; background: #293546; }
.statusSquare { width: 6px; height: 6px; border: 1px solid #5185ad; border-radius: 1px; }
.bottomActions { display: flex; align-items: center; gap: 7px; }
.secondaryAction, .primaryAction { display: flex; height: 30px; align-items: center; gap: 7px; padding: 0 10px; border: 1px solid #2a3748; border-radius: 4px; background: #101722; color: #8290a2 !important; font-size: 8px !important; }
.secondaryAction > span { color: #719cc0; font-size: 11px; }
.secondaryAction small { color: #586a7e; font-size: 6px; }
.primaryAction { padding: 0 12px; border-color: #265783; background: #17416a; color: #8dcaff !important; }
.primaryAction span { margin-left: 5px; color: #66b7f5; }

.controlHeading { margin: 0 0 14px; color: #8291a5; font-size: 9px; letter-spacing: .1em; font-weight: 500; }
.slider { display: block; width: 100%; margin: 12px 0 6px; accent-color: var(--blue); cursor: pointer; }
.controlHelp { margin-top: 10px; color: #77869a; font-size: 10px; line-height: 1.6; }
.checkRow { display: flex; align-items: center; gap: 8px; color: #aebdce; font-size: 11px; cursor: pointer; }
.checkRow input { accent-color: var(--blue); }
.controlLabel { display: block; margin-top: 14px; color: #9ba9ba; font-size: 10px; }
.jointSelect { width: 100%; margin: 7px 0 15px; padding: 8px; border: 1px solid #263547; border-radius: 4px; background: #101925; color: #d7e2ef; font-size: 11px; }
.resetButton { padding: 7px 10px; border: 1px solid #294866; border-radius: 4px; background: #122238; font-size: 10px !important; cursor: pointer; }
.workspace button:not(:disabled) { cursor: pointer; }
.workspace :is(button, input, select):focus-visible { outline: 2px solid var(--blue-bright); outline-offset: 3px; }

.viewportStage { min-height: 480px; }
.poseButtons { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.poseButtons button { height: auto; min-height: 36px; padding: 8px; border-color: #30475e; color: #b7c9dc !important; font-size: 11px !important; }
.pixelPanel { padding: 16px; border-top: 1px solid var(--line); }
.pixelHeader { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
.pixelHeader h2 { margin: 0; color: #dbe4ef; font-size: 13px; font-weight: 500; }
.pixelSamples { display: flex; flex-wrap: wrap; gap: 20px; align-items: flex-end; margin-top: 16px; }
.pixelSamples figure { margin: 0; max-width: 100%; overflow-x: auto; }
.pixelSamples canvas { display: block; width: 218px; height: 218px; image-rendering: pixelated; background: #15202e; }
.pixelSamples figure:nth-child(2) canvas { width: 328px; height: 328px; }
.pixelSamples figcaption { margin-top: 8px; color: #dbe4ef; font-size: 12px; }
.pixelSamples figcaption span { color: #9aafc7; }
.pixelPanel .controlHelp { color: #a8b9cd; }
.viewportToolbar { height: auto; min-height: 43px; flex-basis: auto; flex-wrap: wrap; gap: 8px; padding: 8px 10px; }
.toolbarGroup { flex-wrap: wrap; }
.toolbarGroup .toolButton { color: #a8b9cd !important; min-height: 32px; }

@media (max-width: 780px) {
  .studioGrid { grid-template-rows: auto auto; }
  .pixelSamples { gap: 16px; }
}
@media (max-width: 400px) {
  .pixelPanel { padding: 10px; }
}

@media (min-width: 1500px) {
  .mainArea { padding-right: 42px; padding-left: 42px; }
  .studioGrid { grid-template-columns: minmax(0, 1fr) 310px; gap: 17px; }
  .viewportStage { min-height: 400px; }
}

@media (max-width: 1050px) {
  .leftRail { width: 178px; flex-basis: 178px; }
  .mainArea { padding-right: 18px; padding-left: 18px; }
  .studioGrid { grid-template-columns: minmax(0, 1fr) 255px; }
  .toolbarHint { display: none; }
}

@media (max-width: 780px) {
  .topbar { height: 58px; flex-basis: 58px; gap: 12px; padding: 0 15px; }
  .brand { min-width: auto; }
  .brandText small, .projectName, .localBadge, .saveButton kbd, .avatar { display: none; }
  .saveButton { height: 29px; }
  .leftRail { display: none; }
  .mainArea { padding: 23px 14px 0; }
  .pageHeading { align-items: flex-start; }
  .phasePill { margin-top: 17px; font-size: 7px; }
  .studioGrid { grid-template-columns: minmax(0, 1fr); grid-template-rows: auto auto; }
  .inspector { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); overflow: visible; }
  .inspectorHeader, .inspectorNote { grid-column: 1 / -1; }
  .inspectorHeader { padding: 12px 14px; }
  .inspectorSection { padding: 12px; }
  .animationSection { grid-column: 1 / -1; }
  .bottomBar { align-items: flex-start; flex-direction: column; padding: 12px 0; }
  .bottomActions { width: 100%; }
  .bottomActions button { flex: 1; justify-content: center; }
}

@media (max-width: 480px) {
  .brandText strong { font-size: 10px; }
  .mark { width: 27px; height: 27px; }
  .pageHeading { flex-direction: column; gap: 10px; }
  .pageHeading p { max-width: 280px; line-height: 1.5; }
  .phasePill { margin-top: 0; }
  .viewBadges span { font-size: 6px; }
  .viewportTopline { padding: 0 9px; }
  .viewportLabel { gap: 5px; font-size: 7px; }
  .viewportStage { min-height: 350px; }
  .stageCenter { padding: 15px; }
  .inspector { grid-template-columns: 1fr; }
  .inspectorHeader, .animationSection, .inspectorNote { grid-column: 1; }
  .secondaryAction, .primaryAction { padding: 0 7px; font-size: 7px !important; }
  .bottomActions { gap: 5px; }
}
```
