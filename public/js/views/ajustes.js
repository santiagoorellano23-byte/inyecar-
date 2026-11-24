// Ajustes del taller (solo dueño), dirección «Consola Grafito»: índice propio dentro del área de contenido,
// secciones con título y explicación junto a los campos, y barra de cambios pendientes en los formularios.
// La isla, el lateral y el encabezado global no cambian. Datos, permisos y guardado siguen siendo los del servidor.
import { get, post, put, api, claveDeEnvio } from '../api.js?v=0.7.1';
import { esc, icono, pesos, cant, fechaHora, chip, campo, casilla, alEnviar, limpiarErrores, toast, confirmar, aviso, copiar, aEntradaDinero, aEntradaCant, aLocal, hoyLocal } from '../ui.js?v=0.7.1';
import { entrada } from '../movimiento.js?v=0.7.1';

const GRUPOS = [['taller', 'El taller'], ['presencia', 'Presencia e imagen'], ['equipo', 'Equipo'], ['cuenta', 'Cuenta y datos']];
// [ruta, grupo, nombre, permiso, ícono, descripción]. Las rutas anteriores (#/ajustes/taller, /datos, /integraciones…) siguen valiendo.
const AREAS = [
  ['taller', 'taller', 'Datos del taller', 'config.taller', 'info', 'Nombre, contacto y dirección que salen en los documentos nuevos.'],
  ['presupuestos', 'taller', 'Presupuestos y entregas', 'config.taller', 'dinero', 'Validez de los presupuestos, valor de la hora y entrega con saldo pendiente.'],
  ['horario', 'taller', 'Horario de turnos', 'config.taller', 'reloj', 'Días de atención, apertura, cierre, intervalo y cierre del mediodía.'],
  ['catalogos', 'taller', 'Servicios y plantillas', 'config.taller', 'lista', 'Puestos de trabajo, servicios, plantillas de service y tiempos de la calculadora.'],
  ['publica', 'presencia', 'Página pública y directorio', 'config.taller', 'enlace', 'Qué se muestra al público, solicitudes de turno y listado de talleres.'],
  ['identidad', 'presencia', 'Logo', 'config.taller', 'foto', 'Logo del taller para los documentos.'],
  ['usuarios', 'equipo', 'Usuarios y permisos', 'usuarios.gestionar', 'usuarios', 'Personas con acceso, perfiles, invitaciones y qué puede hacer cada perfil.'],
  ['integraciones', 'cuenta', 'Conexiones externas', 'config.taller', 'mensaje', 'WhatsApp, correo e IA: qué requieren y qué usar mientras tanto.'],
  ['datos', 'cuenta', 'Exportación y respaldo', 'exportar', 'descargar', 'Descargar datos, archivos adjuntos y estado del respaldo completo.'],
  ['registro', 'cuenta', 'Registro de acciones', 'auditoria.ver', 'historial', 'Quién hizo cada cambio importante y cuándo.']
];
const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const ORDEN_DIAS = [1, 2, 3, 4, 5, 6, 0];
// Ancho del contenedor desde el que el índice queda al costado (igual que la consulta de contenedor en propuesta-a.css).
const ANCHO_INDICE = 960;

// Cambios sin guardar de cada área mientras se recorre Ajustes. Viven en memoria: se descartan al salir de Ajustes
// (con la confirmación habitual) o al recargar. `base` es el estado del servidor cuando se empezó a escribir.
const borradores = new Map();
let areaActual = '';
window.addEventListener('hashchange', () => { if (!location.hash.startsWith('#/ajustes')) borradores.clear(); });

export default async function ajustes({ params, app }) {
  const visibles = AREAS.filter((a) => app.puede(a[3]));
  const area = AREAS.find((a) => a[0] === params.seccion) || visibles[0] || AREAS[0];
  if (!app.puede(area[3])) return { titulo: 'Ajustes', html: `<div class="pagina"><h1 tabindex="-1">Sin acceso</h1><p>Esta parte la administra el dueño del taller.</p></div>` };
  const lista = !params.seccion;
  areaActual = area[0];
  const v = await VISTAS[area[0]](app);
  const ayuda = area[0] === 'usuarios' ? 'usuarios' : area[0] === 'datos' ? 'respaldo' : 'guia';
  const indice = GRUPOS.map(([g, nombre]) => {
    const items = visibles.filter((a) => a[1] === g);
    return items.length ? `<p class="ajg-indice__grupo">${nombre}</p><ul>${items.map(([k, , n, , ic, d]) => `<li><a href="#/ajustes/${k}" data-area-enlace="${k}"${k === area[0] ? ' aria-current="page"' : ''}>${icono(ic)}<span class="ajg-indice__txt"><span>${n}</span><small>${d}</small></span>${icono('der', 'ajg-indice__ir')}</a></li>`).join('')}</ul>` : '';
  }).join('');
  const titulo = lista ? `<h2 class="ajg-titulo" tabindex="-1">${area[2]}</h2>` : `<h1 class="ajg-titulo" tabindex="-1">${area[2]}</h1>`;
  return {
    titulo: lista ? 'Ajustes' : `Ajustes · ${area[2]}`,
    html: `<div class="ajg" data-ajg${lista ? ' data-lista' : ''}><div class="ajg__marco">
      <nav class="ajg-indice" aria-label="Secciones de Ajustes"><div class="ajg-indice__cuerpo">
        ${lista ? '<h1 class="ajg-indice__titulo" tabindex="-1">Ajustes</h1>' : '<p class="ajg-indice__titulo">Ajustes</p>'}
        <p class="ajg-indice__intro">Cómo funciona el taller, quién lo usa y qué se muestra al público.</p>
        ${indice}
      </div></nav>
      <div class="ajg-area">
        <a class="ajg-volver" href="#/ajustes">${icono('izq')}Ajustes</a>
        <header class="ajg-cab"><div>${titulo}<p>${area[5]}</p></div>
          <div class="ajg-cab__acciones">${v.acciones || ''}<button type="button" class="btn btn-chico btn-texto" data-ayuda="${ayuda}">${icono('ayuda')}¿Cómo hago…?</button></div></header>
        ${v.html}
      </div>
      <form hidden data-ajg-borradores aria-hidden="true"></form>
    </div></div>`,
    despues(raiz) {
      const ajg = raiz.querySelector('[data-ajg]');
      // Sin área elegida, el área por defecto solo se ve con el índice al costado: el enlace actual se marca entonces.
      if (lista) {
        const enlace = ajg.querySelector('[aria-current="page"]');
        const ro = new ResizeObserver(() => {
          if (!ajg.isConnected) { ro.disconnect(); return; }
          if (ajg.clientWidth >= ANCHO_INDICE) enlace?.setAttribute('aria-current', 'page'); else enlace?.removeAttribute('aria-current');
        });
        ro.observe(ajg);
      }
      // Moverse entre áreas de Ajustes conserva lo escrito como borrador; salir de Ajustes pide confirmación.
      ajg.addEventListener('click', (e) => {
        const a = e.target.closest('a[href^="#/ajustes"]');
        if (!a || a.getAttribute('href') === location.hash) return;
        ajg.querySelectorAll('form[data-ajg-form], [data-ajg-borradores]').forEach((f) => delete f.dataset.sucio);
      });
      marcarBorradores(ajg);
      v.despues?.(raiz);
    }
  };
}

// ---------- Piezas comunes ----------
const sec = (titulo, detalle, cuerpo, { tarjeta = true, id = '' } = {}) => `<section class="ajg-sec"${id ? ` id="${id}" tabindex="-1"` : ''}><header><h2>${titulo}</h2>${detalle ? `<p>${detalle}</p>` : ''}</header>${tarjeta ? `<div class="ajg-tarjeta">${cuerpo}</div>` : `<div class="ajg-sec__cuerpo">${cuerpo}</div>`}</section>`;
const conSufijo = (html, sufijo) => html.replace(/(<input[^>]*>)/, `<span class="ajg-sufijo">$1<span aria-hidden="true">${esc(sufijo)}</span></span>`);
const interruptor = (nombre, titulo, detalle, marcado) => `<label class="ajg-sw" data-campo="${nombre}"><input type="checkbox" role="switch" name="${nombre}" value="1"${marcado ? ' checked' : ''}><span class="ajg-sw__pista" aria-hidden="true"></span><span class="ajg-sw__txt"><span class="ajg-sw__t1">${titulo}<span class="ajg-sw__si" aria-hidden="true">Activado</span><span class="ajg-sw__no" aria-hidden="true">Desactivado</span></span><span class="ajg-sw__t2">${detalle}</span></span></label>`;
const barraHTML = () => `<div class="ajg-barra-envoltura"><div class="ajg-barra" data-barra role="region" aria-label="Cambios sin guardar" inert>
  <p class="ajg-barra__msg" aria-live="polite"><span data-barra-icono>${icono('info')}</span><span><strong data-barra-titulo>Tenés cambios sin guardar</strong><small data-barra-detalle>Se aplican cuando tocás «Guardar».</small></span></p>
  <div class="ajg-barra__acciones"><button type="button" class="btn" data-descartar>Descartar</button><button type="submit" class="btn btn-primario" data-guardar>${icono('check')}Guardar</button></div></div></div>`;

const claveDe = (el) => el.type === 'checkbox' || el.type === 'radio' ? `${el.name}|${el.value}` : el.name;
function estadoForm(form) {
  const o = {};
  for (const el of form.elements) if (el.name && el.type !== 'file') o[claveDe(el)] = el.type === 'checkbox' || el.type === 'radio' ? el.checked : el.value;
  return o;
}
function aplicarEstado(form, o) {
  for (const el of form.elements) {
    if (!el.name || el.type === 'file' || !(claveDe(el) in o)) continue;
    if (el.type === 'checkbox' || el.type === 'radio') el.checked = o[claveDe(el)]; else el.value = o[claveDe(el)];
  }
}
function marcarBorradores(ajg) {
  if (!ajg) return;
  ajg.querySelectorAll('[data-area-enlace]').forEach((a) => {
    a.querySelector('.ajg-pendiente')?.remove();
    if (borradores.has(a.dataset.areaEnlace)) a.querySelector('.ajg-indice__txt > span').insertAdjacentHTML('beforeend', ' <span class="ajg-pendiente">Sin guardar</span>');
  });
  // Un borrador de otra área también cuenta como cambio sin guardar al salir de Ajustes o cerrar la pestaña.
  const marca = ajg.querySelector('[data-ajg-borradores]');
  if ([...borradores.keys()].some((k) => k !== areaActual)) marca.dataset.sucio = '1'; else delete marca.dataset.sucio;
}

// Formulario con barra de cambios pendientes: aparece al modificar, Guardar/Descartar, estado de guardado,
// éxito solo con respuesta del servidor y lo escrito intacto ante un error (alEnviar).
function formulario(app, area, cuerpo, { guardar, ok, despues, alDescartar, extra = '' }) {
  return {
    html: `<form class="form ajg-form" id="f-${area}" data-ajg-form="${area}" novalidate>${cuerpo}${barraHTML()}</form>${extra}`,
    despues(raiz) {
      const form = raiz.querySelector(`#f-${area}`);
      const control = conBarra(form, area, app, { guardar, ok, alDescartar });
      despues?.(raiz, form, control);
      control.revisar();
    }
  };
}
function conBarra(form, area, app, { guardar, ok, alDescartar }) {
  const barra = form.querySelector('[data-barra]');
  const ajg = form.closest('[data-ajg]');
  const base = JSON.stringify(estadoForm(form));
  let recuperado = false, bloqueo = '';
  const b = borradores.get(area);
  if (b && b.base === base) { aplicarEstado(form, b.valores); recuperado = true; } else borradores.delete(area);
  const mostrar = (estado) => {
    const visible = !!estado;
    barra.classList.toggle('ajg-barra--visible', visible);
    barra.toggleAttribute('inert', !visible);
    barra.dataset.estado = estado || '';
    const [t, d, ic] = {
      pendiente: ['Tenés cambios sin guardar', 'Se aplican cuando tocás «Guardar».', 'info'],
      recuperado: ['Tenés cambios sin guardar', 'Recuperamos lo que habías escrito en esta área.', 'info'],
      bloqueado: ['Falta corregir algo', bloqueo, 'alerta'],
      guardando: ['Guardando…', 'No cierres esta pantalla hasta que termine.', 'reloj'],
      error: ['No se guardó', 'Revisá el dato marcado. Lo que escribiste sigue acá.', 'alerta']
    }[estado] || ['', '', 'info'];
    barra.querySelector('[data-barra-titulo]').textContent = t;
    barra.querySelector('[data-barra-detalle]').textContent = d;
    barra.querySelector('[data-barra-icono]').innerHTML = icono(ic);
    barra.querySelector('[data-guardar]').disabled = estado === 'bloqueado';
    barra.querySelector('[data-descartar]').disabled = estado === 'guardando';
  };
  const revisar = () => {
    if (form.dataset.enviando) return;
    const valores = estadoForm(form);
    const sucio = JSON.stringify(valores) !== base;
    if (sucio) { form.dataset.sucio = '1'; borradores.set(area, { base, valores }); }
    else { delete form.dataset.sucio; borradores.delete(area); recuperado = false; }
    mostrar(sucio ? (bloqueo ? 'bloqueado' : recuperado ? 'recuperado' : 'pendiente') : null);
    marcarBorradores(ajg);
  };
  alEnviar(form, async (d) => {
    mostrar('guardando');
    try { await guardar(d); } catch (e) { mostrar('error'); throw e; }
    borradores.delete(area);
    delete form.dataset.sucio;
    toast(ok);
    app.recargar();
  });
  form.addEventListener('input', revisar);
  barra.querySelector('[data-descartar]').addEventListener('click', () => {
    aplicarEstado(form, JSON.parse(base));
    limpiarErrores(form);
    recuperado = false;
    alDescartar?.();
    // Un único evento para que los resúmenes y las vistas previas se vuelvan a pintar con lo guardado.
    form.dispatchEvent(new Event('input', { bubbles: true }));
    form.closest('.ajg-area')?.querySelector('.ajg-titulo')?.focus();
  });
  return { revisar, bloquear(motivo) { bloqueo = motivo || ''; revisar(); } };
}

// Diálogos y paneles propios de Ajustes. Se agregan al documento con el alcance visual de Ajustes (.ajg-dlg)
// para no cambiar los demás diálogos. El cierre es inmediato y el foco vuelve al control que lo abrió.
let nDialogo = 0;
function abrirDialogo({ titulo, detalle = '', cuerpo, lateral = true }) {
  const foco = document.activeElement;
  const d = document.createElement('dialog');
  const id = `ajg-dlg-${++nDialogo}`;
  d.className = `ajg-dlg ${lateral ? 'ajg-panel' : 'ajg-dlg--centro'}`;
  d.setAttribute('aria-labelledby', `${id}-t`);
  d.innerHTML = `<div class="ajg-dlg__cab"><div><h2 id="${id}-t">${esc(titulo)}</h2>${detalle ? `<p>${detalle}</p>` : ''}</div><button type="button" class="btn btn-texto btn-icono" data-cerrar-dialogo aria-label="Cerrar">${icono('x')}</button></div><div class="ajg-dlg__cuerpo">${cuerpo}</div>`;
  document.body.appendChild(d);
  d.querySelector('[data-cerrar-dialogo]').addEventListener('click', () => d.close());
  d.addEventListener('click', (e) => { if (e.target === d) d.close(); });
  d.addEventListener('close', () => { d.remove(); if (foco?.isConnected) foco.focus({ preventScroll: true }); });
  d.showModal();
  (d.querySelector('.ajg-dlg__cuerpo input:not([type=hidden]), .ajg-dlg__cuerpo select') || d.querySelector('[data-cerrar-dialogo]')).focus();
  return d;
}

// ---------- Datos del taller ----------
async function vTaller(app) {
  const { taller: t } = await get('/api/taller');
  const c = t.config;
  return formulario(app, 'taller', `
    ${sec('Identificación y contacto', 'Cómo te identifican tus clientes. Solo el nombre es obligatorio.', `<div class="ajg-grid2">
      ${campo({ nombre: 'nombre', etiqueta: 'Nombre', requerido: true, valor: t.nombre, attrs: 'autocomplete="organization"' })}
      ${campo({ nombre: 'lema', etiqueta: 'Frase debajo del nombre', valor: c.lema || '', ayuda: 'Ejemplo: «Mecánica general y service».' })}
      ${campo({ nombre: 'telefono', etiqueta: 'Teléfono', tipo: 'tel', valor: c.telefono || '', attrs: 'inputmode="tel"' })}
      ${campo({ nombre: 'whatsapp', etiqueta: 'WhatsApp', tipo: 'tel', valor: c.whatsapp || '', attrs: 'inputmode="tel"' })}
      ${campo({ nombre: 'email', etiqueta: 'Correo', tipo: 'email', valor: c.email || '', attrs: 'inputmode="email"', ancho: 'grid-column:1/-1' })}</div>`)}
    ${sec('Dirección y horarios visibles', 'Para los documentos y la página pública.', `<div class="ajg-grid2">
      ${campo({ nombre: 'direccion', etiqueta: 'Dirección', valor: c.direccion || '', placeholder: 'Calle y número' })}
      ${campo({ nombre: 'localidad', etiqueta: 'Localidad', valor: c.localidad || '' })}
      ${campo({ nombre: 'horarios', etiqueta: 'Horarios para mostrar', valor: c.horarios || '', ancho: 'grid-column:1/-1', ayuda: 'Texto libre para documentos y página pública. Los turnos usan el «Horario de turnos».' })}</div>
      ${aviso('Estos datos salen en los documentos nuevos. Los documentos ya emitidos conservan los datos de su fecha.', 'gris')}`)}`, {
    guardar: (d) => put('/api/taller', { version: t.version, nombre: d.nombre, lema: d.lema, telefono: d.telefono, whatsapp: d.whatsapp, email: d.email, direccion: d.direccion, localidad: d.localidad, horarios: d.horarios }),
    ok: 'Datos del taller guardados. Salen en los documentos nuevos.'
  });
}

// ---------- Presupuestos y entregas ----------
async function vPresupuestos(app) {
  const { taller: t, entregaSaldo: es } = await get('/api/taller');
  const c = t.config;
  return formulario(app, 'presupuestos', `
    ${sec('Presupuestos y mano de obra', 'Valores que usan los presupuestos y la calculadora de mano de obra.', `<div class="ajg-grid2">
      ${conSufijo(campo({ nombre: 'validezDias', etiqueta: 'Validez de los presupuestos', valor: c.validez_presupuesto_dias || 15, attrs: 'inputmode="numeric"', ayuda: 'Cuántos días vale un presupuesto desde que se emite (de 1 a 120).' }), 'días')}
      ${conSufijo(campo({ nombre: 'valorHora', etiqueta: 'Valor de la hora de trabajo', valor: aEntradaDinero(c.valor_hora), attrs: 'inputmode="decimal"', ayuda: 'Lo usa la calculadora. Lo define el taller; vacío si todavía no lo definió.' }), 'por hora')}</div>`)}
    ${sec('Entrega con saldo pendiente', 'Elegí la regla del taller. Siempre queda registrado quién la autorizó, el saldo y el motivo.', `<fieldset class="grupo ajg-opciones" data-campo="entregaSaldo"><legend>¿Quién puede entregar un auto que todavía debe plata?</legend>
      ${Object.entries(es.opciones).map(([k, txt]) => `<label class="ajg-opt"><input type="radio" name="entregaSaldo" value="${k}"${es.regla === k ? ' checked' : ''}><span class="ajg-opt__punto" aria-hidden="true"></span><span class="ajg-opt__txt">${esc(txt)}</span><span class="ajg-opt__elegida" aria-hidden="true">${icono('check', 'i-sm')}Elegida</span></label>`).join('')}
      <p class="ayuda">Valor inicial: dueño y recepción, hasta que el dueño confirme su regla.</p></fieldset>`)}`, {
    guardar: (d) => put('/api/taller', { version: t.version, validezDias: d.validezDias, valorHora: d.valorHora, entregaSaldo: d.entregaSaldo }),
    ok: 'Presupuestos y entregas guardados.'
  });
}

// ---------- Horario de turnos ----------
const minutos = (h) => /^\d{2}:\d{2}$/.test(h || '') ? Number(h.slice(0, 2)) * 60 + Number(h.slice(3)) : null;
function semanaHTML(d) {
  const a = minutos(d.agendaDesde), b = minutos(d.hasta), pa = minutos(d.pausaDesde), pb = minutos(d.pausaHasta);
  const ini = Math.min(6 * 60, a ?? 6 * 60), fin = Math.max(22 * 60, b ?? 22 * 60);
  const pos = (m) => ((m - ini) / (fin - ini)) * 100;
  const valido = a != null && b != null && b > a;
  const conPausa = valido && pa != null && pb != null && a < pa && pa < pb && pb < b;
  const franjas = !valido ? [] : conPausa ? [[a, pa], [pb, b]] : [[a, b]];
  const dias = d.dias || [];
  const texto = valido ? `${d.agendaDesde} a ${d.hasta}${conPausa ? ` · cierra de ${d.pausaDesde} a ${d.pausaHasta}` : ''}` : 'Horario incompleto';
  return `<div class="ajg-semana">${ORDEN_DIAS.map((i) => {
    const abre = dias.includes(String(i));
    return `<div class="ajg-semana__dia${abre ? '' : ' ajg-semana__dia--cerrado'}"><span class="ajg-semana__nombre">${DIAS[i]}</span><span class="ajg-semana__barra">${abre ? franjas.map(([x, y]) => `<i style="left:${pos(x)}%;width:${pos(y) - pos(x)}%"></i>`).join('') : ''}</span><span class="ajg-semana__txt">${abre ? esc(texto) : 'No atiende'}</span></div>`;
  }).join('')}</div><p class="ayuda">Turnos cada ${esc(d.agendaPaso)} minutos. Así queda la semana con los valores de arriba, guardados o no.</p>`;
}
async function vHorario(app) {
  const { taller: t, agenda: a } = await get('/api/taller');
  return formulario(app, 'horario', `
    ${sec('Días y horario', 'Para la agenda y las solicitudes de turno.', `<fieldset class="grupo" data-campo="agendaDias"><legend>Días de atención</legend><div class="ajg-dias">${ORDEN_DIAS.map((i) => `<label class="ajg-dia"><input type="checkbox" name="dias[]" value="${i}"${a.dias.includes(i) ? ' checked' : ''}>${icono('check', 'i-sm')}<span class="ajg-dia__no" aria-hidden="true">–</span>${DIAS[i]}</label>`).join('')}</div>
      <p class="ayuda">Los días marcados muestran un tilde. Tiene que quedar al menos un día de atención.</p></fieldset>
      <div class="ajg-grid3">${campo({ nombre: 'agendaDesde', etiqueta: 'Abre', tipo: 'time', valor: a.desde, requerido: true })}${campo({ nombre: 'hasta', etiqueta: 'Cierra', tipo: 'time', valor: a.hasta, requerido: true })}${campo({ nombre: 'agendaPaso', etiqueta: 'Turnos cada', tipo: 'select', valor: String(a.paso), opciones: [['15', '15 minutos'], ['30', '30 minutos'], ['60', '1 hora']] })}</div>`)}
    ${sec('Cierre del mediodía', 'Opcional. Los turnos no pueden cruzar este cierre.', `<p class="ayuda">Si atienden de corrido, dejá ambos campos vacíos.</p>
      <div class="ajg-grid2">${campo({ nombre: 'pausaDesde', etiqueta: 'Cierra al mediodía', tipo: 'time', valor: a.pausaDesde || '' })}${campo({ nombre: 'pausaHasta', etiqueta: 'Vuelve a abrir', tipo: 'time', valor: a.pausaHasta || '' })}</div>
      <div><button type="button" class="btn btn-chico" data-de-corrido>Atienden de corrido (vaciar)</button></div>`)}
    ${sec('Resumen semanal', 'Cómo queda la semana con estos valores.', '<div data-semana></div>')}`, {
    guardar: (d) => put('/api/taller', { version: t.version, agenda: { dias: d.dias || [], desde: d.agendaDesde, hasta: d.hasta, paso: Number(d.agendaPaso), pausaDesde: d.pausaDesde, pausaHasta: d.pausaHasta } }),
    ok: 'Horario de turnos guardado. La agenda ya usa estos valores.',
    despues(raiz, form) {
      const semana = form.querySelector('[data-semana]');
      const leer = () => { const d = { dias: [] }; for (const el of form.elements) { if (el.name === 'dias[]') { if (el.checked) d.dias.push(el.value); } else if (el.name) d[el.name] = el.value; } return d; };
      const pintar = () => { semana.innerHTML = semanaHTML(leer()); };
      form.addEventListener('input', pintar);
      form.querySelector('[data-de-corrido]').addEventListener('click', () => {
        form.elements.pausaDesde.value = ''; form.elements.pausaHasta.value = '';
        form.dispatchEvent(new Event('input', { bubbles: true }));
      });
      pintar();
    }
  });
}

// ---------- Página pública y directorio ----------
async function vPublica(app) {
  const { taller: t } = await get('/api/taller');
  const c = t.config;
  return formulario(app, 'publica', `
    ${sec('Qué se muestra', 'Tres decisiones independientes. La página nunca muestra clientes, autos ni trabajos.', `<div role="group" aria-label="Decisiones de la página pública">
      ${interruptor('publico', 'Mostrar la página pública del taller', 'Datos de contacto, servicios y horarios.', t.publico)}
      ${interruptor('turnosOnline', 'Permitir pedir turnos desde la página pública', 'Las solicitudes quedan sin confirmar hasta que el taller las confirme.', !!c.turnosOnline)}
      ${interruptor('en_directorio', 'Aparecer en el listado de talleres del producto', 'Solo si la página pública está visible.', t.en_directorio)}</div>
      <div data-dependencia></div>`)}
    ${sec('Contenido de la página', 'Confirmá cada dato con el dueño antes de publicarlo.', `<div class="ajg-pila">
      ${campo({ nombre: 'descripcion', etiqueta: 'Descripción para la página pública', tipo: 'textarea', valor: c.descripcion || '' })}
      ${campo({ nombre: 'serviciosPublicos', etiqueta: 'Servicios que se muestran', tipo: 'textarea', valor: (c.serviciosPublicos || []).join('\n'), ayuda: 'Uno por renglón.' })}
      ${campo({ nombre: 'mapa', etiqueta: 'Enlace al mapa', tipo: 'url', valor: c.mapa || '', placeholder: 'https://…', attrs: 'inputmode="url"', ayuda: 'Tiene que empezar con https:// (copialo desde el mapa con «Compartir»).' })}</div>`)}
    ${sec('Vista previa', 'La página tal como la ve el público, con los datos guardados.', t.publico
      ? `<p><a class="btn" href="/t/${esc(t.slug)}" target="_blank" rel="noopener">${icono('enlace')}Ver la página pública</a></p><p class="ayuda">Se abre en otra pestaña. Los cambios sin guardar no aparecen ahí.</p>`
      : '<p class="ayuda">La página está oculta. La vista previa se habilita cuando la mostrás y guardás.</p>')}`, {
    guardar: (d) => put('/api/taller', { version: t.version, publico: d.publico, turnosOnline: d.turnosOnline, en_directorio: d.en_directorio, descripcion: d.descripcion, serviciosPublicos: d.serviciosPublicos, mapa: d.mapa }),
    ok: 'Página pública guardada.',
    despues(raiz, form) {
      const dep = form.querySelector('[data-dependencia]');
      const pintar = () => {
        const visible = form.elements.publico.checked;
        dep.innerHTML = visible ? '' : aviso('Con la página oculta no se pueden pedir turnos desde la web y el taller no aparece en el listado, aunque esas opciones estén activadas.', 'ambar', 'alerta');
      };
      form.addEventListener('input', pintar);
      pintar();
    }
  });
}

// ---------- Logo ----------
// La identidad de INYECAR (nombre, rojo y tipografía) es fija; el logo sale en los documentos nuevos.
async function vIdentidad(app) {
  const { taller: t } = await get('/api/taller');
  const c = t.config;
  const logo = c.logoAdjuntoId ? `/api/adjuntos/${Number(c.logoAdjuntoId)}` : '';
  return {
    html: sec('Logo', 'Se guarda al tocar «Subir logo».', `
    ${logo ? `<img src="${logo}" alt="Logo actual" class="ajg-logo">` : '<p class="muted">Sin logo cargado: se muestra el nombre del taller.</p>'}
    <form class="form" id="f-logo" novalidate><div class="campo" data-campo="logo"><label for="logo-in">Imagen PNG, JPG o WEBP (menos de 400 KB)</label><input id="logo-in" type="file" accept="image/png,image/jpeg,image/webp"></div>
      <div class="acciones"><button class="btn" type="submit">${icono('subir')}Subir logo</button>${logo ? '<button type="button" class="btn btn-texto" data-quitar-logo>Quitar logo</button>' : ''}</div></form>
    <p class="ayuda">Los documentos ya emitidos conservan el logo que tenían.</p>`),
    despues(raiz) {
      alEnviar(raiz.querySelector('#f-logo'), async () => {
        const archivo = raiz.querySelector('#logo-in').files[0];
        if (!archivo) throw Object.assign(new Error('Elegí una imagen.'), { campo: 'logo' });
        await api('POST', '/api/taller/logo', undefined, { archivo, cabeceras: { 'X-Nombre-Archivo': encodeURIComponent(archivo.name) } });
        toast('Logo guardado. Sale en los documentos nuevos.');
        app.recargar();
      });
      raiz.querySelector('[data-quitar-logo]')?.addEventListener('click', async () => {
        const r = await confirmar({ titulo: 'Quitar logo', texto: 'Se mostrará el nombre del taller. Los documentos anteriores conservan su copia y podés volver a subir el logo.', aceptar: 'Quitar logo' });
        if (!r.ok) return;
        try { await api('DELETE', '/api/taller/logo'); toast('Logo quitado.'); location.reload(); } catch (e) { toast(e.message, { error: true }); }
      });
    }
  };
}

// ---------- Usuarios y permisos ----------
const PERFILES = { dueno: 'Puede todo, incluidos usuarios, ajustes, anulaciones y reportes.', recepcion: 'Recibe autos, prepara presupuestos, registra respuestas, cobros, agenda y ventas.', mecanico: 'Registra revisión, tareas, repuestos colocados, trabajos y control, sin ver importes.' };
async function vUsuarios(app) {
  const { usuarios, roles } = await get('/api/usuarios');
  const yo = app.sesion.usuario.id;
  const estadoU = (u) => !u.activo ? chip('Sin acceso', '', 'ban') : u.pendiente ? chip('Invitación pendiente', 'ambar', 'reloj') : chip('Activo', 'verde', 'check');
  const ultimo = (u) => u.pendiente ? 'Todavía no creó su contraseña' : u.ultimo_acceso ? fechaHora(u.ultimo_acceso) : 'Sin ingresos';
  const enlaceHTML = (r, texto) => `<div class="ajg-resultado">${aviso(`${texto} Sirve una sola vez y vence el ${esc(fechaHora(r.expira))}. Mandalo por un medio seguro; no envíes contraseñas.`, 'verde', 'check')}
    <div class="campo"><label for="ajg-enlace-${++nDialogo}">Enlace</label><input type="text" id="ajg-enlace-${nDialogo}" readonly value="${esc(location.origin + r.enlace)}"></div><div><button type="button" class="btn btn-chico" data-copiar-enlace>${icono('copiar')}Copiar enlace</button></div></div>`;
  const conCopia = (cont, r) => cont.querySelector('[data-copiar-enlace]').addEventListener('click', () => copiar(location.origin + r.enlace));
  return {
    acciones: `<button type="button" class="btn btn-chico btn-primario" data-invitar>${icono('mas')}Invitar persona</button>`,
    html: `<div class="ajg-lista"><table class="ajg-tabla ajg-tabla--apilable"><caption class="sr">Personas con acceso</caption>
      <thead><tr><th scope="col">Persona</th><th scope="col">Perfil</th><th scope="col">Estado</th><th scope="col">Último ingreso</th><th scope="col"><span class="sr">Acciones</span></th></tr></thead>
      <tbody>${usuarios.map((u) => `<tr><td data-etq="Persona" class="ajg-persona"><strong>${esc(u.nombre)}${u.id === yo ? ' <span class="ajg-insignia">Vos</span>' : ''}</strong><small>${esc(u.email)}</small></td><td data-etq="Perfil">${esc(u.rolTexto)}</td><td data-etq="Estado">${estadoU(u)}</td><td data-etq="Último ingreso" class="num">${esc(ultimo(u))}</td>
        <td class="ajg-tabla__accion"><button type="button" class="btn btn-chico" data-editar="${u.id}" aria-label="Editar a ${esc(u.nombre)}">${icono('lapiz')}Editar</button></td></tr>`).join('')}</tbody></table></div>
      ${sec('Qué puede hacer cada perfil', 'Informativo. Lo único editable por persona es su perfil y su acceso; el servidor comprueba cada permiso.', `<dl class="ajg-perfiles">${Object.entries(roles).map(([k, n]) => `<div><dt>${esc(n)}</dt><dd>${esc(PERFILES[k] || '')}</dd></div>`).join('')}</dl>`)}`,
    despues(raiz) {
      raiz.querySelector('[data-invitar]').addEventListener('click', () => {
        const d = abrirDialogo({ titulo: 'Invitar persona', detalle: 'Se crea un enlace para que la persona elija su contraseña. Hasta entonces no puede ingresar.', lateral: false, cuerpo: `<form class="form" id="f-inv" novalidate>
          ${campo({ nombre: 'nombre', etiqueta: 'Nombre', requerido: true })}${campo({ nombre: 'email', etiqueta: 'Correo para ingresar', tipo: 'email', requerido: true, attrs: 'inputmode="email"' })}${campo({ nombre: 'rol', etiqueta: 'Perfil', tipo: 'select', opciones: Object.entries(roles), valor: 'mecanico' })}
          <div class="ajg-dlg__pie"><button type="button" class="btn" data-cancelar>Cancelar</button><button class="btn btn-primario" type="submit">${icono('mas')}Crear invitación</button></div></form><div data-inv></div>` });
        let creada = false;
        d.querySelector('[data-cancelar]').addEventListener('click', () => d.close());
        d.addEventListener('close', () => { if (creada) app.recargar(); });
        alEnviar(d.querySelector('#f-inv'), async (v) => {
          const r = await post('/api/usuarios', v);
          creada = true;
          const cont = d.querySelector('[data-inv]');
          d.querySelector('#f-inv').remove();
          cont.innerHTML = enlaceHTML(r, `Invitación creada para ${esc(v.nombre)} (${esc(roles[v.rol] || v.rol)}).`) + '<div class="ajg-dlg__pie"><button type="button" class="btn btn-primario" data-listo>Listo</button></div>';
          conCopia(cont, r);
          cont.querySelector('[data-listo]').addEventListener('click', () => d.close());
          cont.querySelector('[data-copiar-enlace]').focus();
        });
      });
      raiz.querySelectorAll('[data-editar]').forEach((b) => b.addEventListener('click', () => {
        const u = usuarios.find((x) => x.id === Number(b.dataset.editar));
        const d = abrirDialogo({ titulo: u.nombre, detalle: `${esc(u.email)} · ${esc(ultimo(u))}`, cuerpo: `<form class="form" id="f-usuario" novalidate>
          ${campo({ nombre: 'nombre', etiqueta: 'Nombre', requerido: true, valor: u.nombre })}
          ${campo({ nombre: 'rol', etiqueta: 'Perfil', tipo: 'select', valor: u.rol, opciones: Object.entries(roles), ayuda: 'Cambia lo que la persona puede hacer desde su próxima acción.' })}
          ${campo({ nombre: 'activo', etiqueta: 'Acceso', tipo: 'select', valor: u.activo ? '1' : '0', opciones: [['1', 'Puede ingresar'], ['0', 'Sin acceso (desactivado)']], ayuda: 'Sin acceso, su sesión se cierra en el momento. Lo que registró se conserva.' })}
          <div class="ajg-dlg__pie"><button type="button" class="btn" data-cancelar>Cancelar</button><button class="btn btn-primario" type="submit">${icono('check')}Guardar</button></div></form>
          ${u.activo ? `<section class="ajg-dlg__seccion"><h3>Acceso</h3><div class="acciones"><button type="button" class="btn btn-chico" data-enlace>${icono('enlace')}${u.pendiente ? 'Generar invitación de nuevo' : 'Enlace para cambiar contraseña'}</button>${!u.pendiente && u.id !== yo ? `<button type="button" class="btn btn-chico btn-texto" data-cerrar-sesiones>${icono('salir')}Cerrar sus sesiones</button>` : ''}</div><div data-enlace-u></div></section>` : ''}` });
        d.querySelector('[data-cancelar]').addEventListener('click', () => d.close());
        const f = d.querySelector('#f-usuario');
        alEnviar(f, async (v) => {
          if (v.activo === '0' && u.activo) { const c = await confirmar({ titulo: 'Quitar el acceso', texto: `${esc(v.nombre)} no podrá ingresar y su sesión se cierra ahora. Lo que registró se conserva.`, aceptar: 'Quitar acceso', peligro: true }); if (!c.ok) return false; }
          await put(`/api/usuarios/${u.id}`, { nombre: v.nombre, rol: v.rol, activo: v.activo === '1', version: Number(u.version) });
          delete f.dataset.sucio;
          toast('Usuario actualizado.');
          d.close();
          app.recargar();
        });
        d.querySelector('[data-cerrar-sesiones]')?.addEventListener('click', async () => {
          const r = await confirmar({ titulo: 'Cerrar sus sesiones', texto: 'La persona tendrá que volver a ingresar con su correo y contraseña en todos sus dispositivos. No se borra nada.', aceptar: 'Cerrar sesiones' });
          if (!r.ok) return;
          try { await post(`/api/usuarios/${u.id}/cerrar-sesiones`, {}); toast('Sesiones cerradas.'); } catch (e) { toast(e.message, { error: true }); }
        });
        d.querySelector('[data-enlace]')?.addEventListener('click', async (e) => {
          const boton = e.currentTarget;
          boton.disabled = true; boton.classList.add('cargando');
          try {
            const r = await post(`/api/usuarios/${u.id}/recuperacion`, {});
            const cont = d.querySelector('[data-enlace-u]');
            cont.innerHTML = enlaceHTML(r, u.pendiente ? 'Invitación nueva creada.' : 'Enlace para cambiar la contraseña creado.');
            conCopia(cont, r);
          } catch (err) { toast(err.message, { error: true }); }
          finally { boton.disabled = false; boton.classList.remove('cargando'); }
        });
      }));
    }
  };
}

// ---------- Servicios y plantillas ----------
async function vCatalogos(app) {
  const c = await get('/api/catalogos');
  const fila = (tipo, x, campos, resumen) => `<li><div class="fila"><span>${resumen}</span>${x.activo ? '' : chip('Inactivo', '', 'menos')}</div><details class="mas"><summary>Editar</summary><div class="mas__cuerpo"><form class="form" data-cat="${tipo}" data-id="${x.id}" novalidate>${campos}${casilla('activo', 'Activo', !!x.activo)}<div><button class="btn" type="submit">Guardar</button></div></form></div></details></li>`;
  const bloque = (tipo, titulo, ayuda, lista, campos, resumen, agregar) => sec(titulo, ayuda, `<ul class="lista ajg-catalogo">${lista.map((x) => fila(tipo, x, campos(x), resumen(x))).join('') || '<li class="ajg-vacio">Todavía no hay.</li>'}</ul>
    <details class="mas ajg-agregar"><summary>${icono('mas')}${agregar}</summary><div class="mas__cuerpo"><form class="form" data-cat="${tipo}" novalidate>${campos({})}<div><button class="btn btn-primario" type="submit">Agregar</button></div></form></div></details>`);
  return {
    html: `${bloque('puestos', 'Puestos de trabajo', 'La agenda controla que dos turnos no se superpongan en el mismo puesto.', c.puestos, (x) => campo({ nombre: 'nombre', etiqueta: 'Nombre', requerido: true, valor: x.nombre || '', placeholder: 'Ej.: Elevador 1' }), (x) => `<strong>${esc(x.nombre)}</strong>`, 'Agregar un puesto')}
      ${bloque('servicios', 'Servicios', 'Se usan en la agenda y, si lo marcás, en la página pública.', c.servicios, (x) => `<div class="ajg-grid3">${campo({ nombre: 'nombre', etiqueta: 'Nombre', requerido: true, valor: x.nombre || '' })}${conSufijo(campo({ nombre: 'duracion', etiqueta: 'Duración', valor: x.duracion_min || 60, attrs: 'inputmode="numeric"' }), 'min')}${campo({ nombre: 'precio', etiqueta: 'Precio orientativo', valor: aEntradaDinero(x.precio), attrs: 'inputmode="decimal"' })}</div>${casilla('publico', 'Se puede pedir desde la página pública', x.publico !== 0)}`, (x) => `<strong>${esc(x.nombre)}</strong> · ${x.duracion_min} min${x.precio != null ? ' · ' + pesos(x.precio) : ''}`, 'Agregar un servicio')}
      ${bloque('plantillas', 'Plantillas de service', 'Proponen tareas; el mecánico las confirma una por una. No definen intervalos ni productos compatibles.', c.plantillas, (x) => `${campo({ nombre: 'nombre', etiqueta: 'Nombre', requerido: true, valor: x.nombre || '' })}${campo({ nombre: 'tareas', etiqueta: 'Tareas', tipo: 'textarea', requerido: true, valor: (x.tareas || []).join('\n'), ayuda: 'Una por renglón.' })}`, (x) => `<strong>${esc(x.nombre)}</strong> · ${(x.tareas || []).length} tareas`, 'Agregar una plantilla')}
      ${bloque('trabajos', 'Tiempos de trabajo', 'Los usa la calculadora de mano de obra. Son tiempos propios del taller, no oficiales.', c.trabajos, (x) => `<div class="ajg-grid2">${campo({ nombre: 'nombre', etiqueta: 'Trabajo', requerido: true, valor: x.nombre || '' })}${conSufijo(campo({ nombre: 'horas', etiqueta: 'Horas', valor: x.horas_m ? aEntradaCant(x.horas_m) : '', requerido: true, attrs: 'inputmode="decimal"' }), 'h')}</div>${campo({ nombre: 'notas', etiqueta: 'Notas', valor: x.notas || '' })}`, (x) => `<strong>${esc(x.nombre)}</strong> · ${cant(x.horas_m, 'h')}`, 'Agregar un tiempo')}`,
    despues(raiz) {
      raiz.querySelectorAll('[data-cat]').forEach((f) => alEnviar(f, async (d) => { await post(`/api/catalogos/${f.dataset.cat}`, { ...d, id: f.dataset.id ? Number(f.dataset.id) : undefined, activo: f.dataset.id ? d.activo : true, publico: d.publico !== false }); toast('Guardado.'); app.recargar(); }));
    }
  };
}

// ---------- Conexiones externas ----------
async function vIntegraciones() {
  const { integraciones } = await get('/api/integraciones');
  return {
    html: `${aviso('Estas funciones necesitan cuentas, proveedores o contenidos que el taller todavía no contrató. Están preparadas pero <strong>inactivas</strong>: no se simula ningún envío ni respuesta.', 'gris', 'info')}
      <div class="ajg-lista"><table class="ajg-tabla ajg-tabla--apilable"><caption class="sr">Conexiones externas</caption>
        <thead><tr><th scope="col">Función</th><th scope="col">Estado</th><th scope="col">Necesita</th><th scope="col">Mientras tanto</th></tr></thead>
        <tbody>${integraciones.map((i) => `<tr><td data-etq="Función"><strong>${esc(i.nombre)}</strong></td><td data-etq="Estado">${chip('Inactiva', '', 'pausa')}</td><td data-etq="Necesita">${esc(i.necesita)}</td><td data-etq="Mientras tanto">${esc(i.alternativa)}</td></tr>`).join('')}</tbody></table></div>`
  };
}

// ---------- Exportación y respaldo ----------
async function vDatos() {
  const estado = await get('/api/respaldos/estado');
  const TABLAS = [['vehiculos', 'Autos'], ['contactos', 'Clientes'], ['visitas', 'Visitas'], ['presupuesto_lineas', 'Líneas de presupuesto'], ['cuenta_movimientos', 'Movimientos de dinero'], ['movimientos_stock', 'Movimientos de stock'], ['articulos', 'Artículos'], ['turnos', 'Turnos']];
  const si = `<span class="ajg-si">${icono('check', 'i-sm')}Sí</span>`, no = '<span class="ajg-no">No</span>';
  const INCLUYE = [
    ['Datos del taller: autos, clientes, visitas, presupuestos, dinero, stock y turnos', si, no, si],
    ['Fotos y PDF de las visitas', no, '<span class="ajg-si">' + icono('check', 'i-sm') + 'Desde cada visita</span>', si],
    ['Contraseñas y sesiones', no, no, '<span>Cifradas, dentro de la base</span>'],
    ['Alcance', '<span>Solo este taller</span>', '<span>La visita elegida</span>', '<span>Toda la instalación</span>'],
    ['Sirve para recuperar el sistema completo', no, no, si]
  ];
  const mensaje = 'Hola: el panel del taller no detecta un respaldo completo reciente. ¿Podés revisar la frecuencia de la tarea de respaldo, la copia fuera del servidor y hacer una prueba de recuperación en una carpeta aparte?';
  return {
    html: `${sec('Qué incluye cada opción', 'Son tres cosas distintas.', `<div class="ajg-desborde"><table class="ajg-tabla ajg-tabla--fija ajg-tabla--apilable"><caption class="sr">Qué incluye cada opción</caption><thead><tr><th scope="col">Incluye</th><th scope="col">Exportación (JSON y CSV)</th><th scope="col">Archivos adjuntos</th><th scope="col">Respaldo completo</th></tr></thead>
        <tbody>${INCLUYE.map((r) => `<tr><th scope="row">${r[0]}</th><td data-etq="Exportación">${r[1]}</td><td data-etq="Archivos adjuntos">${r[2]}</td><td data-etq="Respaldo completo">${r[3]}</td></tr>`).join('')}</tbody></table></div>`)}
      ${sec('1. Exportar datos', 'Datos estructurados, para planillas u otro sistema.', `<p>Incluye solo los datos de este taller, sin contraseñas ni sesiones. <strong>No incluye fotos ni PDF.</strong></p>
        <div class="acciones"><a class="btn btn-primario" href="/api/exportar">${icono('descargar')}Datos del taller (JSON)</a></div>
        <p class="ajg-dato__k">Planillas (CSV) por tema</p><div class="acciones">${TABLAS.map(([t, n]) => `<a class="btn btn-chico" href="/api/exportar?formato=csv&entidad=${t}">${icono('descargar', 'i-sm')}${esc(n)}</a>`).join('')}</div>`)}
      ${sec('2. Archivos adjuntos', 'Fotos y PDF.', '<p>Las fotos y los PDF se descargan desde cada visita, o forman parte del respaldo completo del servidor.</p><p class="ayuda">No hay una descarga masiva de adjuntos desde este panel.</p>')}
      ${sec('3. Respaldo completo y recuperación', 'Para recuperar el sistema si algo falla.', `<p>El respaldo incluye la base de datos y los archivos privados de toda la instalación. Lo administra el responsable técnico y se recupera en un entorno separado, comprobando los registros y los archivos antes de usarlo.</p>
        ${aviso(estado.ultimaCopia ? `Última copia completa detectada: <strong>${esc(fechaHora(estado.ultimaCopia))}</strong>. ${estado.reciente ? 'Hay una copia de las últimas 36 horas.' : 'Pasaron más de 36 horas: avisá al administrador para revisar la tarea.'}` : '<strong>Todavía no se detectó un respaldo completo.</strong> Avisá al administrador.', estado.reciente ? 'verde' : 'ambar', estado.reciente ? 'check' : 'alerta')}
        <p class="ayuda">Este estado corresponde al respaldo de la instalación en el servidor. No comprueba una copia fuera del servidor ni que la tarea automática esté programada. El administrador debe verificar la frecuencia, el destino externo y la recuperación.</p>
        ${estado.reciente ? '' : `<div><button type="button" class="btn btn-chico" data-copiar-admin>${icono('copiar')}Copiar mensaje para el administrador</button></div>`}`)}`,
    despues(raiz) { raiz.querySelector('[data-copiar-admin]')?.addEventListener('click', () => copiar(mensaje)); }
  };
}

// ---------- Registro de acciones ----------
const TIPOS_REGISTRO = { visita: 'Órdenes', vehiculo: 'Autos', contacto: 'Clientes', turno: 'Turnos', taller: 'Ajustes y servicio', usuario: 'Usuarios', venta: 'Mostrador', compra: 'Compras', articulo: 'Stock', movimiento: 'Caja', proveedor: 'Proveedores', documento: 'Documentos', biblioteca: 'Biblioteca', seguimiento: 'Pendientes' };
const SIN_AUTOR = 'Sistema o página pública';
async function vRegistro() {
  const { acciones } = await get('/api/auditoria');
  const tipos = [...new Set(acciones.map((a) => a.entidad).filter(Boolean))].sort((a, b) => (TIPOS_REGISTRO[a] || a).localeCompare(TIPOS_REGISTRO[b] || b));
  const personas = [...new Set(acciones.map((a) => a.por || SIN_AUTOR))].sort();
  return {
    html: `<div class="ajg-filtros" role="search" aria-label="Filtrar el registro">
        <div class="campo ajg-filtros__q"><label for="reg-q">Buscar</label><input type="search" id="reg-q" placeholder="Acción, persona o detalle" autocomplete="off"></div>
        <div class="campo"><label for="reg-tipo">Tipo</label><select id="reg-tipo"><option value="">Todos los tipos</option>${tipos.map((t) => `<option value="${esc(t)}">${esc(TIPOS_REGISTRO[t] || t)}</option>`).join('')}</select></div>
        <div class="campo"><label for="reg-persona">Persona</label><select id="reg-persona"><option value="">Todas</option>${personas.map((p) => `<option>${esc(p)}</option>`).join('')}</select></div>
        <div class="campo"><label for="reg-periodo">Período</label><select id="reg-periodo"><option value="">Todo lo cargado</option><option value="0">Hoy</option><option value="6">Últimos 7 días</option><option value="29">Últimos 30 días</option></select></div>
      </div>
      <div class="ajg-resultado-linea" data-reg-resultado aria-live="polite"></div>
      <div class="ajg-lista" data-reg-lista></div>
      <p class="ayuda ajg-nota">Se cargan las últimas ${acciones.length < 300 ? acciones.length : 300} acciones del taller. Las correcciones de dinero, stock y documentos quedan como movimientos nuevos: nada se borra.</p>`,
    despues(raiz) {
      const q = raiz.querySelector('#reg-q'), tipo = raiz.querySelector('#reg-tipo'), persona = raiz.querySelector('#reg-persona'), periodo = raiz.querySelector('#reg-periodo');
      const lista = raiz.querySelector('[data-reg-lista]'), resultado = raiz.querySelector('[data-reg-resultado]');
      const desde = (dias) => { const d = new Date(hoyLocal() + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() - dias); return d.toISOString().slice(0, 10); };
      const pintar = () => {
        const texto = q.value.trim().toLowerCase(), limite = periodo.value === '' ? '' : desde(Number(periodo.value));
        const filas = acciones.filter((a) => (!tipo.value || a.entidad === tipo.value) && (!persona.value || (a.por || SIN_AUTOR) === persona.value)
          && (!limite || (aLocal(a.fecha) || '').slice(0, 10) >= limite)
          && (!texto || `${a.accion} ${a.por || SIN_AUTOR} ${a.detalle || ''}`.toLowerCase().includes(texto)));
        const filtrado = filas.length < acciones.length;
        resultado.innerHTML = `<span>Mostrando ${filas.length} de ${acciones.length} acciones cargadas</span>${filtrado ? '<button type="button" class="enlace" data-quitar-filtros>Quitar filtros</button>' : ''}`;
        lista.innerHTML = filas.length ? `<table class="ajg-tabla ajg-tabla--apilable ajg-registro"><caption class="sr">Registro de acciones</caption><thead><tr><th scope="col">Momento</th><th scope="col">Acción</th><th scope="col">Persona</th><th scope="col">Referencia</th></tr></thead>
          <tbody>${filas.map((a) => `<tr><td data-etq="Momento" class="num ajg-nowrap">${esc(fechaHora(a.fecha))}</td><td data-etq="Acción"><strong>${esc(a.accion)}</strong></td><td data-etq="Persona">${esc(a.por || SIN_AUTOR)}</td>
            <td data-etq="Referencia" class="ajg-tenue">${a.entidad ? esc(TIPOS_REGISTRO[a.entidad] || a.entidad) : ''}${a.entidad === 'visita' ? ` · <a href="#/visitas/${Number(a.entidad_id)}">ver la orden</a>` : ''}${a.detalle ? ' · ' + esc(a.detalle.length > 200 ? a.detalle.slice(0, 200) + '…' : a.detalle) : ''}</td></tr>`).join('')}</tbody></table>`
          : `<p class="ajg-vacio">${acciones.length ? 'Ninguna acción coincide con estos filtros.' : 'Todavía no hay acciones registradas.'}</p>`;
        resultado.querySelector('[data-quitar-filtros]')?.addEventListener('click', () => { q.value = ''; tipo.value = ''; persona.value = ''; periodo.value = ''; pintar(); q.focus(); });
      };
      q.addEventListener('input', pintar);
      [tipo, persona, periodo].forEach((s) => s.addEventListener('change', pintar));
      pintar();
    }
  };
}

const VISTAS = { taller: vTaller, presupuestos: vPresupuestos, horario: vHorario, catalogos: vCatalogos, publica: vPublica, identidad: vIdentidad, usuarios: vUsuarios, integraciones: vIntegraciones, datos: vDatos, registro: vRegistro };
