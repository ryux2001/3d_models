# Form/Forge V3.2 — Refinamiento anatómico e informe para V3.3

## Resultado y alcance

Refinamiento de posiciones del humanoide V3.1 para obtener una constitución masculina estilizada, moderadamente heroica. Se conserva la A-pose, la superficie continua, la conectividad, los 24 bucles y los 16 nombres/centros articulares de diseño.

No cambian los dos pasos de Catmull–Clark ni la densidad: **534 vértices de control, 525 caras de control, 8.458 vértices finales y 16.912 triángulos**. No se añaden dependencias, prendas, animaciones ni controles de interfaz. El visor existente pasa a mostrar V3.2 por defecto.

La validez geométrica está comprobada. La aceptación artística y la calidad de deformación todavía deben revisarse antes de considerar aprobado el personaje.

## Conservación de versiones

Los datos y helpers que construyen V3.1 (`controlCage.ts`, `limbPatches.ts`, `sculptSurface.ts`, `subdivision.ts`, `landmarks.ts`) no se modifican en esta entrega. El refinamiento se aplica sobre una copia de sus posiciones mediante `refinementV32.ts`; no se mutan caras ni bucles originales.

```ts
import { createAnatomy, createAnatomyV31, measureAnatomy } from '@/lib/characters/anatomy-v3';

const current = createAnatomy();              // V3.2, referencia de 1,8 m
const previous = createAnatomy(1.8, '3.1');   // V3.1 reproducible
const previousAlias = createAnatomyV31();

const measures = measureAnatomy(current);     // Solo assets a altura de referencia

current.dispose();
previous.dispose();
previousAlias.dispose();
```

`scripts/fixtures/anatomy-v31.json` congela las huellas SHA-256 de posiciones, normales, índices y anclajes/bucles previos. La prueba exige que V3.1 siga produciendo exactamente esas huellas y que V3.2 conserve los mismos índices y bucles.

V2 sigue protegida por la comparación de sus diez archivos con la instantánea B.2. La documentación histórica de los bustos V3 y del cuerpo V3.1 se conserva.

## Interpretación de las referencias masculinas

Las ilustraciones Flux Klein orientan estas decisiones:

- Cabeza de tamaño razonable respecto al cuerpo, mandíbula definida y hombros dominantes sin hipertrofia extrema.
- Torso esbelto, con caja torácica más ancha que cintura y pelvis; sin convertir el abdomen en una canaladura o dos columnas.
- Brazos y piernas con masa suficiente para sostener la silueta de un personaje de fantasía, manteniendo muñecas y tobillos diferenciados.
- Pies proporcionados y manos reconocibles como volúmenes simplificados.

La ropa oculta la anatomía y el cabello altera la silueta craneal. Por ello las relaciones objetivo son una **interpretación de diseño**, no mediciones exactas del cuerpo desnudo de la ilustración. No se usan las proporciones femeninas de la referencia 3D como patrón del humanoide.

### Relaciones medibles

| Relación | V3.1 | V3.2 | Banda de diseño utilizada |
|---|---:|---:|---|
| Altura / altura de cabeza | 8,21 | 7,88 | Aproximadamente 7,8–8,1 cabezas |
| Anchura entre anclajes de hombros / anchura máxima de cabeza | 2,27 | 2,25 | 2,2–2,5 |
| Hombros / anchura de pelvis | 1,43 | 1,41 | 1,35–1,50 |
| Caja torácica / cintura | 1,33 | 1,35 | 1,25–1,45 |
| Longitud hombro–codo–muñeca / altura corporal | 30,70 % | 30,74 % | 29–33 % |
| Tramo hombro–cadera / altura del anclaje de cadera | 0,516 | 0,517 | 0,48–0,56 |
| Longitud de mano / altura corporal | 8,45 % | 8,47 % | 8–10 % |
| Longitud de pie / altura corporal | 15,15 % | 14,25 % | 14–16 % |

Estas bandas son criterios de esta dirección artística, no reglas universales de anatomía.

### Cambios dimensionales muestreados

Medidas en el modelo normalizado de referencia de 1,8 m:

| Medida | V3.1 | V3.2 |
|---|---:|---:|
| Altura de cabeza entre referencia de mentón y coronilla | 21,94 cm | 22,84 cm |
| Profundidad anterior/posterior de brazo superior | 11,70 cm | 14,46 cm |
| Profundidad de antebrazo | 8,08 cm | 9,83 cm |
| Profundidad de muslo | 17,48 cm | 19,88 cm |
| Profundidad de gemelo | 11,13 cm | 12,91 cm |
| Profundidad de tobillo/empeine a la altura muestreada | 8,88 cm | 8,33 cm |
| Anchura de palma | 7,28 cm | 8,48 cm |
| Profundidad de palma | 4,12 cm | 4,82 cm |
| Longitud de mano | 15,22 cm | 15,24 cm |
| Longitud de pie | 27,27 cm | 25,65 cm |
| Anchura de antepié | 9,50 cm | 10,25 cm |
| Altura inferior en la muestra de arco medial | 8,02 mm | 15,87 mm |

El aumento de profundidad es aproximadamente 24 % en brazo superior, 22 % en antebrazo, 14 % en muslo y 16 % en gemelo. El tobillo no se engrosa indiscriminadamente: la corrección del empeine reduce su proyección anterior en la muestra, mientras se mantiene la transición desde la pantorrilla.

### Cómo se obtienen las medidas

`measureAnatomy.ts` combina:

- Cajas y rangos de vértices para altura, cabeza y pie.
- Intersecciones de rayos con la superficie para anchura de torso/pelvis y profundidad de las extremidades en posiciones explícitas.
- Centros de los 16 anclajes para longitudes de segmentos.
- Proyección del bucle de palma para anchura/profundidad de mano.
- Un rayo ascendente en la planta medial para medir el arco.

La altura de cabeza utiliza el hito de mentón del modelo, transformado por el mismo refinamiento V3.2; no se selecciona manualmente una altura para forzar el cociente. La anchura máxima incluye la silueta lateral de la cabeza y sus raíces de oreja. La anchura entre hombros corresponde a anclajes, no al contorno exterior de los deltoides. Las medidas no deben confundirse con diámetros clínicos o circunferencias.

## Cambios geométricos

### Hombros, brazos y antebrazos

La masa se aumenta alrededor de los ejes existentes de la A-pose. Se distingue el desarrollo anterior del bíceps, la región posterior y la masa proximal del antebrazo; las muñecas conservan su estrechamiento.

No se desplazan los centros de diseño para simular más volumen. Los campos de brazos se separan de los de piernas también por posición lateral, para impedir que las manos reciban deformaciones del muslo al coincidir en altura. Existe una regresión que detecta ese problema.

### Torso, pelvis y piernas

Se refuerzan caja torácica y pectorales sobre un esternón amplio, con cambios pequeños en el abdomen. La cintura se contiene ligeramente y la pelvis/glúteos enlazan con mayor masa proximal de muslos. Cuádriceps y gemelos ganan volumen localizado, sin engrosar por igual rodillas y tobillos.

La depresión central muestreada del torso permanece en unos 3,33 mm, por debajo del límite de regresión de 6 mm y del defecto original de unos 32 mm.

### Manos

Palmas más anchas y profundas, apoyo tenar más visible y pulgar algo más lleno. Se conserva la longitud de mano prácticamente igual, evitando una mano agrandada por traslación del eje. Los otros cuatro dedos siguen agrupados. La forma es todavía esquemática; no hay uñas ni articulaciones digitales.

### Pies

Antepié algo más corto y ancho, punta oblicua hacia el lado medial, talón más redondeado y menor proyección del empeine. El arco se eleva en la planta medial y el dorso se redistribuye hacia una plataforma metatarsal más baja y una masa de dedos redondeada.

El postproceso usa la orientación geométrica de la superficie para seleccionar el dorso: mueve **posiciones reales**, no pinta normales ni modifica iluminación para simular la forma. Después se recalculan las normales de toda la geometría.

### Cabeza

Ligero aumento de altura de cara inferior, mandíbula más firme y pequeño ajuste de cráneo. Se mantiene el bloqueo facial anterior, sin perseguir identidad de retrato ni añadir detalle fino.

## Anclajes, escala y conectividad

- Se conservan exactamente los índices, los 24 bucles y los 16 nombres de articulación.
- Los centros articulares de diseño de `landmarks.ts` no cambian.
- La normalización final al suelo y a 1,8 m cambia mínimamente al redistribuir la planta y la cabeza. La diferencia máxima entre coordenadas normalizadas V3.1/V3.2 de los anclajes es **2,18 mm**; se comprueba que sea inferior a 3 mm.
- Cada versión calcula sus anclajes con la misma transformación que su propia geometría. Esto mantiene consistencia de espacio, pero exige recalcular las matrices de bind al crear el esqueleto.
- Los grupos actuales siguen siendo referencias sin skinning. Mantener sus nombres no los convierte en huesos.

## Verificación técnica y visual

```bash
pnpm check:anatomy-v3
pnpm exec tsc --noEmit
pnpm lint
pnpm build
```

Los cuatro comandos pasan. La comprobación incluye cierre, orientación, normales unitarias, simetría, áreas no degeneradas, ausencia de vértices huérfanos, bucles conectados, apoyo de ambos pies, escala y limpieza de recursos. No se detectan cruces no adyacentes con el algoritmo existente; se mantienen sus límites para casos coplanares/pliegues adyacentes.

Se añaden comprobaciones de preservación exacta de V3.1, mismos índices en V3.2 y rangos de refinamiento medibles. La serialización probada es nativa de Three.js; no es validación GLB.

Se inspeccionó en navegador con la misma iluminación neutra de V3.1: frontal, lateral, tres cuartos y espalda, color y silueta a 64/96 px. También manos y pies ampliados, triangulación, exclusión de helpers de las miniaturas, alternancia con V2 y móvil de 390 px sin desbordamiento horizontal.

Capturas finales locales en `.playwright-mcp/v32-final-*.png`; se conservan las capturas V3.1 anteriores para comparación. Esa carpeta está excluida de Git. En la comprobación de miniaturas la altura rasterizada ronda 63–65 px para la referencia de 64, y 96 px para la de 96, según proyección.

### Límites visuales actuales

- Las extremidades tienen más masa y la relación cabeza/cuerpo es menos alargada. La silueta sigue siendo esbelta, no de culturista.
- La transición deltoides–brazo todavía muestra un cambio de plano en tres cuartos y la axila mantiene una concavidad marcada.
- La unión glúteo–muslo y el puente inguinal siguen siendo esquemáticos. Necesitan revisión en movimiento.
- La palma está mejor proporcionada, pero la mano conserva aspecto de manopla y el pulgar no tiene una articulación completa.
- El pie distingue mejor talón, empeine y antepié. La masa de dedos y los laterales siguen simplificados; no es un pie acabado de cerca.
- Las formas internas del torso son suaves y parte de su lectura desaparece a 64 px. En lateral se superponen brazos y piernas por la A-pose simétrica.

**La validación geométrica pasa, pero la anatomía y su deformación no quedan aprobadas por ello.**

## Informe para skinning V3.3

### 1. Preparar correctamente el bind pose — prioridad alta

La superficie se refina antes de normalizarla. Crear huesos, matrices inversas y pesos sobre la geometría **final V3.2**, usando sus anclajes normalizados. No reutilizar matrices de bind de V3.1 pese a su pequeña diferencia de escala/traslación.

Los grupos de referencia actuales son planos bajo la raíz. Al convertirlos en jerarquía Hips → Torso → hombro → codo → mano, etc., calcular posiciones locales desde los centros mundiales conservados. Verificar ejes y signos de giro antes de evaluar pesos.

### 2. Hombro y axila — prioridad alta

Riesgos: colapso de la axila al bajar el brazo, pérdida de volumen del deltoides al elevarlo, arrastre de pectoral/escápula y pinzamiento cerca de vértices de valencia extraordinaria.

Pruebas previstas: brazo abajo, abducción de 45°/90°/135° y elevación frontal. Evaluar conjuntamente torso, hombro y brazo; el bucle `Shoulder_*` es una guía, no una separación rígida de influencias. Mantener pendiente la posibilidad de ajustes topológicos o correctivos si el resultado los exige.

### 3. Codos y torsión de antebrazo — prioridad alta

Tres bucles de referencia no garantizan que la flexión mantenga volumen. Revisar zona interior, olécranon y continuidad de bíceps/antebrazo a 45°/90°/120°. Comprobar pronación/supinación y el posible efecto de torsión en muñeca. No convertir los contornos en bandas de pesos rígidas.

### 4. Pelvis, ingles y muslos — prioridad alta

Riesgos: influencia de una pierna sobre la contraria, periné arrastrado por el muslo, pérdida de masa glútea y pliegues al subir la rodilla. Evaluar flexión de cadera de 45°/90°, separación lateral y una pose agachada.

Usar conectividad y pertenencia a ramas, no solo altura o proximidad espacial, para repartir pesos. Dos regiones pueden compartir Y y estar lejos anatómicamente: el refinamiento ya protege ese caso entre manos y muslos.

### 5. Rodillas, gemelos y tobillos — prioridad alta/media

Comprobar flexión de 45°/90°/120°, posición del centro respecto a rótula y hueco posterior, volumen del gemelo y estrechamiento del tendón de Aquiles. Evitar pesos que conviertan la rodilla en una bisagra cortada.

### 6. Pies y apoyo — prioridad media

Conservar talón y antepié en contacto cuando corresponda y revisar el arco durante dorsiflexión/flexión plantar. El esquema de 16 articulaciones solo reserva tobillo: el despegue independiente de dedos o un foot roll articulado requerirá una decisión de rig posterior. No atribuir esa capacidad a los bucles de planta actuales.

### 7. Manos y agarre — prioridad media

La mano es una masa agrupada vinculable a `Hand_*`. El pulgar conectado no dispone de huesos digitales. Un agarre real del martillo no puede darse por resuelto con girar la muñeca; requerirá decidir entre pose/modelado de agarre y ampliación del rig.

### 8. Verificaciones transversales

- Pesos normalizados y simetría izquierda/derecha.
- Ausencia de influencias contralaterales o de ramas no relacionadas.
- Revisión de volumen, silueta, intersecciones y normales en las poses de prueba.
- Atención a polos de las tapas de manos/pies y a los puntos de unión de pulgar, axila e ingle.
- Medir de nuevo las siluetas a 64/96 px, especialmente de perfil: la A-pose no demuestra legibilidad de ataques o recuperación.

Este informe prepara V3.3; no implementa skinning, huesos ni clips en V3.2.
