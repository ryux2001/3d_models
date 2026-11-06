# Procedural Character Studio

Laboratorio para crear personajes y animaciones mediante código TypeScript/Three.js escrito por cualquier modelo de IA. La web permite inspeccionar el resultado; el entregable final será un GLB con modelo y clips que PixelOver pueda renderizar a pixel art.

## Ejecutar

Requisitos: Node.js 24 LTS y pnpm 12.4.1. Usar la misma versión de pnpm en ambos equipos.
Si no está instalado, ejecutar `npm install --global pnpm@12.4.1`.

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Abrir la URL indicada por Next.js (normalmente http://localhost:3000).

```bash
pnpm exec tsc --noEmit
pnpm lint
pnpm build
pnpm start
```

En PowerShell, si la política de ejecución bloquea `pnpm.ps1`, utilizar `pnpm.cmd` sin cambiar la política del sistema.

Las dependencias quedan fijadas en `pnpm-lock.yaml`, que debe subirse al repositorio. Para añadir paquetes, usar `pnpm add nombre-del-paquete` (o `pnpm add -D nombre-del-paquete` para desarrollo).

Si Next.js no puede cargar SWC nativo y Turbopack falla, usar su alternativa integrada:

```bash
pnpm dev --webpack
pnpm build --webpack
```

## Estado actual: V3.2, refinamiento anatómico + versiones conservadas

El visor abre por defecto **V3.2 · Humanoide**: cuerpo completo en A-pose, con mayor masa en extremidades, pelvis y torso refinados, mandíbula más firme, palmas más estructuradas y pies con arco y antepié diferenciados. Sigue siendo una única superficie continua, sin ropa ni skinning. **V2 · Hammer warrior** conserva su generador y poses. V3.1 permanece reproducible mediante `createAnatomy(1.8, '3.1')` o `createAnatomyV31()`.

- Alternar V2/V3 mantiene la vista. Activar **Encuadre de torso y cabeza** permite comparar la misma región; desactivarlo recupera el encuadre corporal completo.
- V3 usa una malla de control de hitos anatómicos, subdivisión Catmull–Clark propia y desplazamientos guiados por campos y curvas. No utiliza `createProfileGeometry()`.
- **Ver triangulación** y **Mostrar referencias anatómicas** permiten inspeccionar la superficie. Los anclajes V3 todavía no deforman la malla.
- Las miniaturas indican explícitamente su escala: referencia anatómica (60 % de la altura corporal) o cuerpo completo. Comparten orientación, no zoom, con el visor.
- Por defecto se muestra el cuerpo completo con 64/96 px de altura de referencia. La geometría se normaliza a 1,8 m y apoyo en Y = 0; el deslizador aplica después escala uniforme.
- Se conservan 24 bucles etiquetados en la geometría, incluyendo apoyos antes y después de codos y rodillas. Son preparación topológica, no una demostración de deformación mediante skinning.
- V3.2 conserva exactamente los índices de V3.1: 8.458 vértices, 16.912 triángulos y 24 bucles. Las diferencias están en posiciones, sin aumentar subdivisiones ni densidad.
- Ver [medidas, validación e informe para skinning V3.3](ANATOMIA_V3_2.md), [entrega V3.1](ANATOMIA_V3_1.md) y [antecedentes del torso V3](ANATOMIA_V3.md).

Comprobación geométrica reproducible, sin WebGL ni dependencias nuevas:

```bash
pnpm check:anatomy-v3
```

Comprueba también que los diez archivos del generador V2 coinciden con la instantánea de `CONSTRUCCION_HAMMER_WARRIOR.md`. Esa documentación se conserva como referencia B.2; sus componentes de visor representan la versión anterior a la integración V3.

La misma prueba verifica las huellas SHA-256 de posiciones, normales, índices, anclajes y bucles de V3.1 contra `scripts/fixtures/anatomy-v31.json`, y emite medidas comparables de V3.1/V3.2. La fixture es una referencia congelada, no se regenera automáticamente al modificar la anatomía.

### V2: fase B.2, anatomía e inspección visual

- Visor R3F ortográfico con órbita, zoom y accesos a lateral (+Z), frontal (+X) y tres cuartos.
- Guerrero de piezas rígidas generado con Three.js puro, mirando hacia +X.
- Personaje masculino inspirado en la referencia de vestuario: chaqueta corta marrón con mangas remangadas, camiseta clara, pantalones oscuros y botas altas.
- Anatomía con perfiles orgánicos de 12 lados, radios delantero/trasero independientes y normales suaves. Torso, cintura, pelvis y extremidades refinados; manos aplanadas con pulgares espejados y nudillos simplificados.
- Pivotes con nombres estables y martillo unido a la mano derecha.
- Altura entre 1,2 y 2,4 m mediante escala uniforme.
- Depuración de posiciones/ejes y ajustes manuales de giro local Z por articulación.
- Restauración de pose, altura y cámara.
- Cuatro poses estáticas de inspección: reposo, preparación, martillo elevado y agachado. Los ajustes Z se suman al preset; restaurar articulaciones recupera el preset seleccionado.
- Previsualización a 64/96 px de altura corporal de referencia, ampliada ×2 sin suavizado, con modo silueta. Comparte personaje y contexto WebGL; excluye grilla y ayudas.

**Todavía no hay clips de animación, exportación GLB, persistencia ni pruebas en PixelOver.** Los controles futuros permanecen deshabilitados.

## Organización

```text
src/
├── app/                              # Rutas, layout y estilos
├── components/studio/
│   ├── StudioClient.tsx               # Estado de controles y cámara
│   ├── CharacterViewport.tsx          # Canvas, montaje y depuración
│   ├── PixelPreview.tsx               # Miniaturas de baja resolución y silueta
│   ├── AnatomyInspector.tsx           # Inspección del prototipo V3 sin rigging
│   └── CharacterControls.tsx          # Controles del personaje
└── lib/characters/
    ├── types.ts                      # Contrato común y nombres de articulaciones
    ├── anatomy-v3/                   # Malla anatómica continua; independiente de V2
    ├── shared/
    │   ├── geometry.ts                # Perfiles elípticos suaves o biselados
    │   ├── materials.ts               # Materiales propiedad de cada asset
    │   └── dispose.ts                 # Liberación de recursos
    └── hammer-warrior/
        ├── index.ts                  # Entrada pública del personaje
        ├── createCharacter.ts        # Geometría y ensamblaje
        ├── proportions.ts            # Dimensiones, perfiles y ángulos de reposo
        ├── rig.ts                    # Pivotes y pose de reposo
        ├── inspectionPoses.ts        # Poses estáticas, apoyo y offsets manuales
        └── equipment.ts              # Martillo y origen de agarre
```

Las animaciones vivirán en `hammer-warrior/animations/` cuando se implemente la fase C. El exportador y validador comunes irán en `src/lib/io/` durante D.

## Contrato para trabajar con cualquier IA

1. El generador no depende de React, DOM ni WebGL: devuelve `CharacterAsset` con `root`, `joints`, `resetPose()` y `dispose()`.
2. Unidades de referencia: metros; +Y arriba, +X frente, cámara lateral desde +Z; suelo Y = 0 en reposo.
3. Mantener nombres de nodos únicos y estables: serán los destinos de los tracks de animación.
4. El martillo pertenece a `Hand_R → WeaponGrip → Hammer`; las ayudas del visor quedan fuera de `CharacterRoot`.
5. El visor mantiene el asset entre cambios de cámara y controles. La altura modifica la escala, no reconstruye geometrías.
6. Cada instancia posee sus materiales/geometrías y debe liberarlos al desmontarse.
7. Un personaje nuevo tendrá su propia carpeta en `src/lib/characters/`; no crear rutas en `src/app/` para almacenar modelos.

## Prueba manual

Para los pasos de pose y articulaciones siguientes, seleccionar primero **V2 · Hammer warrior**. En V3.2 revisar el humanoide en A-pose desde las cuatro vistas y alternar triangulación, anclajes y silueta. La revisión anatómica no queda aprobada por pasar las comprobaciones automáticas.

1. Orbitar arrastrando y pulsar **Lateral** varias veces: siempre debe recuperar la vista desde +Z.
2. Variar altura: comprobar encuadre y apoyo de los pies en reposo.
3. Activar **Show rig**, elegir hombro/codo/cadera/rodilla y mover **Local Z offset**.
4. Verificar que los segmentos giran desde sus articulaciones y que el martillo sigue la mano.
5. Alternar las cuatro poses y las vistas **Lateral**, **Frontal** y **Tres cuartos**.
6. Usar **Reset all joints**: recupera el preset actual; **Reset character**: vuelve a reposo, 1,8 m y vista lateral.
7. Revisar las miniaturas de 64/96 px en color y con **Silueta**. Cambiar altura no debe alterar su escala corporal relativa; agacharse sí reduce la altura visible.
8. En móvil, bajar hasta las miniaturas y el inspector; las imágenes conservan ampliación ×2 y pueden desplazarse horizontalmente dentro de su figura si falta anchura.

Los giros manuales son solo depuración: no son clips exportables. No hay IK, límites anatómicos específicos ni prevención de intersecciones. El personaje no es `Bone`/`SkinnedMesh`; no se garantiza que PixelOver lo exponga como huesos editables.

La fase B.2 se ha inspeccionado en navegador con WebGL: cuatro poses × tres vistas, miniaturas simultáneas de 64/96 px y móvil de 390 px. La preparación y el agachado tienen siluetas laterales diferenciadas; en reposo las piernas todavía se solapan a 64 px y en preparación/agachado el martillo puede ocultar parte de la cara en tres cuartos. Las manos son masas simplificadas, sin dedos articulados. El apoyo de las poses es una compensación estática de pelvis/caderas, no IK ni una solución para interpolación de combate. Ver [informe B.2](FASE_B2.md).

Consultar [notas del pipeline](docs/notas-pipeline.md) y [guía por fases](docs/GUIA_PIPELINE_THREEJS_CODEX_PIXELOVER.md).
