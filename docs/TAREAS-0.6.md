# Tareas para cerrar la 0.6.0

Rama: `candidata/0.6.0-rc.3`. Base: la 0.6.0-rc.3 local (81 pruebas en verde), que agrega fotos obligatorias al recibir y la capa de movimiento. Producción sigue en 0.5.0.

Origen: revisión del 11/11/2026 de la recepción completa con datos ficticios, a 390 y 1440 px, como recepción: auto nuevo → fotos → motivo → km → autorización → opcionales → revisión → recibido → orden con fotos. El recorrido funciona. Lo que sigue son defectos y riesgos concretos.

Reglas de trabajo: `AGENTS.md`. Una tarea por commit, en este orden. Cada una termina con `npm test` en verde y, si toca pantalla, revisión a 390 y 1440 px en claro y oscuro.

## A. Para Antigravity

### A1 · La patente escrita junta nunca se formatea

- **Dónde:** `server/routes/vehiculos.js`, función `formatoPatente` (líneas 81–86).
- **Causa:** a las expresiones regulares les faltan las barras invertidas: dice `/s+/g`, `d{3}` y `d{3}`. Debe ser `/\s+/g`, `\d{3}` y `\d{3}`. Hoy «AA123QA» queda «AA123QA» en vez de «AA 123 QA». El error está desde la 0.2.0. No dañó datos, porque la patente se pasa a mayúsculas antes.
- **Hacer:** corregir solo esas tres expresiones.
- **Prueba:** agregar un caso en `test/talleres.test.js` que cree autos por la API y compruebe:
  - `aa123qa` → `AA 123 QA`;
  - `abc123` → `ABC 123`;
  - `AB  123  CD` → `AB 123 CD`;
  - `SIN PATENTE 1` queda igual;
  - buscar `AA123QA` sigue encontrando `AA 123 QA`;
  - la recepción guiada también formatea. Comprobar qué ruta usa `recibir-pasos.js` para crear el auto; si no pasa por `datosVehiculo`, decirlo antes de cambiar nada.
- **No hacer:** no reescribir las patentes ya guardadas ni agregar una migración. Lo cargado queda como está.

### A2 · El paso de fotos usa el control de archivo del sistema

- **Dónde:** `public/js/estado-ingreso.js`, función `dibujar()` (línea 16).
- **Problema en teléfono:** aparece «Seleccionar archivo · Sin archivos seleccionados». No invita a sacar la foto. Después de cargarla sigue diciendo «Sin archivos seleccionados» al lado de «Foto guardada», y las dos cosas se contradicen.
- **Hacer:** reemplazar el `<input type="file">` visible por dos botones grandes, con el patrón que ya existe en `public/js/views/qr.js:18`: un `<label class="btn">` que envuelve un input con clase `sr`.
  - **«Sacar foto»:** el principal, con `capture="environment"`.
  - **«Elegir de la galería»:** el secundario, sin `capture`.
  - Los dos con el mismo `accept="image/jpeg,image/png,image/webp"` y el mismo `onchange`.
  - Con foto cargada: miniatura más «Cambiar foto». Sin el texto del control nativo.
- **Criterios:**
  - altura mínima de 52 px (control de recepción en `DESIGN.md`);
  - foco visible con teclado sobre el label (`:focus-within`);
  - ningún texto «Sin archivos seleccionados»;
  - la carga, el reintento, el reemplazo y la idempotencia por `token` funcionan igual que hoy;
  - sin desborde a 360, 390 y 1440 px.

### A3 · «Quitar esta foto» aparece donde no corresponde

- **Dónde:** el mismo `dibujar()`.
- **Problema:** se ofrece quitar el tablero o el exterior obligatorios aunque estén vacíos.
- **Hacer:** mostrar «Quitar esta foto» solo si la ranura tiene foto o error, o si hay otra ranura del mismo tipo.
- **Criterio:** en un ingreso nuevo, las dos ranuras obligatorias vacías no muestran «Quitar».

### A4 · El error queda en rojo después de corregirlo

- **Problema:**
  1. Tocás Continuar sin fotos y aparece «Cargá las fotos pendientes…».
  2. Cargás las dos fotos.
  3. El mensaje y el borde rojo del campo «Qué muestra esta foto» siguen ahí, aunque ya está bien.
- **Dónde:**
  - `estado-ingreso.js`, `subir()` y el `oninput` de la descripción;
  - el mecanismo de errores de formulario, `limpiarErrores` y `aria-invalid` en `public/js/ui.js:113-141`.
- **Hacer:** cuando una carga termina bien o se edita una descripción, quitar el error del campo `fotosIngreso` (texto, `aria-invalid` y resumen de errores) sin validar todo el paso.
- **Criterio:** después de cargar lo que faltaba no queda texto de error ni borde rojo. Al volver a tocar Continuar, se valida normalmente.

### A5 · El texto de «Qué muestra esta foto» toca el borde

- **Problema:** el campo de descripción de cada foto no tiene margen interno a la izquierda (se ve a 390 y a 1440).
- **Hacer:** buscar en las 10 hojas qué regla anula el `padding` de `.rec-foto input` (ver el orden de la cascada en `AGENTS.md`) y corregirla en la hoja que decide. Sin `!important` nuevo.
- **Criterio:** el mismo margen interno que los demás campos de recepción, en claro y oscuro.

### A6 · Kilometraje sin separador en la revisión

- **Dónde:** `public/js/views/recibir-pasos.js:142`. Hoy dice `d.km+' km'`, que muestra «85000 km». La orden ya muestra «85.000 km».
- **Hacer:** usar el `km()` de `public/js/ui.js:12` con el número normalizado (sin puntos ni espacios).
- **Criterio:** la revisión muestra «85.000 km». «Sin lectura» sigue igual.

### A7 · Cerrar la versión (solo cuando el usuario lo indique)

Pasar a `0.6.0` en `package.json` y en todas las referencias `?v=` (`test/recursos.test.js` lo controla). Actualizar el estado en `README.md`, `PRODUCT.md` y `DESIGN.md`: «candidata local» pasa a la versión final, sin datos de producción. `npm test` completo.

## B. Propuesta: esperar el OK del usuario

### B1 · Revisión final más corta en el teléfono

El paso 7 muestra 18 filas. La mitad dice «No se cargó» o «No corresponde». La propuesta es mostrar solo lo cargado y agrupar el resto en «Datos opcionales sin cargar (N) · Cambiar». No se hace sin aprobación: cambia una pantalla aprobada.

## C. Bloqueos antes de publicar: usuario y Claude, no Antigravity

1. **Respaldo cada minuto.**
   - La tarea temporal del hosting ejecuta el respaldo completo (base y todos los archivos privados) en una carpeta nueva cada minuto, sin borrar las anteriores.
   - Con fotos obligatorias de varios MB por auto, el espacio crece muy rápido y puede llenar el disco. Si el disco se llena, la base deja de guardar.
   - Antes de publicar 0.6 hay que ver en hPanel el espacio y los inodos usados, y decidir:
     - retirar la tarea por minuto y dejar la diaria de las 06:30;
     - o cambiarla por una que conserve solo las últimas copias.
   - La decisión es del usuario, que pidió conservarla.
2. **Teléfono físico.** Sacar foto con la cámara en Android y en iPhone; elegir de la galería, incluidas fotos HEIC de iPhone y Samsung; tiempo de subida con datos móviles; teclado y áreas seguras. La emulación no prueba nada de esto.
3. **Fotos descartadas.** Las fotos de un borrador abandonado quedan guardadas sin purga automática. Se acepta para empezar, pero hay que controlar cuánto ocupan.
4. **Publicación.** El procedimiento está en `privado/` y lo ejecutan el usuario y Claude, no Antigravity:
   - respaldo real, descarga y restauración aislada;
   - paquete con `scripts/empaquetar-hostinger.py`;
   - nuevo despliegue del sitio existente;
   - `/salud` en 0.6.0;
   - migración 006 aplicada;
   - recorrido con sesión real.
