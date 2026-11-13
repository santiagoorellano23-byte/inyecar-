// Uso (tarea programada diaria): node scripts/respaldo-diario.js [--conservar 7]
// Crea un respaldo, lo comprueba restaurándolo en una carpeta aislada y recién entonces borra las copias diarias
// que excedan la retención. Una sola ejecución a la vez. Si algo falla, conserva todas las copias anteriores,
// escribe el error en la salida y termina con código distinto de 0 (la tarea programada lo muestra).
import path from 'node:path';
import { respaldoDiario } from '../server/respaldo.js';
import { config, archivoBase, carpetaArchivos } from '../server/config.js';

const i = process.argv.indexOf('--conservar');
const conservar = i > 0 ? Number(process.argv[i + 1]) : 7;
if (!Number.isInteger(conservar) || conservar < 1) { console.error('--conservar tiene que ser un entero de 1 o más.'); process.exit(1); }
const destino = path.join(path.dirname(config.datos), 'respaldos');
try {
  const r = await respaldoDiario({ archivoBase: archivoBase(), carpetaArchivos: carpetaArchivos(), destino, conservar });
  console.log(new Date().toISOString(), 'Respaldo diario comprobado en', r.dir);
  console.log('Registros:', JSON.stringify(r.verificacion.conteos), '· archivos:', r.manifiesto.archivos.length);
  console.log(`Copias diarias conservadas: ${r.retencion.conservadas.length}; borradas por retención: ${r.retencion.borradas.join(', ') || 'ninguna'}`);
} catch (e) {
  console.error(new Date().toISOString(), 'ERROR en el respaldo diario:', e.message);
  console.error('No se borró ninguna copia anterior.');
  process.exit(1);
}
