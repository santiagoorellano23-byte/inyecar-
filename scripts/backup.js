// Uso: npm run backup  [-- --destino <carpeta>]
// Sin --destino (también la tarea programada del alojamiento, que llama a este archivo): respaldo diario comprobado
// en la carpeta «respaldos» junto a la de datos, con restauración aislada, una sola ejecución a la vez y retención
// de las últimas 7 copias diarias (ver respaldo-diario.js).
// Con --destino: copia simple a esa carpeta (por ejemplo, otro disco), sin borrar nada.
import path from 'node:path';
import { crearRespaldo } from '../server/respaldo.js';
import { archivoBase, carpetaArchivos } from '../server/config.js';

const i = process.argv.indexOf('--destino');
if (i < 0) {
  await import('./respaldo-diario.js');
} else {
  const destino = path.resolve(process.argv[i + 1]);
  const { dir, manifiesto } = await crearRespaldo({ archivoBase: archivoBase(), carpetaArchivos: carpetaArchivos(), destino });
  console.log('Respaldo creado en', dir);
  console.log('Registros:', JSON.stringify(manifiesto.base.conteos));
  console.log('Archivos privados copiados:', manifiesto.archivos.length);
  console.log('Guardá esta carpeta fuera del servidor (por ejemplo, en otro disco o almacenamiento acordado).');
}
