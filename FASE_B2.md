# Fase B.2 — Anatomía e inspección visual

## Alcance

Mejora procedural del Hammer warrior con el contrato `CharacterAsset`, los 16 pivotes y la jerarquía del arma conservados. No se han añadido dependencias en esta fase. Animaciones y GLB siguen pendientes.

## Diagnóstico e intervención

- Los perfiles elípticos simétricos limitaban la diferenciación pecho/espalda y muslo/pantorrilla. El helper admite ahora un radio trasero opcional, compatible con los perfiles existentes.
- Se han ajustado caja torácica, cintura, pelvis, deltoides, brazos y piernas. Las botas dejan visible más pantorrilla y las rodilleras tienen menor volumen.
- Las manos tienen palma más aplanada, nudillos simplificados y pulgares espejados. No hay dedos individuales ni un agarre anatómico de precisión.
- Volúmenes de unión en caderas, rodillas y tobillos cubren extremos de las piezas. Los solapes son deliberados: no se pretende deformación continua.
- Pantalones y cuero más claros ayudan a distinguir piernas y botas del fondo.
- Cuatro presets estáticos coordinan articulaciones; el agachado flexiona las rodillas hacia +X. El reposo inclina el martillo hacia delante para despejar la cara.
- `resetPose()` restaura posiciones además de orientaciones. Los presets se aplican desde esa base; el ajuste manual Z se añade después.

## Inspección y miniaturas

Accesos lateral (+Z), frontal (+X), tres cuartos y órbita. La cámara se encuadra según la altura para permitir inspeccionar el martillo elevado.

Miniaturas de referencia de 64 y 96 píxeles corporales por altura de pie; lienzos de 109 × 109 y 164 × 164 para reservar margen al arma. Ampliación visual ×2 mediante `image-rendering: pixelated`. El encuadre conserva escala en las cuatro poses y sigue la orientación, pero no el zoom del visor.

Se reutilizan el personaje y renderer existentes. Dos render targets persistentes se actualizan al cambiar pose, altura, orientación o modo silueta; no se ejecuta captura mientras esos valores permanecen estables. La lectura GPU es síncrona y pequeña; no es un pipeline de captura masiva. Se restaura el target, fondo, override de material y auto-clear después de capturar. Los helpers quedan excluidos mediante una capa de render.

No hay cuantización de paleta, outlines, dithering ni validación en PixelOver.

## Verificación realizada

- `pnpm exec tsc --noEmit`: correcto.
- `pnpm lint`: correcto.
- `pnpm build`: correcto.
- Comprobación numérica puntual: 12 combinaciones de pose/altura (1,2 / 1,8 / 2,4 m); geometría finita, nombres únicos, 16 pivotes, jerarquía del martillo, ambos pies apoyados, rodillas hacia delante, reset sin deriva y liberación idempotente de recursos.
- Modelo: 7.648 triángulos renderizados, contando instancias de geometrías compartidas.
- Inspección visual en navegador: cuatro poses × tres vistas, con las dos resoluciones visibles simultáneamente. Confirmación después de corregir flexión de rodillas, ocultación del rostro en reposo y recorte móvil.
- Comprobación de píxeles en navegador: las miniaturas cambian con pose/vista/ajuste manual/silueta; reset recupera la imagen anterior; activar ayudas de articulaciones no modifica las miniaturas.
- `Reset character`: recupera 1,8 m, reposo y vista lateral.
- Móvil de 390 × 844: sin desbordamiento horizontal del documento y miniaturas dentro de su sección. En pantallas más estrechas cada figura permite desplazamiento horizontal, sin reducir la ampliación ×2.
- Sin errores de consola durante la comprobación final. El visor emite un aviso de deprecación de `THREE.Clock` desde sus dependencias; las comprobaciones de píxeles generan avisos de rendimiento de Canvas2D propios de la prueba.

Las capturas locales de referencia y confirmación se encuentran en `.playwright-mcp/` (excluida de Git).

## Resultado visual y límites observados

- La cintura, la masa del muslo y el estrechamiento del antebrazo están más definidos. El frontal permite distinguir ambos brazos y piernas; el martillo elevado se mantiene separado del cráneo.
- Preparación y agachado ofrecen perfiles diferentes y mantienen el apoyo. En tres cuartos todavía se aprecia la construcción por piezas, especialmente en caderas, rodillas y borde superior de botas.
- A 64 px los dedos y rasgos faciales se reducen a pocos píxeles. Las piernas en reposo y martillo elevado se superponen bastante de perfil; la preparación ofrece mejor separación.
- El arma puede ocultar parte del rostro en tres cuartos en preparación y agachado. No se ha reducido su tamaño para ocultar este compromiso de composición.
- La compensación de apoyo ajusta posiciones de pelvis/caderas solo para inspección estática. No debe convertirse directamente en tracks de combate sin revisar arcos, apoyos y continuidad temporal.
- No hay límites articulares ni prevención de colisiones para ajustes manuales arbitrarios. Los extremos del deslizador pueden provocar penetraciones o despegar los pies.
- Es un rig rígido `Group`, no `Bone`/`SkinnedMesh`; no se garantiza edición como esqueleto en PixelOver.

## Siguiente decisión

Revisar artísticamente los presets y aceptar o ajustar la silueta antes de implementar `Idle` y `HammerHeavyAttack`. La fase B.2 proporciona geometría refinada y herramientas de validación; no constituye aprobación artística del usuario ni validación del pipeline GLB/PixelOver.
