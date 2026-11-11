# INYECAR · verificación del rediseño A

**Candidata local 0.5.0-rc.1 · 10/11/2026. Sin publicar.**

## Qué se integra

- Recepción A de seis pasos, revisión editable y confirmación del servidor. Motivos y relato separados; autorización explícita; kilometraje desconocido sin inventar un número.
- Siete logos locales identificables y Otra; selección única accesible con teclado, en el orden solicitado. Las marcas siguen siendo texto compatible en la ficha.
- Más de B: cinco grupos, dieciséis herramientas con iconos Material Symbols Outlined, permisos y rutas reales.
- Hoy: Para hacer, Bloqueados y Listos para retirar, en móvil y escritorio. Tabla con dimensiones independientes y acciones reales.
- Isla Hoy, Taller, Recibir central, Clientes y Más. Oculta durante recepción y dentro de una orden.
- Orden: Resumen, Revisión, Trabajos, Repuestos e Historial. Presupuesto, control, entrega, liquidación, cobros y archivos siguen disponibles.
- Notas internas auditadas y persistentes; no generan cargos ni autorizaciones.

## Qué se probó

| Comprobación | Resultado y evidencia |
|---|---|
| Suite automática completa | **62/62**, cero fallos. `pruebas.log`. Incluye aislamiento entre talleres, roles, cobros, respaldo/restauración, migraciones e idempotencia. |
| Más por perfil | 16 accesos dueño, 10 recepción, 4 mecánico, abiertos en pantalla. `mas-accesos-dueno.json`, `mas-rutas-roles.json`, `roles-pantalla.json`. |
| Adaptación visual | Hoy, Más, Taller y resumen de orden en 360/390/430/1440: **16 combinaciones sin desbordes horizontales**. `pantallas-final.json`. La tabla amplia tiene su propio desplazamiento. |
| Recepción adaptable | Cuatro tamaños; logos de al menos 72 px de alto; isla ausente. `recepcion-final.json`. |
| Auto nuevo | Creación real en base ficticia, selección Otra y regreso a Fiat, relato y motivos, Sin lectura, revisión sin costo, edición desde revisión. Una orden confirmada. |
| Auto conocido | Ficha existente QA 801 ZX; lecturas 50.000 y 80.000; 70.000 exige aclaración en Paso 3. Edición del relato y confirmación usando la misma ficha. `km-validacion.png`. |
| Respuesta perdida | Servidor de QA interrumpe una respuesta después del guardado. Formulario bloquea edición; recarga recupera borrador; reintento confirma **una sola orden**. `respuesta-perdida.png`, `reintento-confirmado.png`, `reintento.json`. |
| Orden | Cinco pestañas abiertas y nota interna guardada y leída en actividad. `orden-tabs.json`. |
| Interacción | Radios de marca con flechas de teclado; modo oscuro; altura reducida 390×420 con campo enfocado, letra efectiva16 px y pie estático. `marcas.json`, `recepcion-oscuro-390.png`, `recepcion-baja-altura.png`. |

La evidencia está en `evidence/redisenio-2026-11-10/`. Las capturas `final-*` y los JSON `*-final` reemplazan mediciones iniciales tomadas antes de corregir el desborde del resumen.

## Revisión independiente y correcciones

El revisor encontró cuatro defectos materiales y puntuó los cuatro **resolved** después del lote de correcciones:

1. Asignado a mí: el servidor devuelve una lista en los tres roles y la vista tolera ausencia.
2. Borrador de otro ingreso: destino explícito aísla turno y datos; la identidad de un envío incierto se conserva. Servidor rechaza turno con patente incompatible, sin guardar ni cambiar el turno.
3. Hoy escritorio: tres grupos incorporados; búsqueda oculta grupos sin coincidencias.
4. Kilometraje: comparación contra la lectura vigente, en el paso correspondiente.

Veredicto **ship**, limitado a la candidata local y al cierre de esos cuatro hallazgos. No es una certificación de todo el software ni una garantía de cero errores.

## Límites y siguiente paso

- No se operó producción ni se cambiaron las cinco cuentas reales. Esta demo utiliza datos ficticios.
- No hubo teléfono físico conectado. Quedan por comprobar teclado de iOS/Android, cámara y áreas seguras en un dispositivo real.
- El cargador/detector Impeccable quedó bloqueado por la política de herramientas; se usaron lectura directa del contexto, revisión visual y revisión independiente. No se afirma una ejecución del detector ni de axe en esta candidata.
- WhatsApp/correo automáticos e IA no se activan por este rediseño; siguen sujetos a la configuración de sus proveedores. No se simulan como funcionando.
- El paquete de Hostinger es una candidata de ejecución, sin bases, adjuntos, claves, pruebas o controladores del prototipo. Antes de publicar: respaldo actual y copia externa, actualización preservando la carpeta de datos, y comprobación del despliegue autenticado.
