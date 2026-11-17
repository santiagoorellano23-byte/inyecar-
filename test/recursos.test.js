import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

test('cada página y módulo carga recursos de la misma entrega, incluidas las vistas dinámicas', () => {
  const root = fileURLToPath(new URL('../', import.meta.url));
  const version = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version;
  let referencias = 0;
  function revisar(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const f = path.join(dir, e.name);
      if (e.isDirectory()) { revisar(f); continue; }
      if (!/\.(html|js)$/.test(e.name)) continue;
      const texto = fs.readFileSync(f, 'utf8');
      const patron = e.name.endsWith('.html')
        ? /(?:src|href)="(\/[^"?]+\.(?:js|css))([^"\s]*)"/g
        : /(?:from\s*|import\s*\(\s*|import\s*)['"`]([^'"`]+\.js)([^'"`]*)['"`]/g;
      for (const m of texto.matchAll(patron)) {
        assert.equal(m[2], `?v=${version}`, `${f}: ${m[1]}`);
        if (!m[1].includes('${')) {
          const destino = m[1].startsWith('/') ? path.join(root, 'public', m[1]) : path.resolve(path.dirname(f), m[1]);
          assert.ok(fs.existsSync(destino), `Recurso ausente: ${destino}`);
        }
        referencias++;
      }
    }
  }
  revisar(path.join(root, 'public'));
  assert.ok(referencias > 40);
  assert.ok(fs.readFileSync(path.join(root, 'public/js/app.js'), 'utf8').includes('views/${r.modulo}.js?v=' + version));
});

test('solo los recursos de la versión publicada se guardan en caché; las páginas siempre se revalidan', async () => {
  const { levantar } = await import('./entorno.js');
  const E = await levantar({ sembrarDatos: false });
  try {
    const version = JSON.parse(fs.readFileSync(fileURLToPath(new URL('../package.json', import.meta.url)), 'utf8')).version;
    const cache = async (ruta) => (await fetch(E.base + ruta)).headers.get('cache-control');
    assert.equal(await cache(`/js/app.js?v=${version}`), 'public, max-age=31536000, immutable');
    assert.equal(await cache(`/css/app.css?v=${version}`), 'public, max-age=31536000, immutable');
    // Una versión futura o vieja nunca queda fijada: el CDN podría guardar contenido equivocado bajo esa dirección.
    assert.equal(await cache('/js/app.js?v=9.9.9'), 'no-cache');
    assert.equal(await cache('/js/app.js'), 'no-cache');
    assert.equal(await cache(`/index.html?v=${version}`), 'no-cache');
    assert.equal(await cache('/'), 'no-cache');
  } finally { await E.cerrar(); }
});
