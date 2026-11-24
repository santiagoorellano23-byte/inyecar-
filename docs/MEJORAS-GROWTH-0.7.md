# INYECAR 0.7.0 · mejoras de Growth Labs Talleres

Pedido del 24/11/2026: traer a INYECAR las mejoras visuales y de uso de Growth Labs Talleres (repositorio `taller-software`, commit `c78a147` del 20/11/2026) sin su modelo comercial. Growth Labs nació de INYECAR 0.6.1 con nombres técnicos neutrales; por eso se tomó su interfaz completa y se adaptó, en vez de copiar el proyecto encima.

## Qué se incorporó

- **Navegación:** columna lateral con «Recibir un auto», isla móvil con Recibir en lengüeta, hoja «Tu sesión» (tema, ayuda, salir), íconos Material locales en apartados y acciones.
- **Hoy:** encabezado con la marca, resumen con ilustraciones (según permisos), filtros deslizables, tarjetas con etapa de la orden, aviso de recepción sin terminar.
- **Recepción (7 pasos):** hoja progresiva con pasos hechos resumidos y editables; paso 1 «Auto» con búsqueda, ficha fija, patente con forma de chapa y detección de orden abierta; paso 2 «¿Cómo llega?» con fotos 4:3, hoja de origen (cámara o galería), reemplazo seguro, cancelar, reintentar y quitar con «Deshacer»; pasos 5 a 7 con alcance de la autorización y revisión en tarjetas con «Cambiar»; ante un corte, «Comprobar» reenvía con la misma clave sin duplicar.
- **Orden:** cabecera con las cinco etapas, «Ahora», dinero separado (autorizado, realizado, liquidado, cobrado, saldo) y «Toda la orden» desplegable; Revisión en tarjetas (hallazgos, revisión técnica por grupos); Presupuesto con barra, líneas desplegables y hoja de respuesta con borrador y verificación antes de reintentar.
- **Más, módulos y Ajustes:** Más agrupado por permisos; módulos con encabezado y volver; Ajustes «Consola grafito» con índice y barra de cambios pendientes.
- **Tipografía:** Geist, como Growth Labs Talleres (pedido del usuario, 24/11). Barlow Condensed sigue en patentes y Barlow en los documentos ya emitidos.
- **Servidor:** archivos comprimidos (gzip) con ETag y 304, sumado a la caché larga de recursos versionados de 0.6.4; el teléfono del cliente en el resumen de la orden; el mecánico ya no ve importes en el detalle de las versiones del presupuesto.

## Qué se adaptó o se dejó afuera

- **Identidad INYECAR:** nombre, isotipo (el del favicon), rojo propio como color de marca y modo oscuro grafito. No hay elección de colores en Ajustes: «Logo y colores» quedó como «Logo».
- **Sin modelo comercial:** no se trajeron planes, suscripciones, vencimientos, límites, avisos de renovación, «Mi plan», panel de Growth Labs ni el ingreso automático de la demo. Las migraciones 007 y 008 de Growth Labs no existen en INYECAR.
- **Compatibilidad de producción:** se mantienen `INYECAR_*`, `inyecar.db`, la cookie `iny_sesion` (las sesiones abiertas siguen valiendo), la cabecera `X-Inyecar` y las claves locales `inyecar-*` (borradores y tema guardados en los teléfonos).
- **Fotos de ingreso:** la pantalla de Growth Labs enviaba el formato 1; ahora arma el formato 2 de INYECAR (`registroIngreso` en `public/js/estado-ingreso.js`): cada daño con su foto, motor aparte, aclaración opcional. Con testigos encendidos, cuáles son sigue siendo opcional (regla de 0.6.4). El servidor conserva qué muestra cada foto de tablero y exterior. La orden muestra los registros de los dos formatos.
- **Correcciones propias:** al terminar una carga en segundo plano el foco vuelve al control de la foto sin mover la pantalla; al cambiar de pantalla se cierran las hojas abiertas por la anterior; se recupera la posición tras una recarga con la cámara abierta.

## 0.7.1 (24/11/2026)

Pulido: el resultado de Recibir con orden abierta ya no lleva raya lateral; conserva el borde ámbar y la etiqueta «Orden abierta · N.º …». Sin cambios de datos, servidor ni migraciones.
