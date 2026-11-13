# Despliegue automático en Hostinger

Reemplaza la subida manual del ZIP. La URL y el usuario del alojamiento no van en este repositorio: viven en hPanel y en la variable `INYECAR_URL` de GitHub (Settings → Secrets and variables → Actions → Variables). Las operaciones de la API de Hostinger están en `privado/hostinger-api.ps1`, fuera de git.

## Cómo funciona

1. Se trabaja en una rama, se corre `npm test` y se integra en `main`.
2. El push a `main` dispara `.github/workflows/publicar.yml`:
   - si falta `INYECAR_URL`, la ejecución falla al empezar y no publica nada;
   - corre `npm test` otra vez; si falla, no se publica nada;
   - arma el paquete con `scripts/empaquetar-hostinger.py` (la misma lista permitida del ZIP manual: sin pruebas, datos ficticios, bases ni claves) y anota el commit de `main` en `entrega.json`;
   - guarda ese paquete como un commit nuevo en la rama `produccion`.
3. Hostinger está conectado por su integración de GitHub a la rama `produccion` del mismo sitio. Cada commit nuevo dispara un build con la configuración guardada (Node 24, raíz `./`, entrada `servidor.cjs`, sin comando de compilación).
4. El workflow consulta `/salud` hasta que responde `{"ok":true,"version":"…","commit":"<commit de main>"}`. Si en 15 minutos no aparece, el workflow falla y lo anota en el resumen de la ejecución.

`produccion` la escribe solo el workflow. No se edita a mano.

## Protecciones

- **Una publicación por vez:** `concurrency` deja una sola ejecución en curso. Si llegan varias mientras tanto, GitHub conserva en la fila solo la más nueva.
- **Una ejecución vieja no publica:** en un push, si `main` ya avanzó a otro commit, la ejecución termina sin publicar (la del commit nuevo se encarga).
- **No se pisa una versión más nueva:** antes de publicar se lee el commit anotado en `produccion`. Si el commit a publicar no lo contiene, la ejecución falla, salvo que se haya pedido volver atrás a propósito (`volver_atras`).
- **Sin force push:** el commit nuevo de `produccion` se arma sobre el que se leyó. Si otra ejecución lo movió mientras tanto, el push se rechaza.

## Qué se conserva entre versiones

- Base SQLite, fotos y adjuntos: en `INYECAR_DATOS`, fuera de la carpeta del código. El servidor no arranca si esa carpeta queda dentro de lo que el despliegue reemplaza (`server/config.js`).
- Variables de entorno: guardadas en hPanel; los builds no las tocan.
- Respaldos: el cron del alojamiento corre `scripts/backup.js` desde la versión publicada (`hbuilds/current/nodejs`) y escribe en su carpeta propia, también fuera del código. Por eso el paquete de `produccion` tiene que seguir trayendo `scripts/backup.js` y `restore.js`.
- Las migraciones son aditivas: una versión nueva abre los datos de la anterior.

## Comprobar qué está publicado

Abrir `<URL>/salud`. `version` es la de `package.json` y `commit` el de `main` publicado. Comparar con `git log origin/main -1`.

## Volver a una versión anterior

1. Elegir el commit de `main` que estaba bien (`git log --oneline origin/main`).
2. GitHub → Actions → «Publicar en Hostinger» → Run workflow → pegar ese commit y marcar `volver_atras`.
3. El workflow lo prueba, lo publica en `produccion` y espera `/salud` con ese commit.

Los commits anteriores a este flujo no anotan el commit en `entrega.json`: el despliegue se hace igual, pero la espera de `/salud` falla por tiempo; en ese caso comprobar `version` a mano.

Volver atrás el código no vuelve atrás los datos. Como las migraciones son aditivas, una versión anterior sigue abriendo la base. Nunca restaurar un respaldo encima de datos nuevos sin conciliarlos.

## Volver a la publicación manual con ZIP

Si la integración con GitHub falla o hay que cortarla:

1. Quitar el auto-despliegue: `powershell -File privado\hostinger-api.ps1 volver-zip` (API `DELETE …/websites/{dominio}/git/auto-deployments/settings`). El sitio sigue con el último build; los pushes dejan de desplegar.
2. Armar el ZIP: `python scripts/empaquetar-hostinger.py <carpeta>`.
3. hPanel → sitio → Despliegues → Redeploy → Subir nuevos archivos → ese ZIP → Guardar y hacer redeploy. Es el mismo mecanismo usado hasta 0.6.2.

La configuración de build (Node 24, Other, raíz `./`, entrada `servidor.cjs`, npm) y las variables de entorno no cambian en ningún sentido.

## Parámetros de la API (Hostinger, `developers.hostinger.com`)

- `PUT /api/hosting/v1/accounts/{usuario}/websites/{dominio}/git/auto-deployments/settings` con `installation_uuid`, `owner`, `repository`, `branch: produccion`, `is_enabled: true`. En sitios Node.js no clona nada por sí solo.
- `POST …/websites/{dominio}/nodejs/builds` con `source_type: git`, `source_options` (`installation_uuid`, `owner`, `repository`, `branch`) y los ajustes guardados (`node_version`, `app_type`, `root_directory`, `output_directory`, `build_script`, `entry_file`, `package_manager`). Es el primer despliegue; después cada push a `produccion` dispara otro con los ajustes guardados.
- `GET …/nodejs/builds/{uuid}` y `…/logs` para seguir el build. `GET /api/hosting/v1/git/installations` y `…/{uuid}/repositories` para obtener la instalación de GitHub.
- La clave de API se crea en hPanel → API con vencimiento y se guarda cifrada en el equipo con `privado/hostinger-api.ps1 guardar-clave`. GitHub Actions no la necesita.
