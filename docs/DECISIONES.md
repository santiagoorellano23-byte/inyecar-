# Decisiones técnicas · 21/10/2026

Actualización 22/10/2026: se verificó el plan Unlimited y se publicó 0.2.1. Mejoras 0.2.2 en `CIERRE-0.2.2.md`. La mención de alojamiento pendiente que sigue es histórica. Se incorporaron las licencias oficiales completas de ambas fuentes. La pausa del mediodía es opcional y no activa la página pública.

Tomadas para avanzar sin bloquear; todas son reversibles. Ninguna implica contratar servicios.

1. **Node.js 24 + SQLite integrado (`node:sqlite`), sin dependencias.** No requiere instalar paquetes ni servicios de base de datos. Un archivo de base por instalación; los talleres comparten la base y se separan por `taller_id` con claves compuestas que la propia base hace cumplir. Si el volumen o el alojamiento lo exigen, el esquema se puede pasar a PostgreSQL/MySQL.
2. **Interfaz sin compilación** (HTML, CSS y módulos de JavaScript). Facilita mantener y desplegar en un alojamiento simple. Reproduce el diseño elegido en Claude Design; no usa el runtime de esa exportación.
3. **Sesiones de servidor con cookie HttpOnly + cabecera propia** contra solicitudes de otros sitios. Contraseñas con scrypt. Sin proveedor de correo: invitaciones y recuperaciones son enlaces de un solo uso que el dueño entrega por un medio seguro.
4. **Permisos por acción en el servidor** (`server/permisos.js`) para dueño, recepción y mecánico. El mecánico no ve importes ni cobros y solo actúa sobre visitas asignadas (o sin responsable). A validar con el taller.
5. **Regla única de stock:** entra solo al recibir una compra; sale al colocar un repuesto del taller, al registrar un producto usado o al vender. Pedido y llegada no mueven stock. A validar con el taller (¿compran por trabajo o tienen depósito?).
6. **Liquidación** sobre trabajos autorizados y realizados; señas hasta lo autorizado. **Entrega con saldo** permitida a recepción con confirmación y nota: regla a confirmar con el dueño.
7. **Cambio sobre una línea autorizada:** versión nueva, la línea anterior queda «reemplazada» con su autorización; el trabajo no se marca realizado hasta responder; si el cliente rechaza el cambio, vuelve a regir lo anterior.
8. **Fuentes Barlow servidas desde el propio servidor**, extraídas del diseño exportado (licencia OFL). No dependen de Google Fonts.
9. **Escenario de prueba único del Etios** (el de la demo amplia: 84.150 km, problema trasero, próximo service 88.420 km o 12/05/2027). Datos ficticios marcados «(prueba)» / «(ficticio)».
10. **Integraciones inactivas** (WhatsApp/correo automáticos, IA): se muestran con lo que necesitan y su alternativa manual. No se simulan envíos ni respuestas.

11. **Entrega con saldo configurable por taller (0.2.0):** dueño y recepción (valor inicial, el comportamiento anterior), solo el dueño, o no se entrega con saldo. Siempre exige confirmación y motivo; se guardan el saldo, la regla vigente y quién la autorizó. Lo aplica el servidor.
12. **Demostración marcada:** los talleres de prueba llevan `demo: true`. La interfaz lo muestra («Demostración · datos ficticios»), `seed --reiniciar` solo borra bases de demostración y `crear-taller` no mezcla un taller real con ellas.
13. **Logo de INYECAR en la demostración:** recorte del archivo que el usuario identificó como logo (`scripts/recursos/logo-inyecar.png`), sin editar el diseño. Uso interno; no se publicó. Dirección, teléfono y horarios quedan vacíos hasta que el dueño los confirme; la localidad (Tunuyán, Mendoza) está verificada en el brief.
14. **Detrás de un proxy** la IP del cliente se toma de `X-Forwarded-For` solo con `INYECAR_PROXY=1`.

## Pendientes que dependen de terceros o del taller

- Alojamiento: comprobar si el plan de Hostinger ejecuta Node.js 24 con disco persistente y HTTPS. Si no, elegir alternativa. No se contrató nada.
- Logo original y datos públicos confirmados del taller (dirección, teléfono, horarios, servicios).
- Fotos del taller: ya tomadas por el usuario; falta elegir cuáles se publican (no se usó ninguna).
- Reglas a confirmar: entrega con saldo (configurable; falta la decisión del dueño), quién puede cobrar, stock propio vs. compra por trabajo, retiros sin terminar, garantías, permisos del mecánico.
- Respaldo: destino, frecuencia y responsable.
- Funcionamiento sin conexión y sincronización: pendiente de la respuesta del taller.
- Lectura de QR con cámara: probar en los teléfonos del piloto (requiere HTTPS y navegador compatible).
