# Matriz de funciones · 21/10/2026 · versión 0.2.0

**Lectura vigente, 02/11/2026:** esta tabla conserva la auditoría de la base original; no certifica por sí sola el estado publicado. Revisión POS actual: 0.3.0-rc.1 local; producción consultada: 0.2.5. Evidencia nueva y límites en [AUDITORIA-INTEGRAL.md](AUDITORIA-INTEGRAL.md). Los cinco integrantes reales tienen administración completa deliberadamente. Las pruebas de roles restringidos usan usuarios ficticios y no modifican esa decisión.

Actualización 22/10/2026: 0.2.2 prepara horario partido, disponibilidad por duración, Quitar logo, estado de respaldo y anulación tras compensar movimientos. 42 pruebas. Publicada observada: 0.2.1; desplegar antes de dar las mejoras por operativas. Cron diario creado, sin evidencia aún de ejecución automática. Ver `CIERRE-0.2.2.md`.

**0.2.0:** 33 pruebas pasan (`test/talleres.test.js` agrega 7). Recorrido completo por la interfaz, documentos en modo impresión, dos talleres con la misma patente y operación (actualización desde 0.1.0, respaldo y restauración, instalación nueva) verificados en esta ronda: ver `../QA.md`.

Actualización 0.1.1: 26 pruebas pasan, incluidas 5 en `test/correcciones.test.js`. La entrega bloquea trabajos cobrables realizados sin liquidar; una clave repetida con distinto contenido se rechaza; un fallo de conexión se informa como guardado sin confirmar. La evidencia visual de esta matriz corresponde a la revisión original. Ver `../ACTUALIZACION-0.1.1.md`.

Estados: **Comprobada** (prueba automática sobre la API real y revisión en pantalla), **Desarrollada** (funciona en pantalla y servidor, sin prueba automática específica o sin uso con personal), **Condicionada** (preparada pero inactiva por falta de una cuenta, proveedor o recurso externo). Ninguna función fue probada todavía con personal del taller ni en sus teléfonos.

Pruebas: `test/aceptacion.test.js` (16), `test/durabilidad.test.js` (1), `test/complementos.test.js` (4), `test/correcciones.test.js` (5), `test/talleres.test.js` (7). Todas pasan.

| # | Función | Código | Guardado y permisos | Reglas clave | Prueba de aceptación | Estado |
|---|---|---|---|---|---|---|
| 1 | Órdenes (visitas), comprobantes e historial | `server/routes/visitas.js`, `views/visita*.js`, `views/hoy.js`, `views/trabajos.js` | SQLite por taller; recepción recibe, mecánico asignado ejecuta, dueño todo | Revisión ≠ ejecución; listo ≠ entregado; entrega no marca pagado; visita relacionada sin garantía automática | Recorrido completo del Etios (API); recorrido 0.2.0 por la interfaz con adicional, rechazado, postergado, corrección de cobro, reintento y entrega con deuda | Comprobada |
| 2 | Clientes y vehículos | `routes/vehiculos.js`, `views/autos.js`, `views/ficha.js` | Por taller; misma patente en otro taller no se ve | Patente normalizada sin unir fichas; lecturas fechadas; desconocido ≠ 0; cambio de contacto conserva antecedentes; archivo con motivo | Separación entre talleres; lectura menor exige explicación | Comprobada |
| 3 | Presupuestos y autorizaciones | `routes/visitas.js` (presupuesto, modificar, respuestas), `views/visita-partes.js` | Recepción y dueño preparan y registran; mecánico ve sin importes | Versiones; autorización parcial; adicional no toca lo respondido; **cambiar algo autorizado conserva el original y pide respuesta**; validez configurable | «Cambiar el importe de un trabajo autorizado…» | Comprobada |
| 4 | Services y mantenimiento | `routes/visitas.js` (tareas, productos, próximo), plantillas en `routes/taller.js` | Mecánico asignado o dueño | Pendiente/Hecho/No aplica con explicación; productos con cantidad; próximo control por km/fecha confirmado por el técnico; reparación no reinicia el intervalo | Datos de prueba del service del Etios y del Onix; faltan 4.270 km | Comprobada |
| 5 | Agenda y solicitudes online | `routes/agenda.js`, `views/agenda.js`, `public/taller.html` | Recepción y dueño; solicitud pública sin sesión, limitada por IP y con campo trampa | Puestos y horarios por taller; sin superposición; solicitud queda sin confirmar; consulta pública con código + 4 dígitos del teléfono | «Agenda: solicitud online…» | Comprobada |
| 6 | Proveedores, productos y compras | `routes/stock.js`, `views/compras.js`, `views/proveedores.js` | Recepción registra; dueño anula y paga | Recepción una sola vez; remito/factura no se repiten por proveedor; factura vinculada no mueve stock; pago separado de la compra | «Compras y stock…» | Comprobada |
| 7 | Stock | `routes/stock.js`, `views/stock.js` | Ajustes solo dueño, con motivo | Existencia = suma de movimientos; reserva por repuesto; **se descuenta una sola vez al colocar**; pieza del cliente no toca stock; no queda negativo | «Recorrido completo del Etios…», «Compras y stock…» | Comprobada |
| 8 | Ventas de mostrador | `routes/ventas.js`, `views/mostrador.js` | Recepción vende; dueño anula | Stock una vez; saldo exige cliente; devolución y anulación con movimientos nuevos | «Compras y stock…», «Mostrador…» (API); pantallas revisadas sin desborde | Comprobada (API) |
| 9 | Cobros, cuenta corriente y caja | `routes/caja.js`, `views/caja.js`, `views/cuentas.js` | Recepción cobra; dueño anula y devuelve | Liquida solo lo realizado; seña hasta lo autorizado; idempotencia ante reintentos; anulación conserva el original; **entrega con saldo según la regla del taller** (dueño y recepción / solo dueño / no se entrega), con saldo, regla y motivo registrados | «Cobro parcial…», «Entrega con saldo: la regla de cada taller…»; corrección y reintento por la interfaz | Comprobada |
| 10 | Equipo y permisos | `server/permisos.js`, `routes/taller.js`, `routes/sesion.js`, `views/ajustes.js` | Contraseñas scrypt; sesiones de servidor; matriz por acción | Invitación de un solo uso; desactivar cierra sesiones; salir en todos los dispositivos y cierre por el dueño; siempre queda un dueño; registro de acciones | «Permisos por perfil», «Usuarios…», «Cierre de sesiones…» | Comprobada |
| 11 | Reportes y gráficos | `routes/reportes.js`, `views/reportes.js` | Solo dueño | Cada indicador define qué mide; margen solo con costos conocidos | «Los reportes coinciden con los movimientos de caja…» | Comprobada |
| 12 | Archivo y documentos con marca | `routes/documentos.js`, `public/js/documento.js`, `views/archivo.js`, `views/documento.js` | Emite recepción/dueño; anula dueño | Copia fechada con marca del momento; anular conserva; enlace público limitado, con vencimiento y revocable | «Documentos: copia fechada…»; presupuesto, recibo y resumen de entrega revisados en modo impresión con importes iguales a lo guardado (papel no probado) | Comprobada |
| 13 | Ayuda contextual | `public/js/ayuda.js`, `views/ayuda-vista.js` | Sin datos | 25 artículos por tarea, buscador, guía inicial; sin IA | Revisión en pantalla | Desarrollada |
| 14 | QR: generación y lectura | `public/js/qr-util.js`, `views/qr.js`, etiqueta en la visita | Abrir lo leído exige sesión del mismo taller | Solo abre rutas propias; código ajeno no se abre; alternativa manual por número o patente | Búsqueda por número aislada (API). Cámara **no probada en dispositivo**: depende de BarcodeDetector y HTTPS | Desarrollada (lectura condicionada al navegador) |
| 15 | Biblioteca técnica propia | `routes/adjuntos.js`, `views/biblioteca.js` | Carga mecánico/dueño; archivos privados | Confirmación de derechos; procedencia; búsqueda por marca/año | «Biblioteca: exige confirmar derechos…» | Comprobada (sin contenido incluido) |
| 16 | Calculadora de mano de obra | `routes/taller.js` (calculadora), `views/calculadora.js` | Recepción y dueño; tiempos los configura el dueño | Horas × valor hora del taller; antecedentes propios; no es precio de mercado | Revisión en pantalla | Desarrollada |
| 17 | Perfil público y directorio | `routes/publico.js`, `public/taller.html`, `public/directorio.html` | Voluntario, lo activa el dueño | Nunca publica clientes, autos ni trabajos | «Agenda: … no expone historial» (perfil y directorio) | Comprobada |
| 18 | Avisos manuales y seguimiento | `routes/seguimientos.js`, `views/pendientes.js`, mensajes en la visita | Recepción y dueño | Preparado ≠ abierto ≠ enviado; enviado solo con confirmación de una persona | «Avisos: preparar no es enviar…» | Comprobada |
| 19 | Avisos automáticos WhatsApp/correo | `routes/taller.js` (INTEGRACIONES) | — | Inactivo; no simula envíos | — | Condicionada: falta cuenta, proveedor, plantillas y costos |
| 20 | Asistente técnico con IA | ídem | — | Inactivo | — | Condicionada: falta proveedor, acceso, costos y reglas de datos |
| 21 | Estimación de mano de obra con IA | ídem | — | Inactiva; la calculadora no se etiqueta como IA | — | Condicionada: falta proveedor y antecedentes |

## Transversales

| Requisito | Estado | Evidencia |
|---|---|---|
| Separación por taller (datos, archivos, QR, exportación, documentos, configuración) | Comprobada | Claves compuestas en la base; `test/talleres.test.js` con la misma patente en dos talleres; revisión en pantalla como dueño del otro taller |
| Varios talleres: configuración independiente | Comprobada | Nombre, contactos, servicios, precios, usuarios, agenda, logo y regla de entrega por taller |
| Puesta en marcha de un taller nuevo | Comprobada | `crear-taller` → invitación → contraseña → «Para empezar» en Hoy (solo dueño) |
| Guardado real y persistencia tras reiniciar | Comprobada | `test/durabilidad.test.js` |
| Respaldo y restauración con archivos | Comprobada en carpeta aislada | `test/durabilidad.test.js` y por consola (`npm run backup` / `restore`); responsable, frecuencia y destino: **pendiente** |
| Actualización de base | Comprobada | Base de 0.1.0 abierta con 0.2.0: migraciones aplicadas, sin pérdidas |
| Publicación | Pendiente | Falta alojamiento con Node.js y disco persistente: `PUBLICAR.md` |
| Edición simultánea sin pisar datos | Comprobada | Versión por registro → 409 con mensaje y lo escrito en pantalla |
| Reintentos sin duplicar dinero | Comprobada | Clave de idempotencia en pagos y ventas |
| Error de conexión con estado claro | Comprobada en navegador | Corte simulado: «No se guardó: sin conexión», texto conservado |
| Cambios sin guardar | Comprobada en navegador | Aviso al cambiar de pantalla y al cerrar |
| Teléfono y computadora | Comprobada en navegador | 38 pantallas sin desborde a 320, 390 y 1440 px (0.2.0) |
| Funcionamiento sin conexión completo | No incluido | Pendiente de decisión del taller |
