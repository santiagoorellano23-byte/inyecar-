# Rediseño A · revisión local · 10/11/2026

Pedido: implementar la propuesta A «Paso a paso», Más de B y logos de siete marcas + Otra. Se preservan las operaciones y los permisos del software existente. Este documento describe una candidata local 0.5.0-rc.1; no prueba ni solicita un despliegue.

## Direction contract

**THESIS.** Una decisión de recepción por pantalla y una próxima acción clara por orden. La interfaz se conecta con el servidor real; no ejecuta el runtime de los prototipos.

**OWN-WORLD.** Referencia aprobada A: Barlow local, tinta oscura, rojo INYECAR, fondo gris, controles blancos redondeados. Más reutiliza exactamente grupos, orden y nombres de Material Symbols Outlined de B. Se conserva la identidad existente y el botón sol/luna.

**STORY.** Buscar o cargar auto, registrar síntomas, kilometraje, autorización y opcionales; revisar y confirmar. El ingreso aparece solo tras la confirmación del servidor. Motivos y relato no se mezclan en el formulario.

**FIRST VIEWPORT.** Hoy agrupa Para hacer, Bloqueados y Listos para retirar. La isla tiene Hoy, Taller, Recibir, Clientes y Más; desaparece al recibir y dentro de la orden. La ficha tiene Resumen, Revisión, Trabajos, Repuestos e Historial; presupuesto, cobros, entrega y archivos siguen accesibles.

**FORM.** Propuesta A seleccionada expresamente por el usuario; Más de B. No hay nueva elección de concepto ni generación de imágenes. Logos identificativos locales, sin redibujos; trazabilidad en public/RECURSOS-REDISENO.json.

**FINISH.** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Integración

- Recepción usa `/api/visitas`, transacciones e idempotencia existentes. `005_recepcion_guiada.sql` añade una columna nullable; no reemplaza registros previos.
- Motivos y relato se guardan estructurados; `motivo` conserva el resumen compatible para pantallas y documentos anteriores.
- Borrador por usuario y taller en sessionStorage, hasta 24 horas, solo en esa pestaña. No se anuncia como recepción ni sincronización entre dispositivos. Si no puede conservarse, permanece el aviso de cambios sin guardar.
- No cambia perfiles reales: los cinco administradores siguen como estaban. Mecánicos restringidos no reciben un permiso de recepción nuevo.
- Notas internas se guardan en el historial auditado; no agregan presupuesto ni cobros. El servidor comprueba taller y asignación.
- Conexiones externas abre su pantalla de estado real. WhatsApp/correo automáticos e IA siguen condicionados a sus proveedores; no se simula actividad. QR con cámara depende de HTTPS y soporte del dispositivo.

## Verificación final

62/62 pruebas automáticas aprobadas después de las correcciones. Matriz final de 16 combinaciones de pantalla/tamaño y recepción en 360, 390, 430 y 1440 px sin desborde horizontal. Evidencia en `evidence/redisenio-2026-11-10/`; informe en `QA-REDISENO-A-2026-11-10.md`.

Recorridos de auto nuevo y conocido, marca Otra, edición desde revisión, borrador recuperado y confirmación real completados con datos ficticios. Treinta accesos de Más abiertos entre dueño, recepción y mecánico. Respuesta interrumpida después de guardar: recarga y reintento conservaron una sola orden.

Revisión independiente: cuatro hallazgos corregidos (asignaciones, turno heredado, grupos en escritorio y lectura anterior de km); pase de veredicto **ship** limitado a esas correcciones y a la candidata local. No equivale a publicación ni garantía de ausencia de defectos.

La emulación verifica geometría y poco alto disponible. Teclado de iOS/Android, áreas seguras y cámara requieren un teléfono físico. No hay uno conectado en esta revisión.
