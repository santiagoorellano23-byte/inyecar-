# Despliegue automático en Hostinger

Reemplaza la subida manual del ZIP. La URL y el usuario del alojamiento no van en este repositorio: viven en hPanel y en la variable `INYECAR_URL` de GitHub (Settings → Secrets and variables → Actions → Variables).

## Cómo funciona

1. Se trabaja en una rama, se corre `npm test` y se integra en `main`.
2. El push a `main` dispara `.github/workflows/publicar.yml`:
   - corre `npm test` otra vez; si falla, no se publica nada;
   - arma el paquete con `scripts/empaquetar-hostinger.py` (la misma lista permitida del ZIP manual: sin pruebas, datos ficticios, bases ni claves) y anota el commit de `main` en `entrega.json`;
   - guarda ese paquete como un commit nuevo en la rama `produccion`.
3. Hostinger está conectado por su integración de GitHub a la rama `produccion` del mismo sitio. Cada commit nuevo dispara un build con la configuración guardada (Node 24, raíz `./`, entrada `servidor.cjs`, sin comando de compilación).
4. El workflow consulta `/salud` hasta que responde `{"ok":true,"version":"…","commit":"<commit de main>"}`. Si en 15 minutos no aparece, el workflow falla.

`produccion` la escribe solo el workflow. No se edita a mano.

## Qué se conserva entre versiones

- Base SQLite, fotos y adjuntos: en `INYECAR_DATOS`, fuera de la carpeta del código. El servidor no arranca si esa carpeta queda dentro de lo que el despliegue reemplaza (`server/config.js`).
- Variables de entorno: guardadas en hPanel; los builds no las tocan.
- Respaldos: el cron del alojamiento corre `scripts/backup.js` desde la versión publicada (`hbuilds/current/nodejs`) y escribe en su carpeta propia, también fuera del código. Por eso el paquete de `produccion` tiene que seguir trayendo `scripts/backup.js` y `restore.js`.
- Las migraciones son aditivas: una versión nueva abre los datos de la anterior.

## Comprobar qué está publicado

Abrir `<URL>/salud`. `version` es la de `package.json` y `commit` el de `main` publicado. Comparar con `git log origin/main -1`.

## Volver a una versión anterior

1. Elegir el commit de `main` que estaba bien (`git log --oneline origin/main`).
2. GitHub → Actions → «Publicar en Hostinger» → Run workflow → pegar ese commit.
3. El workflow lo prueba, lo publica en `produccion` y espera `/salud` con ese commit.

Los commits anteriores a este flujo no anotan el commit en `entrega.json`: el despliegue se hace igual, pero la espera de `/salud` falla por tiempo; en ese caso comprobar `version` a mano.

Volver atrás el código no vuelve atrás los datos. Como las migraciones son aditivas, una versión anterior sigue abriendo la base. Nunca restaurar un respaldo encima de datos nuevos sin conciliarlos.

Alternativa sin GitHub: hPanel → sitio → Despliegues → Redeploy con un ZIP armado por `scripts/empaquetar-hostinger.py`.
