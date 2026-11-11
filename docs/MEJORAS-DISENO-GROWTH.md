# INYECAR · aplicación del conjunto de herramientas de Growth Labs

Revisión local: 02/11/2026. Base: commit `344624a`, versión `0.3.0-rc.1`. Cambios de interfaz posteriores a la auditoría integral; sin publicación ni modificación del servidor, esquema o datos reales.

## Contexto y alcance

Se consultaron los chats **INYECAR**, **MI SISTEMA** y **Mejorar software de Inyecar**, el estado vigente de PROJECT.md, HANDOFF.md, DESIGN.md, las reglas del repositorio y la política canónica de Growth Labs. La implementación vigente usa HTML, CSS y módulos JavaScript, Node y SQLite integrados. No necesita instalar React para mejorar sus interacciones. Se conservan el diseño del taller, sus fuentes Barlow y Barlow Condensed, los iconos propios y las reglas de autorización, realización y cobro.

## Resultado aplicado

| Antes | Después | Motivo |
|---|---|---|
| Los avisos se retiraban con un tiempo fijo, incluso durante su lectura o uso | El tiempo se pausa con puntero o foco; los que tienen una acción esperan la decisión de la persona | Permitir leer y actuar sin apuro |
| Avisos nuevos podían retirar uno que tenía el foco o una acción pendiente | Se conservan ambas situaciones y se retiran primero los avisos transitorios | Evitar perder una acción y el foco |
| Texto largo competía con botones pequeños | Texto ajustable y botones de al menos 44 × 44 px; acción en fila propia en teléfono | Lectura y manejo táctil |
| El error se veía pero no se asociaba al campo para un lector de pantalla | `aria-describedby` enlaza ayuda y error; al limpiar se conserva la ayuda original | Recuperación accesible sin borrar lo escrito |
| Confirmaciones reutilizaban el mismo identificador | Identificadores únicos y descripción accesible; se conservan Escape, foco y cancelación | Semántica y navegación fiables |
| Una consulta fallida anterior podía reemplazar una pantalla posterior | El render ignora respuestas que ya no corresponden a la navegación vigente | Mantener visible el destino elegido |
| Algunos controles conservaban detalles del navegador | Selección de texto, cursor, casillas y cifras de entrada siguen los colores y el ritmo del sistema | Consistencia tipográfica sin cambiar la identidad |

El movimiento nuevo se limita a una entrada de aviso de 180 ms y 6 px, usando CSS. `prefers-reduced-motion` elimina esa animación. No se agregaron animaciones a importes, estados de trabajo ni listas de operación frecuente.

## Herramientas: uso real y compatibilidad

| Herramienta o recurso | Decisión para esta revisión |
|---|---|
| Impeccable / criterios de diseño de interfaces | Aplicados al refinamiento existente, estados, contraste, objetivos táctiles y revisión visual. Detector final sin hallazgos en los tres archivos de implementación modificados |
| Criterios de animación y pulido de interfaz | Aplicados mediante CSS nativo, sin dependencias de ejecución nuevas |
| Tipografías | Se reutilizan Barlow y Barlow Condensed locales y su licencia existente. No se descargaron familias que competirían con la identidad aprobada |
| Iconos | Se conserva la familia SVG propia, incluidos motivos del taller. Lucide React no se instala en una aplicación sin React |
| Playwright + axe | Ejecutados desde el laboratorio existente de Growth Labs, con Chrome instalado. Verificación de rutas y estados; ninguna dependencia agregada al servidor |
| Lean-CTX | Política vigente de Growth Labs conservada. El aislamiento de rutas limita su lectura del repositorio hermano; se usó la lectura nativa permitida como alternativa. No se ampliaron permisos ni se activó RTK automático |
| Motion, Base UI, Sonner, shadcn | Reservados para proyectos React compatibles. Los formularios, confirmaciones y avisos nativos ya cubren estas necesidades en INYECAR |
| GSAP / Embla | No se justifican secuencias complejas ni carruseles en estas tareas del taller; no instalados aquí |
| Sharp / SVGO / recursos de imágenes | Sin assets nuevos ni necesidad de conversión en esta revisión; no ejecutados ni agregados al proyecto |
| Supabase, Vercel, Sites y otros servicios | No se migró el servidor, base ni alojamiento existente. Tener un plugin disponible no implica que esté integrado en este software |

La política permanente de adopción sigue en la base compartida de Growth Labs, `CONFIGURACION/HERRAMIENTAS_VISUALES.md` y `CONFIGURACION/CONTEXTO_Y_CONSUMO.md`. Este documento registra únicamente su aplicación en INYECAR; no crea otra política global ni afirma instalaciones en la computadora de Tommy.

## Verificación

- 49/49 pruebas automáticas del repositorio antes y después de los cambios.
- Hoy, Recibir, Mostrador, Autos y Caja a 1440, 768 y 390 px: 15 combinaciones, sin desborde horizontal de página ni infracciones detectadas por axe en WCAG A/AA comprobadas.
- Errores: texto conservado, vínculo a campo, ayuda original conservada al limpiar, foco recuperable.
- Envíos: bloqueo de doble envío y recuperación tras error utilizando los componentes reales en un formulario aislado sin escritura de negocio.
- Avisos: acción persistente, textos largos en móvil, pausa con teclado y puntero, conservación de acciones y foco ante avisos consecutivos.
- Confirmación: nombre, descripción, Escape y retorno de foco.
- Movimiento reducido: animación de aviso desactivada.
- Respuesta de error demorada simulada: no reemplaza la pantalla posterior.
- Sin errores JavaScript en los recorridos comprobados. Revisión visual de capturas en escritorio y móvil; no equivale a prueba física de teléfono ni evaluación completa con lector de pantalla.

Evidencia local y scripts de navegador: carpeta `outputs/inyecar/` y archivos `outputs/inyecar-*.mjs` del chat de herramientas, `C:/Users/Administrator/Documents/Codex/2026-10-30/referenced-chatgpt-conversation-this-is-an`. Los scripts reutilizan los paquetes de `outputs/growth-labs-ui-lab/node_modules`; no son dependencias del despliegue. El detector es una comprobación estática acotada, no una certificación de toda la aplicación.

## Revisión y continuidad

Vista local: `http://127.0.0.1:3113/#/hoy`, mientras el proceso siga abierto. Usa exclusivamente la nueva carpeta ignorada `demo-diseno-data`; no modifica las demostraciones anteriores ni el taller publicado. Los cambios están en el árbol de trabajo del repositorio vigente, sin commit ni publicación automática. Antes de una futura entrega, integrar esta revisión, actualizar coherentemente la versión de recursos y repetir la comprobación del paquete de publicación.

La siguiente intervención debe partir de estos archivos y de HANDOFF.md, no reinstalar el conjunto completo de herramientas ni repetir la auditoría inicial sin cambios que lo justifiquen.
