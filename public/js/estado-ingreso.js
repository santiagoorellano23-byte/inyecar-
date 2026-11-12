import {api,get} from './api.js?v=0.6.1';
import {esc,fechaHora,icono} from './ui.js?v=0.6.1';

export const NOMBRES_FOTO={tablero:'Tablero',exterior:'Exterior',detalle:'Detalle de daño previo'};
const GRUPOS=[['tablero','Tablero','tablero'],['exterior','Exterior','auto'],['detalle','Daños','alerta']];
const VACIO={tablero:'Sin fotos',exterior:'Sugeridas: frente, atrás y laterales',detalle:'Solo si declarás daños'};
const MIME=['image/jpeg','image/png','image/webp'],MAXIMO=12,DESHACER_MS=6000;
const falla=(mensaje,campo='fotosIngreso',destino=null)=>Object.assign(new Error(mensaje),{campo,destino});
const plural=(n,uno,varios)=>`${n} ${n===1?uno:varios}`;
const nuevoId=()=>crypto.randomUUID();

// Panel rápido del paso 2. Los originales van al almacenamiento privado; el borrador guarda referencias y textos, nunca imágenes.
// Cada foto tiene una clave estable: las cargas actualizan solo su miniatura, su fila y su control, sin redibujar el paso.
export function enlazarFotosIngreso(box,o) {
  const {clave,guardar}=o,invalidar=o.invalidar||guardar,danosBox=o.danosBox||null,carroceria=o.carroceria||{leer:()=>'',poner(){}};
  let fotos=(o.inicial||[]).filter(f=>f&&(f.id||f.intentada)&&GRUPOS.some(([t])=>t===f.tipo)).map(f=>({clave:f.clave||nuevoId(),id:f.id||null,tipo:f.tipo,dano:f.dano||null,token:f.token||nuevoId(),intentada:true}));
  let danos=(o.danos||[]).map(d=>({clave:d.clave||nuevoId(),descripcion:String(d.descripcion||'')}));
  // Borradores anteriores: las fotos de detalle sin daño se agrupan en un daño con sus descripciones.
  const sueltas=fotos.filter(f=>f.tipo==='detalle'&&!danos.some(d=>d.clave===f.dano));
  if(sueltas.length){const d={clave:nuevoId(),descripcion:(o.inicial||[]).filter(f=>f?.tipo==='detalle').map(f=>f.descripcion).filter(Boolean).join('. ').slice(0,300)};danos.push(d);sueltas.forEach(f=>f.dano=d.clave);}
  const archivos=new Map(),vistas=new Map(),ocupadas=new Set(),avisos={};
  let recuperando=fotos.length>0,generacion=0,abierto=null,ultimoDestino=null,ultimoCierre=0,ancla=o.ancla||null,deshacer=null,carActual=null,contradiccion=null;

  const de=tipo=>fotos.filter(f=>f.tipo===tipo);
  const fotosDano=d=>fotos.filter(f=>f.tipo==='detalle'&&f.dano===d.clave);
  const conContenido=d=>!!(d.descripcion.trim()||fotosDano(d).length);
  const numeroDano=f=>danos.findIndex(d=>d.clave===f.dano)+1;
  const nombre=f=>f.tipo==='detalle'?(numeroDano(f)?`daño ${numeroDano(f)}`:'daño'):NOMBRES_FOTO[f.tipo].toLowerCase();
  const estado=f=>recuperando?'comprobando':f.nuevo?(ocupadas.has(f.nuevo.token)||!f.nuevo.error?'subiendo':'error'):ocupadas.has(f.token)?'subiendo':f.id&&!f.error?'guardada':'error';
  const fuente=f=>(f.nuevo&&!f.nuevo.error&&vistas.get(f.nuevo.token))||vistas.get(f.token)||(f.id?`/api/adjuntos/${f.id}`:'');
  const todos=sel=>[...(box.querySelectorAll?.(sel)||[]),...(danosBox?.querySelectorAll?.(sel)||[])];
  const uno=sel=>box.querySelector?.(sel)||danosBox?.querySelector?.(sel)||null;
  const anunciar=t=>{const a=box.querySelector?.('[data-anuncio]');if(a)a.textContent=t;};

  // ---------- Miniaturas: 52 × 52 en las filas y 44 × 44 dentro de cada daño ----------
  const textoEstado=(f,e=estado(f))=>({comprobando:'Comprobando',subiendo:'Subiendo: todavía no cuenta como guardada',guardada:'Guardada',error:f.nuevo?.error?'No se pudo reemplazar; se conserva la foto anterior':'No se subió'})[e];
  const etiquetaMini=f=>`Foto de ${nombre(f)}. ${textoEstado(f)}. Abrir para ampliar, reemplazar o quitar.`;
  const marcaEstado=e=>e==='subiendo'||e==='comprobando'?'<span class="ing-giro" aria-hidden="true"></span>':e==='error'?icono('alerta','i-sm'):'';
  const interior=f=>{const src=fuente(f),n=f.tipo==='detalle'?numeroDano(f):0;return `${src?`<img src="${esc(src)}" alt="" width="52" height="52" decoding="async" loading="lazy">`:icono('foto')}${n?`<span class="ing-mini__numero" aria-hidden="true">${n}</span>`:''}<span class="ing-mini__estado" aria-hidden="true">${marcaEstado(estado(f))}</span>`;};
  const mini=(f,chica)=>`<button type="button" class="ing-mini${chica?' ing-mini--chica':''}" data-mini="${f.clave}" data-ancla="mini-${f.clave}" data-estado="${estado(f)}" data-src="${esc(fuente(f))}" aria-label="${esc(etiquetaMini(f))}">${interior(f)}</button>`;
  const crear=html=>{const t=document.createElement('template');t.innerHTML=html;return t.content.firstElementChild;};
  const pintarMini=f=>{for(const el of todos(`[data-mini="${f.clave}"]`)){
    const src=fuente(f);el.dataset.estado=estado(f);el.setAttribute('aria-label',etiquetaMini(f));
    if(el.dataset.src!==src){el.dataset.src=src;el.innerHTML=interior(f);}
    else{const m=el.querySelector('.ing-mini__estado');if(m)m.innerHTML=marcaEstado(estado(f));const nro=el.querySelector('.ing-mini__numero');if(nro)nro.textContent=numeroDano(f);}
  }};
  // Conserva cada botón existente (y su foco): solo agrega, quita o reubica lo que cambió.
  const reconciliar=(cont,lista,chica)=>{
    if(!cont)return;
    const fin=cont.querySelector(':scope>[data-fin]'),actuales=new Map([...cont.querySelectorAll(':scope>[data-mini]')].map(el=>[el.dataset.mini,el]));
    lista.forEach((f,i)=>{let el=actuales.get(f.clave);if(el){actuales.delete(f.clave);pintarMini(f);}else el=crear(mini(f,chica));const lugar=cont.querySelectorAll(':scope>[data-mini]')[i]||fin;if(lugar!==el)cont.insertBefore(el,lugar);});
    for(const el of actuales.values())el.remove();
  };

  // ---------- Controles superiores y filas por categoría ----------
  const tile=([tipo,titulo,ic])=>`<div class="ing-tile" data-tile="${tipo}"><button type="button" class="ing-tile__tomar" data-tomar="${tipo}" data-ancla="tomar-${tipo}">${icono(ic)}<strong>${titulo}</strong><span class="ing-tile__estado" data-tile-estado></span></button><button type="button" class="ing-tile__galeria" data-galeria="${tipo}" data-ancla="galeria-${tipo}" aria-label="Elegir foto de ${titulo.toLowerCase()} desde la galería">${icono('foto','i-sm')}Galería</button></div>`;
  const grupo=([tipo,titulo])=>`<div class="ing-grupo" data-grupo="${tipo}"><div class="ing-grupo__cab"><strong>${titulo}</strong><span data-grupo-sub></span></div><div class="ing-grupo__fila" data-miniaturas><span class="ing-grupo__vacio" data-vacio>${VACIO[tipo]}</span><button type="button" class="ing-mini ing-mini--agregar" data-fin data-agregar="${tipo}" data-ancla="agregar-${tipo}" aria-label="Agregar otra foto: ${titulo.toLowerCase()}${tipo==='exterior'?' (sugeridas: frente, atrás y laterales)':''}">${icono('mas')}</button></div><div class="ing-grupo__msg" data-grupo-msg="${tipo}"></div></div>`;
  const pintarTile=tipo=>{
    const el=box.querySelector?.(`[data-tile="${tipo}"]`),lista=de(tipo),est=lista.map(f=>estado(f)),n=lista.filter(f=>f.id).length;
    const [clase,texto]=recuperando&&lista.length?['comprobando','Comprobando…']:est.includes('subiendo')?['subiendo','Subiendo…']:est.includes('error')?['error','No se subió']:n?['ok',plural(n,'foto','fotos')]:tipo!=='detalle'||carroceria.leer()==='con_danos'?['req','Obligatoria']:['opt','Si hay daños'];
    if(!el)return;
    el.dataset.estado=clase;el.querySelector('[data-tile-estado]').innerHTML=`${clase==='ok'?icono('check','i-sm'):clase==='error'?icono('alerta','i-sm'):clase==='subiendo'||clase==='comprobando'?'<span class="ing-giro" aria-hidden="true"></span>':''}${texto}`;
    el.querySelector('[data-tomar]').setAttribute('aria-label',`Tomar foto: ${GRUPOS.find(g=>g[0]===tipo)[1]}. ${texto}`);
  };
  const pintarMsg=tipo=>{
    const el=tipo==='danos'?danosBox?.querySelector?.('[data-danos-msg]'):box.querySelector?.(`[data-grupo-msg="${tipo}"]`);
    if(!el)return;
    const fallidas=tipo==='danos'?[]:de(tipo).filter(f=>estado(f)==='error'),reintentables=fallidas.filter(f=>archivos.has(f.nuevo?.token||f.token));
    const enfocado=el.contains(document.activeElement);
    if(deshacer?.lugar===tipo)el.innerHTML=`<p role="status">${esc(deshacer.texto)}</p><button type="button" class="btn btn-chico" data-deshacer>Deshacer</button>`;
    else if(reintentables.length)el.innerHTML=`<p role="alert">${icono('alerta','i-sm')}${plural(reintentables.length,'foto no se subió','fotos no se subieron')}. Lo demás sigue guardado.</p><button type="button" class="btn btn-chico" data-reintentar-grupo="${tipo}">Reintentar</button>`;
    else if(fallidas.length)el.innerHTML=`<p role="alert">${icono('alerta','i-sm')}${esc(fallidas[0].error||'Una foto no se subió.')} Tocá la miniatura para tomarla de nuevo o quitarla.</p>`;
    else el.innerHTML=avisos[tipo]?`<p role="status">${esc(avisos[tipo])}</p>`:'';
    if(enfocado&&!el.contains(document.activeElement))uno(`[data-agregar="${tipo}"]`)?.focus({preventScroll:true});
  };
  const pintarGrupo=tipo=>{
    const g=box.querySelector?.(`[data-grupo="${tipo}"]`),lista=de(tipo);
    if(g){
      reconciliar(g.querySelector('[data-miniaturas]'),lista);
      g.querySelector('[data-vacio]').hidden=lista.length>0;
      const n=lista.filter(f=>f.id).length;g.querySelector('[data-grupo-sub]').textContent=n?plural(n,'guardada','guardadas'):tipo==='detalle'&&carroceria.leer()!=='con_danos'?'Si hay':'Pendiente';
      for(const b of g.querySelectorAll('[data-agregar]'))b.setAttribute('aria-disabled',String(fotos.length>=MAXIMO||recuperando));
    }
    pintarTile(tipo);pintarMsg(tipo);
  };
  const pintarDano=d=>{
    const el=danosBox?.querySelector?.(`[data-dano="${d.clave}"]`);if(!el)return;
    const lista=fotosDano(d),est=lista.map(f=>estado(f)),n=lista.filter(f=>f.id).length;
    reconciliar(el.querySelector('[data-miniaturas-dano]'),lista,true);
    el.querySelector('[data-dano-estado]').innerHTML=est.includes('subiendo')?'<span class="ing-giro" aria-hidden="true"></span>Subiendo…':est.includes('error')?`${icono('alerta','i-sm')}No se subió`:n?`${icono('check','i-sm')}${plural(n,'foto','fotos')}`:'Falta la foto';
    el.querySelector('[data-dano-estado]').dataset.estado=est.includes('error')?'error':n?'ok':'';
    const q=el.querySelector('[data-dano-quitar]');if(q)q.hidden=lista.length>0;
    el.querySelector('label').textContent=`Daño ${danos.indexOf(d)+1} · ubicación y descripción`;
  };
  const pintarFoto=f=>{pintarMini(f);pintarTile(f.tipo);pintarMsg(f.tipo);const n=box.querySelector?.(`[data-grupo="${f.tipo}"] [data-grupo-sub]`);if(n){const k=de(f.tipo).filter(x=>x.id).length;if(k)n.textContent=plural(k,'guardada','guardadas');}const d=danos.find(x=>x.clave===f.dano);if(d)pintarDano(d);};
  const refrescar=()=>{for(const [t] of GRUPOS)pintarGrupo(t);for(const d of danos)pintarDano(d);};

  // ---------- Daños previos: un registro por daño, con su texto y sus fotos ----------
  const registro=(d,i)=>`<div class="ing-dano" data-dano="${d.clave}"><div class="campo"><label for="ing-d-${d.clave}">Daño ${i+1} · ubicación y descripción</label><input id="ing-d-${d.clave}" data-dano-desc maxlength="300" value="${esc(d.descripcion)}" placeholder="Ej.: rayón en puerta delantera derecha" autocomplete="off"></div><div class="ing-dano__fotos" data-miniaturas-dano><span data-fin class="ing-dano__estado" data-dano-estado></span></div><div class="ing-dano__acciones"><button type="button" class="btn btn-chico" data-dano-tomar data-ancla="dano-tomar-${d.clave}">${icono('camara','i-sm')}Tomar foto</button><button type="button" class="btn btn-chico" data-dano-galeria data-ancla="dano-galeria-${d.clave}" aria-label="Elegir foto del daño ${i+1} desde la galería">${icono('foto','i-sm')}Galería</button><button type="button" class="btn btn-chico btn-texto" data-dano-quitar>Quitar daño</button></div></div>`;
  const renderDanos=()=>{
    if(!danosBox)return;
    const car=carroceria.leer(),cargados=danos.filter(conContenido).length;
    carActual=car;contradiccion=car==='sin_danos'&&cargados>0;
    const foco=document.activeElement,enfoque=foco&&danosBox.contains(foco)?foco.dataset.ancla||(foco.matches('[data-otro-dano]')?'otro':null):null;
    let html='<div class="ing-grupo__msg" data-danos-msg></div>';
    if(contradiccion)html+=`<div class="ing-contradiccion" role="alert" data-contradiccion tabindex="-1">${icono('alerta')}<p>Marcaste «Sin daños», pero hay ${plural(cargados,'daño cargado','daños cargados')}. Se conservan hasta que decidas.</p><div class="ing-contradiccion__acciones"><button type="button" class="btn btn-chico" data-resolver="con">Volver a «Con daños previos»</button><button type="button" class="btn btn-chico btn-texto" data-resolver="quitar">Quitar los daños</button></div></div>`;
    else if(car==='sin_danos')html+='<p class="ing-nota">Queda registrado: «Sin daños visibles observados».</p>';
    if(car==='con_danos'||contradiccion)html+=danos.map(registro).join('');
    if(car==='con_danos')html+=`<button type="button" class="btn btn-texto ing-otro" data-otro-dano>${icono('mas')}Agregar otro daño</button>`;
    danosBox.innerHTML=html;
    for(const d of danos)pintarDano(d);pintarMsg('danos');
    if(enfoque)(enfoque==='otro'?danosBox.querySelector('[data-otro-dano]'):danosBox.querySelector(`[data-ancla="${enfoque}"]`))?.focus({preventScroll:true});
  };

  // ---------- Cámara y galería ----------
  const listo=()=>!abierto&&Date.now()-ultimoCierre>=700&&!recuperando;
  const abrir=(destino,origen,modo)=>{
    const entrada=box.querySelector?.(`[data-entrada="${modo}"]`);
    if(!entrada||!listo())return false;
    abierto={...destino,origen};ultimoDestino=destino;
    // Si el teléfono descarta la pestaña mientras la cámara está abierta, el borrador sabe dónde estaba el empleado.
    ancla={control:origen?.dataset.ancla||null,tipo:destino.tipo,y:Math.round(scrollY),t:Date.now()};guardar();
    entrada.value='';entrada.click();
    // Navegadores sin evento «cancel»: al volver el foco a la ventana se libera el control, sin deshacer nada.
    addEventListener('focus',()=>setTimeout(()=>{if(abierto?.origen===origen)cerrar(false);},1200),{once:true});
    return true;
  };
  const cerrar=cancelado=>{const a=abierto;if(!a)return;abierto=null;ultimoCierre=Date.now();ancla=null;if(cancelado){ultimoDestino=null;a.revertir?.();}guardar();if(a.origen?.isConnected)a.origen.focus({preventScroll:true});};
  const aviso=(tipo,texto)=>{avisos[tipo]=texto;pintarMsg(tipo);anunciar(texto);};
  const vista=(token,file)=>{if(typeof URL!=='undefined'&&URL.createObjectURL)vistas.set(token,URL.createObjectURL(file));};
  const soltar=token=>{const u=vistas.get(token);if(u)URL.revokeObjectURL(u);vistas.delete(token);};
  const agregarArchivos=(files,destino)=>{
    for(const file of files){
      if(!MIME.includes(file.type)||!file.size||file.size>15*1024*1024){aviso(destino.tipo,'Elegí una foto JPG, PNG o WEBP de hasta 15 MB.');continue;}
      if(destino.reemplaza){
        const f=fotos.find(x=>x.clave===destino.reemplaza);if(!f)return;
        if(f.nuevo){archivos.delete(f.nuevo.token);soltar(f.nuevo.token);}
        // La foto anterior queda hasta que el servidor confirma la nueva.
        f.nuevo={token:nuevoId(),error:''};archivos.set(f.nuevo.token,file);vista(f.nuevo.token,file);
        delete avisos[f.tipo];invalidar();pintarFoto(f);subir(f);return;
      }
      if(fotos.length>=MAXIMO){aviso(destino.tipo,'Ya hay 12 fotos. Quitá alguna para agregar otra.');return;}
      const f={clave:nuevoId(),id:null,tipo:destino.tipo,dano:destino.dano||null,token:nuevoId(),intentada:true};
      fotos.push(f);archivos.set(f.token,file);vista(f.token,file);delete avisos[f.tipo];
      invalidar();pintarGrupo(f.tipo);const d=danos.find(x=>x.clave===f.dano);if(d)pintarDano(d);subir(f);
    }
  };
  const subir=async f=>{
    const obj=f.nuevo||f,token=obj.token;
    if(ocupadas.has(token)||!archivos.has(token))return;
    ocupadas.add(token);obj.error='';pintarFoto(f);anunciar(`Subiendo foto de ${nombre(f)}…`);
    try{
      const file=archivos.get(token);
      const r=await api('POST',`/api/recepcion/fotos?clave=${encodeURIComponent(clave)}&tipo=${f.tipo}&token=${token}`,undefined,{archivo:file,idempotencia:token,cabeceras:{'X-Nombre-Archivo':encodeURIComponent(file.name)}});
      archivos.delete(token);
      if(f.nuevo===obj){soltar(f.token);f.token=token;f.id=r.id;f.error='';delete f.nuevo;}else if(!f.nuevo)f.id=r.id;
      anunciar(`Foto de ${nombre(f)} guardada.`);
    }catch(e){obj.error=e.message||'No se pudo subir la foto.';anunciar(`No se pudo subir la foto de ${nombre(f)}. Se puede reintentar.`);}
    finally{ocupadas.delete(token);if(fotos.includes(f)){guardar();pintarFoto(f);}}
  };
  const reintentar=f=>{const obj=f.nuevo||f;if(archivos.has(obj.token))subir(f);};

  // Quitar es reversible durante unos segundos; nada se borra del servidor (las cargas descartadas quedan privadas y sin orden).
  const conDeshacer=(lugar,texto,cambio)=>{
    const previo={fotos:[...fotos],danos:[...danos]};clearTimeout(deshacer?.timer);
    cambio();invalidar();
    deshacer={lugar,texto,previo,timer:setTimeout(()=>{const l=deshacer?.lugar;deshacer=null;if(l)pintarMsg(l);},DESHACER_MS)};
    renderDanosSiCambia(true);refrescar();pintarMsg(lugar);
    uno(lugar==='danos'?'[data-danos-msg] [data-deshacer]':`[data-grupo-msg="${lugar}"] [data-deshacer]`)?.focus({preventScroll:true});
    anunciar(texto+' Podés deshacerlo.');
  };
  const quitar=f=>conDeshacer(f.tipo,`Foto de ${nombre(f)} quitada.`,()=>{fotos=fotos.filter(x=>x!==f);});
  const restaurar=()=>{
    if(!deshacer)return;
    const {lugar,previo}=deshacer;clearTimeout(deshacer.timer);deshacer=null;
    fotos=previo.fotos;danos=previo.danos;invalidar();renderDanosSiCambia(true);refrescar();pintarMsg(lugar);
    uno(lugar==='danos'?'[data-otro-dano],[data-resolver]':`[data-agregar="${lugar}"]`)?.focus({preventScroll:true});
    anunciar('Se recuperó lo quitado.');
  };
  const renderDanosSiCambia=(forzar=false)=>{
    const car=carroceria.leer(),con=car==='sin_danos'&&danos.some(conContenido);
    if(car==='con_danos'&&carActual!=='con_danos'&&!danos.length)danos.push({clave:nuevoId(),descripcion:''});
    if(forzar||car!==carActual||con!==contradiccion){renderDanos();pintarGrupo('detalle');}
  };
  const objetivoDano=()=>{let d=danos.find(x=>!fotosDano(x).length),creado=false;if(!d){d={clave:nuevoId(),descripcion:''};danos.push(d);creado=true;}return {d,creado};};
  // «Daños» abre un registro de daño claro; cancelar la cámara deshace la declaración automática.
  const tomarDano=(origen,modo,dExistente)=>{
    if(!listo()||!box.querySelector?.(`[data-entrada="${modo}"]`))return;
    const previo=carroceria.leer(),{d,creado}=dExistente?{d:dExistente,creado:false}:objetivoDano(),marcar=previo!=='con_danos';
    if(marcar)carroceria.poner('con_danos');
    if(creado||marcar)renderDanosSiCambia(true);
    abrir({tipo:'detalle',dano:d.clave,revertir:()=>{if(creado&&!conContenido(d))danos=danos.filter(x=>x!==d);if(marcar)carroceria.poner(previo);renderDanosSiCambia(true);}},origen,modo);
  };

  // ---------- Visor: ampliar, reemplazar, reintentar o quitar una foto ----------
  let visorOrigen=null,visorFoto=null;
  const abrirVisor=(f,origen)=>{
    const dlg=box.querySelector?.('[data-visor]');if(!dlg)return;
    visorOrigen=origen;visorFoto=f;const e=estado(f),src=fuente(f),pendiente=archivos.has(f.nuevo?.token||f.token);
    dlg.querySelector('[data-visor-titulo]').textContent=f.tipo==='detalle'?`Daño ${numeroDano(f)||''}`.trim():NOMBRES_FOTO[f.tipo];
    dlg.querySelector('[data-visor-img]').innerHTML=src?`<img src="${esc(src)}" alt="Foto de ${esc(nombre(f))}">`:`<p class="muted">${icono('foto')}Sin vista previa: la foto no está en este teléfono.</p>`;
    dlg.querySelector('[data-visor-estado]').textContent=e==='subiendo'?'Subiendo: todavía no cuenta como guardada.':e==='comprobando'?'Comprobando con el servidor…':e==='error'?(f.nuevo?.error?'No se pudo reemplazar. Se conserva la foto anterior.':f.error||'No se subió.'):'Guardada en privado · pendiente de recibir el auto.';
    dlg.querySelector('[data-visor-acciones]').innerHTML=e==='subiendo'||e==='comprobando'?'':`${e==='error'&&pendiente?`<button type="button" class="btn btn-primario" data-visor="reintentar">${f.nuevo?'Reintentar el reemplazo':'Reintentar'}</button>`:''}${f.nuevo?.error?'<button type="button" class="btn" data-visor="descartar">Descartar el reemplazo</button>':''}<button type="button" class="btn" data-visor="camara">${icono('camara','i-sm')}Reemplazar con cámara</button><button type="button" class="btn" data-visor="galeria">${icono('foto','i-sm')}Reemplazar desde galería</button><button type="button" class="btn btn-texto btn-peligro" data-visor="quitar">Quitar esta foto</button>`;
    dlg.showModal();
  };
  const accionVisor=accion=>{
    const f=visorFoto,dlg=box.querySelector('[data-visor]');visorFoto=null;dlg.close();
    if(!f||!fotos.includes(f))return;
    if(accion==='reintentar')reintentar(f);
    else if(accion==='descartar'){archivos.delete(f.nuevo.token);soltar(f.nuevo.token);delete f.nuevo;pintarFoto(f);}
    else if(accion==='quitar')quitar(f);
    else abrir({tipo:f.tipo,dano:f.dano,reemplaza:f.clave},visorOrigen,accion);
  };

  // ---------- Estructura: se dibuja una vez; después solo cambian bloques ----------
  box.innerHTML=`<section class="ing-fotos" aria-labelledby="ing-fotos-t"><div class="ing-fotos__cab"><h3 id="ing-fotos-t">Fotos</h3><span>Tablero y exterior: obligatorias</span></div>
    <div class="ing-tiles">${GRUPOS.map(tile).join('')}</div>
    <div class="ing-grupos">${GRUPOS.map(grupo).join('')}</div>
    <input type="file" hidden data-entrada="camara" accept="${MIME.join(',')}" capture="environment" tabindex="-1" aria-hidden="true"><input type="file" hidden data-entrada="galeria" accept="${MIME.join(',')}" multiple tabindex="-1" aria-hidden="true">
    <p class="sr" aria-live="polite" data-anuncio></p>
    <dialog class="ing-visor" data-visor aria-labelledby="ing-visor-t"><div class="ing-visor__cab"><h2 id="ing-visor-t" data-visor-titulo></h2><button type="button" class="btn btn-texto" data-visor="cerrar">Cerrar</button></div><div class="ing-visor__img" data-visor-img></div><p data-visor-estado></p><div class="ing-visor__acciones" data-visor-acciones></div></dialog></section>`;
  const clic=e=>{
    const b=e.target.closest?.('button');if(!b)return;
    const ds=b.dataset,tipo=ds.tomar||ds.galeria||ds.agregar,modo=ds.galeria?'galeria':'camara';
    if(b.getAttribute('aria-disabled')==='true')return;
    if(tipo){if(tipo==='detalle')tomarDano(b,modo);else abrir({tipo},b,modo);return;}
    if(ds.mini){const f=fotos.find(x=>x.clave===ds.mini);if(f)abrirVisor(f,b);return;}
    if('deshacer' in ds)return restaurar();
    if(ds.reintentarGrupo){for(const f of de(ds.reintentarGrupo))if(estado(f)==='error')reintentar(f);return;}
    if(ds.visor)return ds.visor==='cerrar'?box.querySelector('[data-visor]').close():accionVisor(ds.visor);
    const reg=b.closest('[data-dano]'),d=reg&&danos.find(x=>x.clave===reg.dataset.dano);
    if(d&&('danoTomar' in ds||'danoGaleria' in ds))return tomarDano(b,'danoGaleria' in ds?'galeria':'camara',d);
    if(d&&'danoQuitar' in ds){if(fotosDano(d).length)return;return conDeshacer('danos',`Daño ${danos.indexOf(d)+1} quitado.`,()=>{danos=danos.filter(x=>x!==d);});}
    if('otroDano' in ds){const n={clave:nuevoId(),descripcion:''};danos.push(n);invalidar();renderDanos();danosBox.querySelector(`[data-dano="${n.clave}"] input`)?.focus();return;}
    if(ds.resolver==='con')return carroceria.poner('con_danos');
    if(ds.resolver==='quitar')return conDeshacer('danos','Daños quitados.',()=>{const quitar=new Set(danos.map(x=>x.clave));fotos=fotos.filter(x=>!(x.tipo==='detalle'&&quitar.has(x.dano)));danos=[];});
  };
  box.addEventListener?.('click',clic);danosBox?.addEventListener?.('click',clic);
  danosBox?.addEventListener?.('input',e=>{const reg=e.target.closest('[data-dano]'),d=reg&&danos.find(x=>x.clave===reg.dataset.dano);if(d&&e.target.matches('[data-dano-desc]')){d.descripcion=e.target.value;invalidar();}});
  for(const entrada of box.querySelectorAll?.('[data-entrada]')||[]){
    // Los selectores no tienen name: no pasan al borrador ni disparan el guardado del formulario.
    entrada.addEventListener('change',e=>{e.stopPropagation();const destino=abierto||ultimoDestino,files=[...entrada.files];ultimoDestino=null;if(destino&&files.length)agregarArchivos(files,destino);cerrar(false);});
    entrada.addEventListener('input',e=>e.stopPropagation());
    entrada.addEventListener('cancel',()=>cerrar(true));
  }
  box.querySelector?.('[data-visor]')?.addEventListener('close',()=>{if(visorOrigen?.isConnected)visorOrigen.focus({preventScroll:true});else uno('[data-agregar="tablero"]')?.focus({preventScroll:true});});
  refrescar();renderDanosSiCambia(true);

  const gen=generacion;
  if(recuperando)get('/api/recepcion/fotos?clave='+encodeURIComponent(clave)).then(r=>{
    if(gen!==generacion)return;
    const perdidas={};
    fotos=fotos.filter(f=>{const g=r.fotos.find(a=>a.token===f.token&&a.tipo===f.tipo);if(g){f.id=g.id;return true;}perdidas[f.tipo]=(perdidas[f.tipo]||0)+1;return false;});
    recuperando=false;
    for(const [tipo,n] of Object.entries(perdidas))avisos[tipo]=`${plural(n,'foto no llegó','fotos no llegaron')} al servidor antes de recargar. Tomala de nuevo.`;
    guardar();refrescar();renderDanosSiCambia(true);
  }).catch(()=>{
    if(gen!==generacion)return;
    recuperando=false;for(const f of fotos){f.id=null;f.error='No se pudo comprobar esta foto. Volvé a tomarla cuando tengas conexión.';}
    guardar();refrescar();
  });

  const pendientes=()=>fotos.filter(f=>['subiendo','comprobando'].includes(estado(f))).length;
  const validarFotos=()=>{
    if(recuperando)throw falla('Esperá: se están comprobando las fotos guardadas.','fotosIngreso',uno('[data-tomar="tablero"]'));
    if(pendientes())throw falla('Esperá: una foto todavía se está subiendo.','fotosIngreso',uno(`[data-mini="${fotos.find(f=>estado(f)==='subiendo').clave}"]`));
    const mal=fotos.find(f=>estado(f)==='error');
    if(mal)throw falla(mal.nuevo?.error?`El reemplazo de la foto de ${nombre(mal)} no se subió: reintentalo o descartalo.`:`Una foto de ${nombre(mal)} no se subió: reintentala o quitala.`,'fotosIngreso',uno(`[data-mini="${mal.clave}"]`));
    if(!de('tablero').length)throw falla('Falta la foto del tablero.','fotosIngreso',uno('[data-tomar="tablero"]'));
    if(!de('exterior').length)throw falla('Falta una foto del exterior.','fotosIngreso',uno('[data-tomar="exterior"]'));
  };
  const validarDanos=car=>{
    if(car==='sin_danos'&&danos.some(conContenido))throw falla('Marcaste «Sin daños», pero hay daños cargados. Quitalos o elegí «Con daños previos».','carroceria',uno('[data-contradiccion]'));
    if(car!=='con_danos')return;
    if(!danos.length)throw falla('Agregá al menos un daño con su descripción y su foto.','carroceria',uno('[data-tomar="detalle"]'));
    danos.forEach((d,i)=>{
      if(!d.descripcion.trim())throw falla(`Describí el daño ${i+1}: dónde está y qué se ve.`,'carroceria',uno(`[data-dano="${d.clave}"] input`));
      if(!fotosDano(d).length)throw falla(`Falta la foto del daño ${i+1}.`,'carroceria',uno(`[data-dano="${d.clave}"] [data-dano-tomar]`));
    });
  };
  return {
    validarFotos,validarDanos,
    validar(car){validarFotos();validarDanos(car);},
    actualizarCarroceria(){renderDanosSiCambia();pintarTile('detalle');pintarGrupo('detalle');},
    borrador:()=>({fotos:fotos.map(({clave,id,tipo,dano,token})=>({clave,id,tipo,dano,token,intentada:true})),danos:danos.map(({clave,descripcion})=>({clave,descripcion})),ancla}),
    // Formato 2 del servidor: cada foto de daño apunta a la posición de su daño.
    envio(car){const lista=car==='con_danos'?danos:[];return {fotos:fotos.filter(f=>f.tipo!=='detalle'||car==='con_danos').map(f=>({id:f.id,tipo:f.tipo,...(f.tipo==='detalle'?{dano:lista.findIndex(d=>d.clave===f.dano)}:{})})),danos:lista.map(d=>({descripcion:d.descripcion.trim()}))};},
    resumen(){return GRUPOS.map(([t,titulo])=>[titulo,de(t).filter(f=>f.id).length]).filter(([,n])=>n).map(([t,n])=>`${t}: ${n}`).join(' · ')||'Sin fotos';},
    resumenDanos(){return danos.map((d,i)=>`Daño ${i+1}: ${d.descripcion.trim()||'sin descripción'} (${plural(fotosDano(d).length,'foto','fotos')})`).join('\n');},
    faltantes(d){
      const n=pendientes();if(n)return `Subiendo ${plural(n,'foto','fotos')}: todavía no cuentan como guardadas.`;
      const f=[];if(!de('tablero').some(x=>x.id))f.push('tablero');if(!de('exterior').some(x=>x.id))f.push('exterior');
      const r=[d.tableroEstado,d.carroceria].filter(x=>!x).length;if(r)f.push(plural(r,'respuesta','respuestas'));
      if(d.carroceria==='con_danos'&&(!danos.length||danos.some(x=>!x.descripcion.trim()||!fotosDano(x).some(y=>y.id))))f.push('daños');
      if(fotos.some(x=>estado(x)==='error'))f.push('foto sin subir');
      if(!d.ingresoConfirmado)f.push('confirmación');
      return f.length?'Faltan: '+f.join(' · '):'Todo listo para continuar.';
    },
    tieneFotos:()=>fotos.length>0||danos.some(d=>d.descripcion.trim()),
    // Tras una recarga durante la cámara: vuelve al control de origen sin mover a quien ya siguió trabajando.
    restaurarPosicion(){
      const a=ancla;ancla=null;if(!a)return false;
      scrollTo(0,a.y);uno(`[data-ancla="${a.control}"]`)?.focus({preventScroll:true});
      aviso(a.tipo==='detalle'?'detalle':a.tipo,'La página se recargó al volver de la cámara. Si la foto no aparece, tomala de nuevo.');guardar();return true;
    },
    reiniciar(){generacion++;for(const t of vistas.keys())soltar(t);fotos=[];danos=[];archivos.clear();ocupadas.clear();recuperando=false;deshacer=null;for(const k in avisos)delete avisos[k];ancla=null;carActual=null;invalidar();refrescar();renderDanosSiCambia(true);},
    // Acciones expuestas para pruebas y para quien integre el panel.
    agregarArchivos,quitar:clave=>{const f=fotos.find(x=>x.clave===clave);if(f)quitar(f);},deshacer:restaurar,
    reemplazar:(claveFoto,file)=>{const f=fotos.find(x=>x.clave===claveFoto);if(f)agregarArchivos([file],{tipo:f.tipo,dano:f.dano,reemplaza:f.clave});},
    reintentar:claveFoto=>{const f=fotos.find(x=>x.clave===claveFoto);if(f)reintentar(f);},
  };
}

const TABLERO={sin_testigos:'Sin testigos de falla observados',con_testigos:'Con testigos encendidos',no_enciende:'No se pudo encender'};
const TABLERO_2={sin_testigos:'Sin alertas observadas',con_testigos:'Con testigos encendidos',no_enciende:'No enciende el tablero'};
const MOTOR={encendido:'Motor encendido',contacto:'Solo en contacto',no_arranca:'No arranca'};
export function vistaEstadoIngreso(v) {
  const e=v.recepcion?.estadoIngreso;
  if(!e)return '<section class="bloque"><h2>Estado al ingresar</h2><p class="muted">Esta orden anterior no tiene registro fotográfico de ingreso. No se agregó información retroactiva.</p></section>';
  const v2=e.version===2,titulo=f=>f.tipo==='detalle'&&f.dano!=null?`Daño ${f.dano+1}`:NOMBRES_FOTO[f.tipo];
  return `<section class="bloque estado-ingreso"><h2>Estado al ingresar</h2><p class="small muted">Registrado ${esc(fechaHora(e.registradoAt))} por ${esc(e.registradoPor)}. Se conserva el registro original.</p><dl class="resumen-kv"><div><dt>Carrocería e interior</dt><dd>${e.carroceria==='con_danos'?'Con daños previos observados':'Sin daños visibles observados'}</dd></div><div><dt>Tablero</dt><dd>${esc((v2?TABLERO_2:TABLERO)[e.tablero])}${e.motor?' · '+esc(MOTOR[e.motor]):''}</dd></div></dl>${e.testigos?`<p><strong>${v2?(e.tablero==='no_enciende'?'Por qué no enciende el tablero':'Testigos que se ven'):'Testigos / aclaración'}:</strong> ${esc(e.testigos)}</p>`:''}${v2&&e.danos?.length?`<ol class="estado-ingreso__danos">${e.danos.map(d=>`<li><strong>Daño ${d.n}:</strong> ${esc(d.descripcion)} <span class="small muted">(${d.fotos.length} ${d.fotos.length===1?'foto':'fotos'})</span></li>`).join('')}</ol>`:''}${e.observaciones?`<p><strong>${v2?'Aclaración':'Observaciones al ingresar'}:</strong> ${esc(e.observaciones)}</p>`:''}<div class="rec-fotos-lista">${e.fotos.map(f=>`<figure class="rec-foto"><a href="/api/adjuntos/${f.id}" target="_blank" rel="noopener"><img src="/api/adjuntos/${f.id}" alt="${esc(f.descripcion)}" width="320" height="200" loading="lazy"></a><figcaption><strong>${esc(titulo(f))}</strong><p>${esc(f.descripcion)}</p><small>Cargada ${esc(fechaHora(f.fecha))} · ${esc(f.por)}</small></figcaption></figure>`).join('')}</div><p class="small muted">Este registro describe lo observado al ingreso; no es un diagnóstico ni autoriza reparaciones. Las aclaraciones posteriores van en las notas del historial.</p></section>`;
}
