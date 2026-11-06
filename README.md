# Procedural Character Studio

Laboratorio para crear personajes y animaciones mediante código TypeScript/Three.js escrito por cualquier modelo de IA. La web permite inspeccionar el resultado; el entregable final será un GLB con modelo y clips que PixelOver pueda renderizar a pixel art.

## Ejecutar

```bash
npm install
npm run dev
```

Abrir la URL indicada por Next.js (normalmente http://localhost:3000).

```bash
npx tsc --noEmit
npm run lint
npm run build
npm run start
```

En PowerShell, si la política de ejecución bloquea `npm.ps1` o `npx.ps1`, utilizar `npm.cmd` y `npx.cmd` sin cambiar la política del sistema.

Si Next.js no puede cargar SWC nativo y Turbopack falla, usar su alternativa integrada:

```bash
npm run dev -- --webpack
npm run build -- --webpack
```

## Estado actual: fase B, revisión visual pendiente

- Visor R3F ortográfico con órbita, zoom y restablecimiento de perfil desde +Z.
- Guerrero de piezas rígidas generado con Three.js puro, mirando hacia +X.
- Geometría low-poly perfilada: pecho/cintura, mandíbula, extremidades de sección variable y botas/martillo biselados; sin modelos externos ni nuevas dependencias.
- Pivotes con nombres estables y martillo unido a la mano derecha.
- Altura entre 1,2 y 2,4 m mediante escala uniforme.
- Depuración de posiciones/ejes y ajustes manuales de giro local Z por articulación.
- Restauración de pose, altura y cámara.

**Todavía no hay clips de animación, exportación GLB, persistencia ni pruebas en PixelOver.** Los controles futuros permanecen deshabilitados.

## Organización

```text
src/
├── app/                              # Rutas, layout y estilos
├── components/studio/
│   ├── StudioClient.tsx               # Estado de controles y cámara
│   ├── CharacterViewport.tsx          # Canvas, montaje y depuración
│   └── CharacterControls.tsx          # Controles del personaje
└── lib/characters/
    ├── types.ts                      # Contrato común y nombres de articulaciones
    ├── shared/
    │   ├── geometry.ts                # Secciones octogonales cerradas y biseladas
    │   ├── materials.ts               # Materiales propiedad de cada asset
    │   └── dispose.ts                 # Liberación de recursos
    └── hammer-warrior/
        ├── index.ts                  # Entrada pública del personaje
        ├── createCharacter.ts        # Geometría y ensamblaje
        ├── proportions.ts            # Dimensiones, perfiles y ángulos de reposo
        ├── rig.ts                    # Pivotes y pose de reposo
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

1. Orbitar arrastrando y pulsar **Profile** varias veces: siempre debe recuperar la vista lateral.
2. Variar altura: comprobar encuadre y apoyo de los pies en reposo.
3. Activar **Show rig**, elegir hombro/codo/cadera/rodilla y mover **Local Z offset**.
4. Verificar que los segmentos giran desde sus articulaciones y que el martillo sigue la mano.
5. Usar **Reset all joints** y **Reset character**.
6. Revisar anatomía, separación del arma y silueta aproximadamente a 64 y 96 px de altura.

Los giros manuales son solo depuración: no son clips exportables. No hay IK, límites anatómicos específicos ni prevención de intersecciones. El personaje no es `Bone`/`SkinnedMesh`; no se garantiza que PixelOver lo exponga como huesos editables.

Consultar [notas del pipeline](docs/notas-pipeline.md) y [guía por fases](docs/GUIA_PIPELINE_THREEJS_CODEX_PIXELOVER.md).
