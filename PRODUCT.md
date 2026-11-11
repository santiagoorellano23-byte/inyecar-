# Producto · INYECAR operación

Sistema de gestión para talleres mecánicos con INYECAR como primer taller. Administración y recepción organizan, presupuestan y cobran según permisos; mecánicos trabajan en órdenes asignadas o sin responsable. La pregunta operativa es qué requiere atención ahora y cuál es la siguiente acción segura.

El producto recorre recibir → revisión → presupuesto versionado y respuesta → trabajo y repuestos → control → listo → liquidación → cobro → entrega → historial por patente. También conserva Mostrador, Agenda, Repuestos/compras, Clientes, Caja/cuentas, Reportes, documentos, Biblioteca y configuración. Objetos: vehículo/contacto; visita/orden; línea versionada/respuesta; repuesto/reserva; tarea/control; cargo/pago/entrega; artículo/compra/venta; turno; documento fechado.

## Compromisos durables

- Desde la versión 0.6.0, todo ingreso nuevo registra fotos de tablero y exterior en el paso2; daños previos requieren detalle fotográfico y observación. El servidor exige el registro, lo vincula a la orden y conserva el original. Órdenes anteriores no reciben información retroactiva. Contrato en docs/FOTOS-INGRESO.md.

- Autorizado, realizado, liquidado y cobrado son dimensiones distintas. Recibido no significa colocado; listo no significa entregado; desconocido no significa cero.
- Una modificación de algo autorizado crea una nueva versión y requiere su propia respuesta. Conservar antecedentes y documentos emitidos; lo postergado no se cobra.
- Guardar es explícito. Las correcciones crean movimientos o versiones con motivo; no borrar registros de dinero, stock ni documentos. Mostrar destinatario, importe, medio y efecto antes de operaciones de dinero.
- El servidor filtra por taller y comprueba permisos, asignación y estados. Ocultar un botón no sustituye esa comprobación. Los cinco administradores reales existentes son una decisión deliberada del usuario; este rediseño no los modifica.
- Conservar logo y marca existentes, fuentes locales, lenguaje del taller, foco de teclado y movimiento reducido.
- No inventar tarifas, servicios, actividad o datos. Datos ficticios pertenecen a pruebas aisladas; no se incorporan al paquete de ejecución. Los originales y archivos privados permanecen fuera de los recursos públicos.
- Preparar un aviso no es enviarlo. WhatsApp/correo automáticos e IA dependen de proveedores y autorización; comunicar su estado real y alternativa manual.
- ARCA y Libro IVA están excluidos. Los documentos del sistema no son facturas ni adquieren validez fiscal por el diseño.
- Entrega con saldo sigue la regla configurada del taller, con confirmación, motivo y registro.

## Decisión vigente del 10/11/2026

Dirección aprobada: A «Paso a paso», únicamente Más de B. Contrato y límites en `docs/REDISENO-A-2026-11-10.md`; sistema visual en `DESIGN.md`. Candidata local 0.5.0-rc.1, sin nueva publicación. La recepción usa las transacciones y la idempotencia existentes; el ingreso solo queda confirmado tras responder el servidor. El borrador temporal no es sincronización entre dispositivos.

La verificación funcional y visual corresponde al informe de QA y su evidencia. Emular teléfono no valida teclado, áreas seguras ni cámara en un dispositivo físico; QR con cámara requiere HTTPS y soporte del navegador.

Fuentes: README.md, PROJECT.md, CLAUDE.md, docs/DECISIONES.md, docs/MATRIZ.md y contrato vigente. Las versiones y afirmaciones históricas de estos documentos no acreditan el estado publicado de la candidata.
