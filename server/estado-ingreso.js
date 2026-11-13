import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {uno, ejecutar} from './db.js';
import {falla, requerido, opcional, isoAhora} from './util.js';
import {carpetaArchivos} from './config.js';

export const claveIngreso = x => typeof x==='string' && /^[a-zA-Z0-9-]{16,100}$/.test(x);
export const TIPOS_FOTO_INGRESO = ['tablero','exterior','detalle'];
const MOTOR = ['encendido','contacto','no_arranca'];
const DESCRIPCION = {tablero:'Tablero al ingresar',exterior:'Exterior al ingresar'};
export function validarEstadoIngreso(ctx, e) {
  if(!e || !claveIngreso(e.clave))falla('Agregá las fotos del tablero y del exterior en Estado al ingresar.','fotosIngreso');
  if(!Array.isArray(e.fotos)||e.fotos.length<2||e.fotos.length>12)falla('Cargá entre 2 y 12 fotos del ingreso.','fotosIngreso');
  if(!['sin_danos','con_danos'].includes(e.carroceria))falla('Indicá si observás daños previos en el auto.','carroceria');
  if(!['sin_testigos','con_testigos','no_enciende'].includes(e.tablero))falla('Indicá cómo está el tablero al ingresar.','tableroEstado');
  // Formato 2 (panel rápido): la observación general es opcional y cada foto de daño apunta a su daño.
  const v2=e.version===2;
  const observaciones=v2?opcional(e.observaciones,2000)||'':requerido(e.observaciones,'Describí el estado visible del auto al ingresar.','ingresoObservaciones',2000);
  const testigos=e.tablero==='sin_testigos'?'':requerido(e.testigos,e.tablero==='no_enciende'?'Explicá por qué no enciende el tablero.':'Detallá los testigos encendidos o por qué no se puede encender el tablero.','ingresoTestigos',1000);
  const motor=v2&&e.tablero==='con_testigos'?e.motor:null;
  if(v2&&e.tablero==='con_testigos'&&!MOTOR.includes(motor))falla('Indicá si el motor está encendido, solo en contacto o no arranca.','ingresoMotor');
  let danos=[];
  if(v2){
    if(!Array.isArray(e.danos)||e.danos.length>8)falla('Revisá los daños previos registrados.','carroceria');
    if(e.carroceria==='sin_danos'&&(e.danos.length||e.fotos.some(f=>f?.tipo==='detalle')))falla('Marcaste sin daños, pero hay daños cargados. Quitalos o elegí «Con daños previos».','carroceria');
    if(e.carroceria==='con_danos'&&!e.danos.length)falla('Agregá al menos un daño con su descripción y su foto.','carroceria');
    danos=e.danos.map((d,i)=>({n:i+1,descripcion:requerido(d?.descripcion,`Describí el daño ${i+1}: dónde está y qué se ve.`,'carroceria',300),fotos:[]}));
  }
  const ids=new Set(), huellas=new Set();
  const fotos=e.fotos.map(f=>{
    if(!Number.isSafeInteger(f?.id)||ids.has(f.id))falla('Revisá las fotos del ingreso: hay una referencia inválida o repetida.','fotosIngreso');
    ids.add(f.id);
    const a=uno(ctx.db,'SELECT * FROM adjuntos WHERE taller_id=? AND id=?',ctx.taller.id,f.id);
    if(!a||a.ingreso_clave!==e.clave||a.creado_por!==ctx.usuario.id||a.visita_id||a.vehiculo_id||a.archivado_at||!TIPOS_FOTO_INGRESO.includes(a.ingreso_tipo)||!['image/jpeg','image/png','image/webp'].includes(a.mime))falla('Una foto no corresponde a este ingreso. Volvé a cargarla.','fotosIngreso');
    if(huellas.has(a.sha256))falla('Usá fotos distintas para el tablero, el exterior y los detalles.','fotosIngreso');
    huellas.add(a.sha256);
    const archivo=path.join(carpetaArchivos(),a.ruta);
    if(!fs.existsSync(archivo)||crypto.createHash('sha256').update(fs.readFileSync(archivo)).digest('hex')!==a.sha256)falla('Una foto no está disponible o cambió en el servidor. Volvé a cargarla.','fotosIngreso');
    const base={id:a.id,tipo:a.ingreso_tipo,fecha:a.creado_at,por:ctx.usuario.nombre,sha256:a.sha256};
    if(!v2)return {...base,descripcion:requerido(f.descripcion,'Describí qué muestra cada foto.','fotosIngreso',300)};
    if(a.ingreso_tipo!=='detalle'){if(f.dano!=null)falla('Solo las fotos de daños se asocian a un daño.','fotosIngreso');return {...base,descripcion:DESCRIPCION[a.ingreso_tipo]};}
    const d=Number.isSafeInteger(f.dano)?danos[f.dano]:null;
    if(!d)falla('Una foto de daño no está asociada a ningún daño. Asociala o quitala.','fotosIngreso');
    d.fotos.push(a.id);
    return {...base,dano:f.dano,descripcion:`Daño ${d.n}: ${d.descripcion}`};
  });
  for(const d of danos)if(!d.fotos.length)falla(`Falta la foto del daño ${d.n}.`,'carroceria');
  for(const tipo of ['tablero','exterior',...(e.carroceria==='con_danos'?['detalle']:[])])if(!fotos.some(f=>f.tipo===tipo))falla(tipo==='detalle'?'Agregá una foto de detalle del daño previo.':`Falta la foto obligatoria del ${tipo}.`,'fotosIngreso');
  if(e.confirmado!==true)falla('Confirmá que revisaste las fotos y el estado al ingresar.','ingresoConfirmado');
  return {version:v2?2:1,carroceria:e.carroceria,tablero:e.tablero,...(v2?{motor,danos}:{}),observaciones,testigos,fotos,registradoAt:isoAhora(),registradoPor:ctx.usuario.nombre};
}
export function vincularEstadoIngreso(ctx, estado, visitaId, vehiculoId) {
  for(const f of estado.fotos)ejecutar(ctx.db,'UPDATE adjuntos SET visita_id=?,vehiculo_id=?,descripcion=? WHERE taller_id=? AND id=?',visitaId,vehiculoId,`Ingreso · ${f.tipo}: ${f.descripcion}`,ctx.taller.id,f.id);
  ejecutar(ctx.db,'UPDATE visitas SET recepcion_json=json_set(COALESCE(recepcion_json,\'{}\'),\'$.estadoIngreso\',json(?)) WHERE taller_id=? AND id=?',JSON.stringify(estado),ctx.taller.id,visitaId);
  ctx.auditar('Estado y fotos al ingresar registrados','visita',visitaId,{carroceria:estado.carroceria,tablero:estado.tablero,motor:estado.motor,observaciones:estado.observaciones,testigos:estado.testigos,danos:estado.danos?.map(d=>({n:d.n,descripcion:d.descripcion,fotos:d.fotos})),fotos:estado.fotos.map(f=>({id:f.id,tipo:f.tipo,sha256:f.sha256}))});
}
