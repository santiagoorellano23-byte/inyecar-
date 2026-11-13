// Respaldo diario: copia comprobada, retención de 7, una ejecución a la vez, sin borrar nada si falla.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { abrirBase, migracionesPendientes, listaMigraciones } from '../server/db.js';
import { respaldoDiario, respaldoPrevioAMigrar, estadoRespaldo } from '../server/respaldo.js';
import { responderError } from '../server/http.js';

function entorno() {
  const raiz = fs.mkdtempSync(path.join(os.tmpdir(), 'inyecar-diario-'));
  const datos = path.join(raiz, 'datos');
  abrirBase(path.join(datos, 'inyecar.db')).close();
  fs.mkdirSync(path.join(datos, 'archivos'), { recursive: true });
  return { raiz, opciones: { archivoBase: path.join(datos, 'inyecar.db'), carpetaArchivos: path.join(datos, 'archivos'), destino: path.join(raiz, 'respaldos') } };
}
const carpetas = (d) => fs.readdirSync(d).sort();

test('Respaldo diario: conserva las últimas 7 copias comprobadas y no toca otras carpetas', async () => {
  const { raiz, opciones } = entorno();
  fs.mkdirSync(path.join(opciones.destino, 'respaldo-2026-01-01T00-00-00-viejo'), { recursive: true });
  fs.mkdirSync(path.join(opciones.destino, 'prepublicacion-0.5.0'), { recursive: true });
  const hechas = [];
  for (let i = 0; i < 9; i++) {
    const r = await respaldoDiario({ ...opciones, conservar: 7 });
    assert.equal(r.verificacion.ok, true);
    assert.ok(fs.existsSync(path.join(r.dir, 'verificado.json')));
    hechas.push(path.basename(r.dir));
    await new Promise((res) => setTimeout(res, 1100)); // nombres con segundos distintos
  }
  const quedan = carpetas(opciones.destino);
  assert.deepEqual(quedan.filter((n) => hechas.includes(n)), hechas.slice(2).sort(), 'quedan las 7 más nuevas');
  assert.ok(quedan.includes('respaldo-2026-01-01T00-00-00-viejo'), 'una copia sin comprobar no la borra la retención');
  assert.ok(quedan.includes('prepublicacion-0.5.0'));
  assert.ok(!quedan.some((n) => n.startsWith('.')), 'no quedan candados ni verificaciones temporales');
  assert.equal(estadoRespaldo(opciones.destino).reciente, true);
  fs.rmSync(raiz, { recursive: true, force: true });
});

test('Respaldo diario: si falla no borra copias anteriores, y no corre dos veces a la vez', async () => {
  const { raiz, opciones } = entorno();
  const primera = await respaldoDiario({ ...opciones, conservar: 1 });
  const antes = carpetas(opciones.destino);
  await assert.rejects(respaldoDiario({ ...opciones, archivoBase: path.join(raiz, 'no-existe.db'), conservar: 1 }), /No existe la base/);
  assert.deepEqual(carpetas(opciones.destino), antes);
  // Sin lugar en disco no empieza y lo dice.
  const original = fs.statfsSync;
  fs.statfsSync = () => ({ bavail: 1, bsize: 4096 });
  try { await assert.rejects(respaldoDiario({ ...opciones, conservar: 1 }), /Espacio insuficiente/); } finally { fs.statfsSync = original; }
  assert.deepEqual(carpetas(opciones.destino), antes);
  // Con otra ejecución en curso, esta no hace nada.
  fs.mkdirSync(path.join(opciones.destino, '.respaldo-en-curso'));
  await assert.rejects(respaldoDiario({ ...opciones, conservar: 1 }), /en curso/);
  fs.rmSync(path.join(opciones.destino, '.respaldo-en-curso'), { recursive: true });
  assert.ok(fs.existsSync(primera.dir));
  fs.rmSync(raiz, { recursive: true, force: true });
});

test('Migraciones: detecta las pendientes de una base con datos y deja una copia previa comprobada', async () => {
  const { raiz, opciones } = entorno();
  assert.deepEqual(migracionesPendientes(opciones.archivoBase), []);
  assert.deepEqual(migracionesPendientes(path.join(raiz, 'nueva.db')), [], 'una base nueva no necesita copia previa');
  const ultima = listaMigraciones().at(-1);
  const db = new DatabaseSync(opciones.archivoBase);
  db.prepare('DELETE FROM migraciones WHERE nombre = ?').run(ultima);
  db.close();
  assert.deepEqual(migracionesPendientes(opciones.archivoBase), [ultima]);
  for (let i = 0; i < 6; i++) { await respaldoPrevioAMigrar({ ...opciones, conservar: 5 }); await new Promise((res) => setTimeout(res, 1100)); }
  const previas = carpetas(opciones.destino).filter((n) => n.startsWith('previo-migracion-'));
  assert.equal(previas.length, 5);
  assert.equal(estadoRespaldo(opciones.destino).ultimaCopia, null, 'las copias previas a migrar no reemplazan al respaldo diario');
  fs.rmSync(raiz, { recursive: true, force: true });
});

test('Sin espacio en disco: error claro 507 y ninguna confirmación', () => {
  let estado, cuerpo;
  const res = { headersSent: false, setHeader() {}, writeHead(s) { estado = s; }, end(b) { cuerpo = JSON.parse(b); } };
  const original = console.error; console.error = () => {};
  try {
    responderError(res, Object.assign(new Error('ENOSPC: no space left on device, write'), { code: 'ENOSPC' }));
    assert.equal(estado, 507); assert.match(cuerpo.error, /sin espacio/);
    responderError(res, new Error('database or disk is full'));
    assert.equal(estado, 507);
  } finally { console.error = original; }
});
