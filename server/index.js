// Servidor de la plataforma para talleres. Node 24, sin dependencias externas.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { abrirBase, uno, migracionesPendientes } from './db.js';
import { Enrutador, crearManejador, servirEstatico } from './http.js';
import { config, archivoBase, carpetaArchivos } from './config.js';
import { respaldoPrevioAMigrar } from './respaldo.js';
import { documentoPublico } from './routes/documentos.js';
import { enviarArchivo } from './routes/adjuntos.js';
import { json } from './util.js';
import rutasSesion from './routes/sesion.js';
import rutasVehiculos from './routes/vehiculos.js';
import rutasVisitas from './routes/visitas.js';
import rutasStock from './routes/stock.js';
import rutasCaja from './routes/caja.js';
import rutasVentas from './routes/ventas.js';
import rutasPublico from './routes/publico.js';
import rutasAgenda from './routes/agenda.js';
import rutasSeguimientos from './routes/seguimientos.js';
import rutasAdjuntos from './routes/adjuntos.js';
import rutasDocumentos from './routes/documentos.js';
import rutasTaller from './routes/taller.js';
import rutasReportes from './routes/reportes.js';

const PUBLICO = path.join(config.raiz, 'public');
const VERSION = JSON.parse(fs.readFileSync(path.join(config.raiz, 'package.json'), 'utf8')).version;
// El paquete publicado trae entrega.json; si vino del despliegue automático, incluye el commit de main.
const COMMIT = (() => { try { const c = JSON.parse(fs.readFileSync(path.join(config.raiz, 'entrega.json'), 'utf8')).commit; return /^[0-9a-f]{40}$/.test(c) ? c : null; } catch { return null; } })();
const { renderDocumento, ESTILO_DOCUMENTO } = await import(pathToFileURL(path.join(PUBLICO, 'js', 'documento.js')).href);

export function crearServidor({ archivo = archivoBase() } = {}) {
  const db = abrirBase(archivo);
  const r = new Enrutador();
  for (const registrar of [rutasSesion, rutasVehiculos, rutasVisitas, rutasStock, rutasCaja, rutasVentas, rutasPublico, rutasAgenda, rutasSeguimientos, rutasAdjuntos, rutasDocumentos, rutasTaller, rutasReportes]) registrar(r);

  // Páginas públicas y recursos que no pasan por la API.
  async function extras(req, res, url) {
    const p = url.pathname;
    if (req.method !== 'GET') return false;
    let m;
    if ((m = /^\/d\/([A-Za-z0-9_-]{20,100})$/.exec(p))) {
      const d = documentoPublico(db, m[1]);
      res.setHeader('X-Robots-Tag', 'noindex, nofollow');
      if (!d) {
        res.writeHead(410, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Enlace no disponible</title><body style="font-family:system-ui;padding:24px;max-width:560px;margin:auto"><h1>Este enlace ya no está disponible</h1><p>Venció, fue desactivado o el documento se anuló. Pedile al taller una copia nueva.</p></body></html>');
        return true;
      }
      const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><link rel="stylesheet" href="/css/fuentes.css">
        <title>${String(d.contenido.titulo || 'Documento').replace(/[<>&"]/g, '')} · ${String(d.contenido.taller?.nombre || '').replace(/[<>&"]/g, '')}</title>
        <style>body{margin:0;background:#f3f3f2}${ESTILO_DOCUMENTO}.aviso{max-width:820px;margin:12px auto;padding:0 16px;font:14px system-ui;color:#555}</style></head>
        <body><p class="aviso">Copia compartida por el taller. Disponible hasta el ${new Date(d.expira).toLocaleDateString('es-AR')}.</p>${renderDocumento(d.contenido)}</body></html>`;
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(html);
      return true;
    }
    if ((m = /^\/publico\/logo\/([a-z0-9-]{2,60})$/.exec(p))) {
      const t = uno(db, 'SELECT id, config FROM talleres WHERE slug = ? AND activo = 1 AND publico = 1', m[1]);
      const c = t ? json(t.config, {}) : null;
      const a = c?.logoAdjuntoId ? uno(db, 'SELECT * FROM adjuntos WHERE taller_id = ? AND id = ?', t.id, c.logoAdjuntoId) : null;
      if (!a) { res.writeHead(404); res.end(); return true; }
      enviarArchivo(res, a);
      return true;
    }
    // Para el monitor del alojamiento: confirma que el proceso responde y la base abre. No muestra datos.
    if (p === '/salud') {
      let ok = true;
      try { uno(db, 'SELECT 1 AS uno'); } catch { ok = false; }
      res.writeHead(ok ? 200 : 503, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify({ ok, version: VERSION, ...(COMMIT ? { commit: COMMIT } : {}) }));
      return true;
    }
    if (/^\/t\/[a-z0-9-]{2,60}\/?$/.test(p)) { servirEstatico(res, PUBLICO, '/taller.html'); return true; }
    if (p === '/directorio' || p === '/directorio/') { servirEstatico(res, PUBLICO, '/directorio.html'); return true; }
    return false;
  }

  const manejador = crearManejador({ db, enrutador: r, publico: PUBLICO, seguro: config.seguro, extras });
  const servidor = http.createServer(manejador);
  servidor.db = db;
  return servidor;
}

// Si la versión nueva trae migraciones para una base con datos, primero deja una copia comprobada.
// Sin esa copia no migra ni arranca: preferimos el sitio caído a una base modificada sin respaldo.
async function respaldarAntesDeMigrar(archivo) {
  const pendientes = migracionesPendientes(archivo);
  if (!pendientes.length) return;
  const opciones = { archivoBase: archivo, carpetaArchivos: carpetaArchivos(), destino: path.join(path.dirname(config.datos), 'respaldos') };
  for (let intento = 1; ; intento++) {
    try {
      const { dir } = await respaldoPrevioAMigrar(opciones);
      console.log(`Respaldo previo a migrar (${pendientes.join(', ')}) en ${dir}`);
      return;
    } catch (e) {
      // Si justo corre el respaldo diario, se espera a que termine.
      if (!/en curso/.test(e.message) || intento >= 10) throw new Error('No se pudo respaldar antes de migrar; no se tocó la base. ' + e.message);
      await new Promise((r) => setTimeout(r, 30e3));
    }
  }
}

// Arranque: `npm start` (node server/index.js) o el archivo de entrada del alojamiento (servidor.cjs).
export async function arrancar() {
  await respaldarAntesDeMigrar(archivoBase());
  const servidor = crearServidor();
  const n = uno(servidor.db, 'SELECT COUNT(*) AS n FROM talleres').n;
  servidor.listen(config.puerto, config.host, () => {
    console.log(`Plataforma de talleres ${VERSION} lista en http://${config.host}:${config.puerto}`);
    console.log(`Datos en ${config.datos}`);
    if (!n) console.log('No hay talleres cargados. Para datos de prueba: npm run seed. Para un taller real: npm run crear-taller.');
  });
  const cerrar = () => { servidor.close(() => { servidor.db.close(); process.exit(0); }); setTimeout(() => process.exit(0), 3000).unref(); };
  process.on('SIGINT', cerrar);
  process.on('SIGTERM', cerrar);
  return servidor;
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) arrancar().catch((e) => { console.error('No se pudo arrancar la plataforma:', e.message); process.exit(1); });
