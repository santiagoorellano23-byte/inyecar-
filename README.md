# INYECAR · gestión para talleres

Versión 0.5.0. Aplicación web para recibir vehículos, organizar órdenes, registrar revisión, presupuesto y autorización, repuestos, trabajo, control, cobros y entrega.

## Requisitos y demostración

Node.js 24 o posterior, con SQLite integrado. Sin dependencias externas ni compilación.

```sh
npm run seed
npm start
```

Abrir http://127.0.0.1:3000. La demostración usa exclusivamente datos ficticios. Los usuarios de prueba se definen en scripts/seed.js y nunca se incluyen en el paquete para el alojamiento. No ejecutar seed sobre una instalación real.

## Verificación

```sh
npm test
```

La entrega 0.5.0 pasó 63 pruebas automáticas. Cubren permisos, aislamiento por taller, recepción, idempotencia, presupuestos, cobros, stock, archivos, migraciones y respaldo/restauración.

## Operación

- Recepción guiada de seis pasos, borrador temporal y confirmación del servidor.
- Hoy organizado en Para hacer, Bloqueados y Listos para retirar.
- Órdenes con Resumen, Revisión, Trabajos, Repuestos e Historial.
- Agenda, clientes, compras, proveedores, stock, mostrador, caja, cuentas, reportes, documentos, biblioteca y configuración.
- Perfiles y permisos comprobados en servidor. Datos separados por taller.
- Autorizado, realizado, liquidado y cobrado son registros distintos. Listo no significa entregado.
- La aplicación no es un sistema fiscal: ARCA y Libro IVA están excluidos.
- Mensajería automática e IA requieren proveedores y configuración; no se simulan envíos.

## Instalación real

Definir INYECAR_DATOS con una ruta absoluta fuera del código y de cualquier carpeta reemplazada por el despliegue. Configurar NODE_ENV=production, INYECAR_SEGURO=1 e INYECAR_URL_PUBLICA con la URL HTTPS. Usar INYECAR_PROXY=1 solo detrás del proxy del alojamiento.

Crear el taller con npm run crear-taller. Las invitaciones y recuperaciones son enlaces personales de un uso; el responsable los entrega por un medio seguro. No publicar esos enlaces ni bases o archivos privados.

## Respaldos y actualizaciones

```sh
npm run backup
npm run restore -- /ruta/respaldo --destino /ruta/nueva
python scripts/empaquetar-hostinger.py /ruta/salida
```

Antes de actualizar: generar y descargar un respaldo actual, comprobar su restauración aislada y conservar las variables de entorno. El paquete de ejecución excluye pruebas, datos ficticios y credenciales; inicia con servidor.cjs y Node24. Las migraciones son aditivas. No reemplazar la carpeta de datos.

Después de publicar: comprobar /salud, iniciar sesión y revisar los datos existentes. La emulación móvil no sustituye la aceptación en teléfono físico, cámara y teclado.

## Estructura

server/ contiene reglas, permisos, rutas y migraciones; public/ la interfaz y recursos locales; scripts/ las utilidades; test/ las pruebas. PRODUCT.md y DESIGN.md conservan las decisiones de producto y diseño.

Los recursos de terceros mantienen sus licencias y procedencia en public/RECURSOS-REDISENO.json y los archivos de licencia correspondientes. Las marcas identifican vehículos y no implican afiliación.
