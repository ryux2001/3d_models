# Form/Forge — Prototipo anatómico V3

**Antecedente del busto:** la fase actual es [V3.2 — refinamiento del humanoide](ANATOMIA_V3_2.md), sobre [V3.1 — humanoide completo](ANATOMIA_V3_1.md). Los límites y medidas del busto descritos aquí documentan las entregas anteriores, no el alcance actual.

El generador conserva esta arquitectura. La revisión de forma posterior está documentada en [Refinamiento anatómico](#refinamiento-anatómico-de-v3), con medidas comparativas, pruebas y limitaciones visuales actuales.

## Primera entrega

Superficie procedural continua de pelvis, abdomen, caja torácica, hombros, trapecios, cuello y cabeza. Orientación +X, unidades en metros. La referencia de altura completa es 1,8 m; el fragmento construido va aproximadamente de Y = 0,82 a Y = 1,82 m.

El modelo es un estudio anatómico simétrico y neutro, sin extremidades, ropa, accesorios, cabello ni arma. La cabeza presenta masas craneofaciales y rasgos integrados básicos, no un retrato terminado de las ilustraciones.

## Diagnóstico de V2

La documentación `CONSTRUCCION_HAMMER_WARRIOR.md` y el código real muestran que las regiones corporales V2 se generan mediante perfiles elípticos independientes. Los elipsoides y solapes ocultan extremos, pero no crean continuidad topológica entre cuello, hombros y torso. La ropa también está integrada en el mismo ensamblador que la anatomía.

V3 no modifica los archivos V2 ni su helper de perfiles. Los diez archivos del generador anterior se verifican contra la instantánea B.2 mediante una prueba reproducible. La interfaz común sí se amplía para seleccionar el modelo y el encuadre.

## Interpretación de las imágenes adjuntas

### Modelo tridimensional

Se toma como referencia de continuidad en cuello, clavículas, hombros y axila, así como de la lectura volumétrica al girar. No se transfieren literalmente sus proporciones femeninas al humanoide masculino de las otras imágenes.

### Ilustración frontal

- Cabeza estilizada, relativamente pequeña frente al conjunto corporal.
- Hombros más anchos que pelvis; torso esbelto, sin hipertrofia extrema.
- Cintura contenida y transición hacia pelvis, evitando un tronco de anchura constante.
- La ropa oculta límites pectorales y abdominales: su anatomía se interpreta, no se mide como si estuviera desnudo.

### Perfil

- Frente, nariz, boca, mentón y garganta tienen planos distintos.
- El cuello se inserta debajo del cráneo; no continúa como una columna recta centrada sobre el tórax.
- La proyección pectoral y el volumen posterior de pelvis se separan de la curva lumbar.

### Espalda

- Trapecios descendentes desde la nuca hacia el acromion.
- Anchura superior distribuida entre deltoides y región escapular.
- Estrechamiento lumbar antes de la expansión de las crestas ilíacas y glúteos.

Estas observaciones orientan los hitos y las relaciones de volumen. No se afirma coincidencia métrica o identidad visual exacta con las referencias.

## Enfoques comparados

| Enfoque | A favor | Compromiso |
|---|---|---|
| Campos implícitos/SDF y extracción de isosuperficie | Fusiones suaves y distribución de volumen flexible | Triangulación y flujo de aristas menos controlados; requiere resolver la preparación para deformación |
| Malla de control anatómica y subdivisión | Conexiones explícitas, índices deterministas, continuidad por vértices compartidos | La calidad depende del diseño del cage; el suavizado puede borrar rasgos y estrechar uniones |
| Parches paramétricos separados | Control local y posibilidad de derivadas suaves | Obliga a soldar y coordinar fronteras; unir cuello y hombros puede volver a producir costuras |

Se elige una **malla de control conectada con Catmull–Clark y campos de desplazamiento guiados por curvas**. La triangulación final es un resultado de una estructura anatómica, no el punto de partida para perseguir detalle mediante más polígonos.

## Arquitectura

```text
src/lib/characters/anatomy-v3/
├── landmarks.ts       Hitos y referencias conceptuales de los 16 pivotes
├── controlCage.ts      Parches anatómicos conectados y cierres temporales
├── subdivision.ts     Orientación, Catmull–Clark y conversión a BufferGeometry
├── sculptSurface.ts   Campos de volumen y curvas de clavícula/cuello
├── createAnatomy.ts   Asset, material, escala, anclajes y liberación
└── index.ts           Entrada pública

src/components/studio/AnatomyInspector.tsx
scripts/validate-anatomy-v3.mjs
```

### 1. Malla de control

Los puntos de frente y espalda se definen por su posición XYZ independiente. Los parches no se evalúan mediante seno/coseno, radios ni elipses. La altura de un punto lateral puede diferir de la altura del punto central en el mismo tramo anatómico.

Las conexiones superiores dejan una abertura central que se continúa hacia el cuello. Los dos lados del hombro se extienden mediante parches conectados alrededor del acromion: esos vértices comparten aristas con el tórax, no son esferas colocadas encima. Sus extremos quedan cerrados temporalmente porque aún no hay brazos. La cabeza y el cráneo continúan la frontera del cuello.

El extremo inferior de la pelvis y la coronilla también se cierran. El resultado es una única componente conexa; las tapas de futuros brazos/piernas tendrán que replantearse al añadir las extremidades.

### 2. Orientación y subdivisión

`orientClosedMesh()` recorre las adyacencias de caras, alinea su orientación y utiliza volumen firmado para elegir el exterior. Rechaza aristas con un número de caras distinto de dos y componentes desconectadas.

`subdivide()` implementa Catmull–Clark en TypeScript:

- Punto de cara: media de sus vértices.
- Punto de arista: media de sus extremos y las dos caras vecinas.
- Vértice actualizado: `(F + 2R + (n − 3)P) / n`.
- Cada esquina origina un quad conectado al nuevo punto de cara.

Dos pasos proporcionan la resolución de evaluación del prototipo. La subdivisión mantiene conectividad y suaviza transiciones; no es un generador anatómico por sí misma.

### 3. Esculpido de la superficie

`sculptSurface()` desplaza vértices con campos localizados y simétricos. Distingue región anterior y posterior para actuar sobre pectorales, esternón, arco costal, abdomen, escápulas, surco espinal y región glútea.

Las clavículas y la inserción anterior del cuello siguen curvas `CatmullRomCurve3` centrípetas. La proximidad a sus muestras modifica suavemente la superficie, en lugar de añadir cordones de geometría superpuesta. Mentón, nariz, órbitas y planos faciales también se definen mediante la malla de control y desplazamientos locales.

No hay shader que simule un volumen inexistente: los cambios están en el atributo `position` exportable. Las normales se recalculan después del esculpido.

### 4. Asset y referencias de articulación

`createAnatomy()` devuelve el contrato común `CharacterAsset`. El modelo tiene una sola malla `V3_AnatomySurface`, material neutro y geometría indexada. Sus datos de construcción se guardan en `root.userData`.

Se reservan los 16 nombres de articulación como grupos de referencia, sin enlazar la superficie a ellos. El inspector muestra solo seis referencias de las regiones construidas. **No hay Skeleton, Bone, SkinnedMesh ni pesos de skinning.** Los anclajes no son una demostración de rigging y no deben presentarse como tal.

La anatomía no importa código de `hammer-warrior/` ni necesita materiales de ropa o equipo. El visor decide qué generador instanciar.

## Comparación en el visor

- **V2 · Hammer warrior**: modelo B.2 vestido, con sus poses y controles anteriores.
- **V3 · Anatomía base**: prototipo continuo neutro; se abre por defecto.
- Alternar modelo conserva la orientación actual. La pose V2 se conserva al volver desde V3.
- **Encuadre de torso y cabeza** aplica el mismo encuadre a ambas versiones. Desactivarlo muestra la escala corporal completa.
- Accesos lateral (+Z), frontal (+X), tres cuartos, espalda (−X) y órbita.
- Triangulación y anclajes facilitan inspección. Las ayudas no entran en las miniaturas.

La comparación geométrica debe tener en cuenta que V2 incluye ropa y arma y V3 no. El estudio no usa las prendas como sustituto de la anatomía.

## Escala de miniaturas

Las resoluciones de referencia son 64 y 96 píxeles. En encuadre anatómico se asignan a un tramo del 60 % de la altura corporal completa: 1,08 m para la referencia de 1,8 m. El fragmento real ocupa algo menos que esa altura.

Al desactivar el encuadre anatómico, 64/96 px se refieren al cuerpo completo previsto. V3, al no tener piernas, ocupa aproximadamente 36/53 px verticales a esa escala. La interfaz indica el modo de referencia para evitar confundir una ampliación del busto con un personaje completo de 64 px.

Se mantiene el mismo contexto WebGL, con dos render targets y ampliación CSS ×2 sin interpolación. La escala relativa permanece estable al variar la altura corporal porque cámara y modelo cambian proporcionalmente. No se añade paleta limitada ni procesado de PixelOver.

## Verificación reproducible

```bash
pnpm check:anatomy-v3
pnpm exec tsc --noEmit
pnpm lint
pnpm build
```

Todos los comandos pasan. La comprobación geométrica utiliza el compilador TypeScript existente en memoria y módulos ESM; no requiere nuevas dependencias, WebGL ni archivos de compilación intermedios.

### Resultado geométrico

| Medida | Resultado |
|---|---:|
| Vértices del cage | 206 |
| Caras del cage | 199 |
| Vértices finales | 3.226 |
| Triángulos finales | 6.448 |
| Componentes de superficie | 1 |
| Característica de Euler | 2 |
| Cruces detectados entre triángulos no adyacentes | 0 |

Se verifican posiciones/normales finitas, normales unitarias, triángulos no degenerados, dos incidencias por arista, orientación de aristas opuesta entre caras vecinas, volumen positivo, simetría bilateral, escalas 1,2/1,8/2,4 m y liberación idempotente. También se verifica una ida y vuelta de `BufferGeometry.toJSON()` mediante `BufferGeometryLoader`.

El detector de cruces prueba segmentos contra triángulos y excluye caras con vértices compartidos. No es una prueba matemática exhaustiva de todas las posibles intersecciones coplanares o pliegues adyacentes. Las inspecciones visuales complementan esas comprobaciones.

La ida y vuelta nativa comprueba serialización de la geometría, **no exportación/reimportación GLB**. La validación GLB y la compatibilidad con PixelOver siguen pendientes.

### Inspección en navegador

Inspeccionado lateral, frontal, tres cuartos y espalda con WebGL, miniaturas de 64/96 px, silueta y triangulación. También escritorio de 1440 px y móvil de 390 px, sin desbordamiento horizontal del documento.

Se comprobó alternancia V2/V3, conservación de orientación y pose V2, cambio de escala, exclusión de helpers de las miniaturas y uso de un solo canvas WebGL. No hubo errores de consola; persiste el aviso de `THREE.Clock` desde las dependencias del visor. La lectura de píxeles usada por las pruebas genera avisos de rendimiento de Canvas2D, no fallos del modelo.

Las capturas locales de entrega están en `.playwright-mcp/v3-delivery-*.png`, excluidas de Git.

## Lectura visual y límites reales

- La silueta de cuello, tórax, cintura y pelvis es continua y se reconoce en las cuatro vistas. El perfil distingue nariz, mentón, proyección pectoral y volumen posterior de pelvis.
- Desaparecen las costuras de unión entre los antiguos objetos de cuello y torso. El deltoides pertenece a la misma superficie, pero su cierre temporal todavía puede leerse como un extremo de busto al observar de perfil.
- A 64 px se conservan cabeza, cuello, hombros y estrechamiento de cintura. Clavículas, planos faciales y región escapular pierden información; 96 px permite distinguir mejor parte de ese modelado.
- El rostro sigue siendo un bloqueo de volúmenes. No tiene globos oculares, párpados terminados, cabello ni la identidad facial del personaje ilustrado.
- La espalda y la pelvis requieren una futura revisión artística conjunta con las extremidades; todavía no se puede evaluar la transición final a brazos o piernas.
- No se han implementado extremidades ni volumen muscular de brazos/piernas en esta entrega. Tampoco poses V3, skinning, animaciones o exportación GLB.
- Una superficie cerrada y serializable no garantiza deformación correcta. Al continuar habrá que diseñar flujo de aristas en axilas/ingles, pesos y articulaciones, conservando la separación anatomía/ropa/equipo.

La entrega valida un enfoque nuevo y un banco de comparación. La aceptación artística frente a las referencias corresponde a la siguiente revisión del prototipo; no se presenta como un personaje terminado.

## Fuentes técnicas consultadas

- [Three.js: BufferGeometry](https://threejs.org/docs/#api/en/core/BufferGeometry): índices compartidos, atributos y normales.
- [Catmull–Clark: esquema de subdivisión](https://en.wikipedia.org/wiki/Catmull%E2%80%93Clark_subdivision_surface): puntos de cara, arista y vértice.

Las fuentes se usan para el algoritmo y las APIs; toda la malla de control anatómica se define en TypeScript dentro del repositorio. No se carga ningún modelo externo ni se utiliza Blender.

## Refinamiento anatómico de V3

### Diagnóstico confirmado

1. **Hombros:** el último contorno del deltoides usaba una Z constante. La cara terminal miraba hacia la cámara lateral. Además, la variación de profundidad entre la raíz del parche y el deltoides creaba una concavidad de unión que resaltaba el efecto de pieza añadida.
2. **Pectorales:** la fila principal del cage situaba el frente central en X = 0,130 m y el medial en X = 0,170 m. El campo pectoral añadía hasta 18 mm y el campo esternal restaba hasta 9 mm. El problema precedía al cálculo de normales.
3. **Línea media:** `gaussian(abs(z), centro, anchura)` tiene pendientes laterales que no se encuentran suavemente en Z = 0 cuando la campana está desplazada. Repetirlo en pecho y abdomen reforzaba una línea vertical artificial. La interpolación suavizaba el cage, pero el desplazamiento posterior volvía a introducir una pendiente no suave.
4. **Pelvis:** puntos posteriores de hasta −0,158 m, más un campo glúteo de 14 mm, exageraban su masa respecto a la cintura. El cierre inferior redondeado reforzaba la lectura ovalada.
5. **Espalda:** un surco espinal estrecho y largo, combinado con realces escapulares concentrados, generaba planos poco equilibrados.

`computeVertexNormals()` sigue calculando normales compartidas después de deformar los vértices. No se han pintado normales, cambiado el material ni añadido efectos para esconder estos defectos.

### Cambios realizados

- Reubicación de los hitos del tórax para reducir profundidad y acercar los planos medial y esternal.
- Campos pectorales, abdominales, claviculares y escapulares más amplios y de menor amplitud. El abdomen conserva una convexidad central suave y los oblicuos enlazan con las crestas ilíacas.
- Sustitución de los campos corporales basados en `abs(z)` por sumas gaussianas sobre **Z con signo**, con derivada lateral nula en la línea media. Las curvas también combinan sus dos lados sin escoger uno mediante valor absoluto.
- Redistribución de pelvis, sacro y cierre inferior hacia una forma más contenida, con transición gradual a cintura y oblicuos.
- Parches del hombro definidos mediante puntos anatómicos independientes, no mediante escalado y traslación de un mismo contorno. El cierre se orienta hacia abajo; se alarga la raíz del deltoides para preparar su continuidad con el futuro brazo. No se generan brazos completos.
- Iluminación V3 blanca y equilibrada: ambiente 0,9, principal 1,65 y relleno 1,35. V2 mantiene sus luces anteriores. Se conserva el material V3.
- Sin cambios en los anclajes, la cabeza de control, la arquitectura, los dos pasos de subdivisión ni las dependencias. No se añaden controles de interfaz.

El número de elementos permanece en **206 vértices de control, 199 caras de control, 3.226 vértices finales y 6.448 triángulos**. Las diferencias se deben a posición y distribución de volumen, no a mayor resolución.

### Mediciones de superficie antes/después

Se obtienen por intersección de rayos con la geometría, independientemente de la iluminación. Todas las medidas corresponden al modelo de referencia, escala 1,8 m.

| Muestra | Antes | Después |
|---|---:|---:|
| Diferencia entre frente pectoral a Z = 0,07 y frente central, Y = 1,345 | 31,83 mm | 4,17 mm |
| X del frente pectoral a Y = 1,345, Z = 0,07 | 162,56 mm | 133,33 mm |
| Depresión central posterior frente a Z = 0,035, Y = 1,345 | 11,16 mm | 2,57 mm |
| X posterior a Y = 0,94, Z = 0,035 | −144,38 mm | −120,59 mm |

La primera diferencia se reduce aproximadamente un 87 %. Estos números cuantifican los defectos muestreados; no son por sí solos un criterio de aprobación artística ni un análisis de toda la superficie.

La validación incorpora regresiones de forma: profundidad pectoral acotada en las muestras, surco central inferior a 6 mm y cierres del hombro orientados predominantemente hacia −Y. También imprime perfiles de frente y espalda a seis alturas para facilitar posteriores comparaciones.

### Comprobaciones de esta revisión

- `pnpm exec tsc --noEmit`: correcto.
- `pnpm lint`: correcto.
- `pnpm build`: correcto.
- `pnpm check:anatomy-v3`: correcto; diez archivos V2 idénticos a B.2.
- Superficie conexa, cerrada y simétrica; normales unitarias, volumen positivo y orientación consistente.
- Sin triángulos degenerados ni cruces no adyacentes detectados por la prueba existente.
- Ida y vuelta de geometría nativa de Three.js y liberación idempotente: correctas.
- Inspección real en navegador de frontal, lateral, tres cuartos y espalda con luz blanca. Revisión en color y silueta de las dos miniaturas.
- Alternancia V2/V3 y exclusión de ayudas del rig de las miniaturas comprobadas. Inspección móvil de 390 px sin desbordamiento horizontal en la revisión intermedia; el ajuste final modifica solamente cage y campos.

Las capturas finales están en `.playwright-mcp/v3-refinement-delivery-*.png`, excluidas de Git. Incluyen las cuatro vistas y las cuatro parejas de miniaturas en silueta. Se mantiene la escala explícita del fragmento anatómico: referencia de 60 % de altura corporal para 64/96 px, con margen de encuadre; no son sprites de cuerpo completo.

### Evaluación visual y defectos que permanecen

- Se elimina la canaladura vertical dominante del torso y se reduce la proyección pectoral. La zona abdominal ya no repite dos crestas estrechas a ambos lados del centro.
- La pelvis está más contenida y menos abultada hacia atrás. Su extremo inferior sigue siendo un cierre de prototipo: todavía puede leerse como base redondeada de busto, no como una unión final con muslos.
- El hombro deja de terminar en un disco plano dirigido al perfil. **La masa del deltoides aún resulta demasiado delimitada desde lateral y tres cuartos**, y en frontal se aprecian los extremos pendientes bajo la axila. El cambio mejora la dirección de continuación, pero no equivale a una transición definitiva con un brazo.
- Los relieves de clavículas, escápulas y abdomen son deliberadamente suaves. La espalda aún necesita mayor precisión artística de sus planos; no se considera una espalda terminada.
- A 64 px la silueta conserva cabeza, cuello, hombros y cintura; la diferenciación interna de pectorales, escápulas y oblicuos es escasa. A 96 px mejora, pero varios relieves continúan siendo muy sutiles.
- La cabeza sigue siendo un bloqueo sencillo. No se ha dedicado esta revisión a rasgos faciales.

La revisión geométrica y la compilación pasan; **la aprobación artística continúa pendiente**. Los límites anteriores se mantienen explícitos para no presentar la validez topológica como calidad anatómica ya resuelta.
