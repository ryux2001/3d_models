# Form/Forge V3.1 — Humanoide anatómico completo

**Versión conservada:** el visor utiliza ahora [V3.2](ANATOMIA_V3_2.md). Esta geometría V3.1 sigue disponible mediante `createAnatomy(1.8, '3.1')` / `createAnatomyV31()` y está protegida por huellas digitales de sus atributos y anclajes.

## Alcance de la entrega

Humanoide estilizado completo en A-pose simétrica. Se prolonga el cage V3 con brazos, antebrazos, palmas, masas de dedos, pulgares, muslos, pantorrillas, tobillos y pies. Una sola `Mesh` y una sola superficie conectada; sin prendas, accesorios, modelos externos ni nuevas dependencias.

V2 conserva sus diez archivos de generador y helpers, comprobados contra la instantánea B.2. No se implementan animaciones, skinning, exportación GLB ni detalles faciales adicionales.

## Análisis y extensión de la topología

### Hombros y brazos

Se elimina el cierre lateral del deltoides. Los parches compartidos con el tórax se redistribuyen para seguir la inclinación descendente/lateral de la A-pose. Las nuevas bandas conectan directamente las aristas del hombro con las del brazo: no hay cilindros insertados, mallas interpenetradas o soldaduras aproximadas por proximidad.

Los contornos son polígonos de seis hitos independientes para cara anterior, posterior, región externa e interna. Las posiciones cambian a lo largo de deltoides, bíceps/tríceps, codo, antebrazo y muñeca. No se evalúan elipses ni superficies de revolución. Catmull–Clark suaviza la misma conectividad.

Hay bucles de soporte antes, sobre y después de cada codo. Los antebrazos se estrechan hacia las muñecas; las palmas se aplanan y ensanchan. Una cara de cada palma se sustituye por una rama conectada para el pulgar. Los otros cuatro dedos se representan como una masa común, sin articulaciones individuales.

### Pelvis, piernas y pies

El cierre inferior del busto se sustituye por dos aberturas para muslos, conservando dos quads centrales para el puente pubiano/perineal. Los contornos de ambos muslos usan los vértices de esas aberturas. El centro de la entrepierna se eleva ligeramente para evitar el aspecto de puente cuadrado.

Los puntos posteriores y anteriores distinguen masa del muslo, región rotuliana, hueco posterior de rodilla, pantorrilla y estrechamiento de tobillo. También se conservan bucles antes, sobre y después de las rodillas.

Los pies continúan la frontera del tobillo mediante empeine, talón y antepié; sus superficies inferiores se cierran. Los dedos del pie son una masa simplificada. Frente del cuerpo y de los pies hacia +X, vertical +Y, lados separados en Z.

### Cierre y conectividad

Solo se tapan los extremos terminales: coronilla, masas de dedos, pulgares y plantas. No quedan tapas dentro de hombros, muñecas, caderas o tobillos. La orientación se resuelve sobre el cage completo antes de subdividir.

La superficie final conserva topología cerrada de género cero. Esto valida la conectividad, pero no demuestra que vaya a deformarse correctamente bajo todas las poses futuras.

## Arquitectura conservada

```text
anatomy-v3/
├── controlCage.ts      Torso/cabeza, aberturas y unión con extremidades
├── limbPatches.ts      Nuevos parches de extremidades, manos, pulgares y pies
├── subdivision.ts     Catmull–Clark y propagación de bucles etiquetados
├── sculptSurface.ts   Campos locales V3, sin nuevo detalle facial
├── landmarks.ts       Referencias de los 16 pivotes en A-pose
├── createAnatomy.ts   Construcción, escala, metadatos y limpieza
└── index.ts           Entrada pública existente
```

`createAnatomy()` mantiene el contrato `CharacterAsset`. Los dos pasos de Catmull–Clark permanecen. La ampliación requiere más superficie, no más niveles de subdivisión.

### Bucles para futuras deformaciones

`ControlMesh.loops` almacena los índices de los contornos etiquetados. Cada paso de subdivisión intercala los puntos de arista correspondientes; un contorno de seis hitos pasa a doce y luego a veinticuatro vértices conectados.

Se conservan **24 bucles**:

- Por brazo: hombro, antes del codo, codo, después del codo, muñeca (`Hand`) y palma.
- Por pierna: raíz de muslo (`Hip`), antes de rodilla, rodilla, después de rodilla, tobillo y planta.
- Ambos lados, con nombres estables, por ejemplo `Elbow_R`, `Elbow_before_R`, `Knee_L` y `Knee_after_L`.

Los índices finales están en `root.userData.deformationLoops`. La prueba verifica que forman ciclos cerrados de aristas reales, no listas de puntos desconectados.

**Pendiente:** diseñar pesos de skinning, evaluar flexión, resolver comportamiento de axilas/ingles y revisar distribución de aristas bajo movimiento. Los bucles actuales son preparación verificable, no aprobación automática de un rig.

## Proporciones, A-pose y escala

- Referencia de altura: **1,8 m**, desde planta hasta coronilla.
- A-pose aproximadamente 30° de separación respecto a la vertical de los brazos, con simetría bilateral.
- Codos y muñecas se desplazan hacia fuera y abajo respecto a hombros; las referencias se actualizan a esta pose.
- Muslos y pantorrillas se distribuyen entre caderas, rodillas y tobillos. Los pies tienen apoyo simétrico.
- El frente, perfil y espalda de las ilustraciones masculinas orientan las relaciones de anchura y longitud; la referencia 3D orienta la continuidad de volúmenes. No se traslada su vestuario ni se afirma coincidencia métrica exacta.

Tras esculpir y subdividir, se calcula el mínimo Y y la altura de la superficie. La geometría se traslada al suelo y escala uniformemente a 1,8 m. Los 16 anclajes reciben exactamente la misma transformación. El deslizador de 1,2–2,4 m actúa después sobre la raíz, sin reconstruir geometría.

`root.userData.normalization` documenta esa transformación. Se conservan `Hips`, `Torso`, `Neck`, `Head`, hombros, codos, manos, caderas, rodillas y tobillos. Los grupos de referencia todavía no están vinculados a la superficie; no son `Bone`/`Skeleton` ni deforman la malla.

## Visor y miniaturas

El visor abre **V3.1 · Humanoide** en encuadre corporal completo. Se mantienen comparación V2/V3, cuatro vistas, órbita, triangulación, anclajes y silueta. El encuadre de torso/cabeza sigue disponible para revisión local.

En modo corporal, las miniaturas asignan 64/96 px a la altura de todo el personaje, sin recortar cabeza o pies. Sus canvas de 109/164 px incluyen margen; se muestran ampliados ×2 sin interpolación. El modo torso/cabeza conserva su referencia explícita del 60 % de altura corporal.

La luz blanca equilibrada y el material neutro permanecen. Las ayudas de articulación se excluyen de las miniaturas. No hay cuantización de paleta ni procesado de PixelOver.

## Verificaciones realizadas

```bash
pnpm check:anatomy-v3
pnpm exec tsc --noEmit
pnpm lint
pnpm build
```

Todos los comandos pasan.

| Medida | Resultado |
|---|---:|
| Vértices de control | 534 |
| Caras de control | 525 |
| Vértices finales | 8.458 |
| Triángulos finales | 16.912 |
| Bucles etiquetados | 24 |
| Pivotes de referencia | 16 |
| Cruces no adyacentes detectados | 0 |

### Validación geométrica

- Cage conexo, superficie cerrada, aristas con dos incidencias y orientación opuesta coherente.
- Característica de Euler 2, simetría, normales unitarias, atributos finitos y ausencia de vértices huérfanos o triángulos degenerados.
- Bucles de deformación con 24 vértices distintos y aristas reales tras la subdivisión.
- Altura de referencia 1,8 m y ambos pies tocando Y = 0.
- A-pose coherente de anclajes, escala a 1,2/1,8/2,4 m y restauración de referencias sin deriva.
- Serialización nativa de `BufferGeometry` y liberación idempotente de geometría/material.
- Regresiones del torso conservadas: profundidad pectoral y surco central siguen acotados en las muestras.
- Los diez archivos V2 coinciden con su instantánea B.2.

La detección de cruces mantiene las limitaciones documentadas: prueba segmentos contra caras no adyacentes y no es una demostración exhaustiva de ausencia de todos los pliegues adyacentes o solapes coplanares. Se ordenan las caras por Y para descartar pares separados y mantener la prueba práctica con el cuerpo completo.

### Inspección visual real

Comprobado en navegador con WebGL: frontal, lateral, tres cuartos y espalda, en color y silueta; escritorio de 1440 px y móvil de 390 px. Se revisaron también triangulación, las referencias de articulación, cambio de altura y el modelo V2 con martillo elevado. El documento móvil no presenta desbordamiento horizontal.

En las capturas finales, las siluetas ocupan 63–65 px verticales para la referencia de 64 px, dependiendo de proyección y rasterización, y 96 px para la referencia de 96 px. Cambiar de altura conserva esa escala relativa. Los helpers no cambian las miniaturas.

Capturas locales, excluidas de Git:

- `.playwright-mcp/v31-delivery-Frontal.png`
- `.playwright-mcp/v31-delivery-Lateral.png`
- `.playwright-mcp/v31-delivery-Tres-cuartos.png`
- `.playwright-mcp/v31-delivery-Espalda.png`
- `.playwright-mcp/v31-delivery-mask-*.png`
- `.playwright-mcp/v31-delivery-wire.png`
- `.playwright-mcp/v31-delivery-mobile.png`

## Evaluación artística y límites observados

- El conjunto permite juzgar longitud de brazos y piernas, proporción cabeza/cuerpo y distribución de masas. El frontal y la espalda separan ambos brazos y piernas; la lectura de cuerpo completo es reconocible a 64/96 px.
- Los hombros continúan hacia el brazo y ya no terminan como tapas laterales de un busto. **Axila y deltoides aún muestran algún cambio de plano marcado en tres cuartos**: necesitan revisión futura de forma y de comportamiento al deformar.
- La entrepierna tiene un arco más natural que el primer cierre cuadrado, pero el plano pubiano/perineal sigue siendo esquemático. La transición a glúteos y muslos no se considera definitivamente aprobada.
- Las manos son volúmenes de palma/dedos agrupados y pulgar. Los pulgares se leen mejor en frontal que de perfil; a 64 px se reducen a pocos píxeles. No hay dedos individuales ni rig de mano.
- Los pies distinguen empeine, antepié y talón, pero mantienen una silueta de cuña simplificada, sin dedos individuales ni detalle plantar.
- Codos, rodillas y pantorrillas se distinguen por volumen, no por separaciones de piezas. A baja resolución parte de ese modelado se pierde.
- En lateral, ambas piernas y parte de los brazos se superponen por la simetría de la A-pose. No se ha roto la pose neutral para forzar una silueta de combate; deberá revisarse de nuevo al preparar poses y animaciones posteriores.
- La cabeza conserva el bloqueo facial anterior, sin detalle nuevo.

**La geometría y las comprobaciones técnicas pasan. La anatomía queda pendiente de aprobación artística** y de pruebas de deformación posteriores. No se ha implementado skinning, animación ni exportación GLB para esta entrega.
