import {test} from 'node:test';
import assert from 'node:assert/strict';
import {enlazarFotosIngreso} from '../public/js/estado-ingreso.js';
const box=()=>({isConnected:true,innerHTML:'',querySelectorAll:()=>[],querySelector:()=>null,addEventListener:()=>{}});
const turno=()=>new Promise(resolve=>setImmediate(resolve));
const json=(d,{status=200}={})=>new Response(JSON.stringify(d),{status,headers:{'Content-Type':'application/json'}});
const inicial=[{id:11,tipo:'tablero',descripcion:'Tablero',token:'token-tablero-ficticio',intentada:true},{id:12,tipo:'exterior',descripcion:'Exterior',token:'token-exterior-ficticio',intentada:true}];
const foto=(n='ficticia')=>new File([new Uint8Array([137,80,78,71,n.length])],n+'.png',{type:'image/png'});
// Simula el servidor de cargas: cada token recibe un id y se registra cada pedido.
const servidor=({falla=()=>false}={})=>{let id=100;const pedidos=[];globalThis.fetch=async(url,op)=>{
  if(op?.method==='POST'){const token=new URL(url,'http://x').searchParams.get('token');pedidos.push(token);if(falla(token,pedidos))return json({error:'Falla ficticia de red'},{status:500});return json({id:++id});}
  return json({fotos:[]});
};return pedidos;};
const conFetch=async fn=>{const original=globalThis.fetch;try{await fn();}finally{globalThis.fetch=original;}};

test('Fotos de ingreso: espera recuperación confirmada y conserva únicamente referencias del servidor',()=>conFetch(async()=>{
 let responder,cambios=0;globalThis.fetch=()=>new Promise(resolve=>{responder=resolve;});
 const fotos=enlazarFotosIngreso(box(),{clave:'clave-ficticia-123',inicial,guardar:()=>cambios++});
 assert.throws(()=>fotos.validar('sin_danos'),/Esperá/);
 responder(json({fotos:inicial}));await turno();
 assert.doesNotThrow(()=>fotos.validar('sin_danos'));assert.throws(()=>fotos.validar('con_danos'),/daño/);assert.equal(cambios,1);
 assert.deepEqual(fotos.borrador().fotos.map(({id,tipo,token})=>({id,tipo,token})),inicial.map(({id,tipo,token})=>({id,tipo,token})));
}));
test('Cambiar de auto durante la recuperación no aplica la respuesta anterior al borrador nuevo',()=>conFetch(async()=>{
 let responder,cambios=0;globalThis.fetch=()=>new Promise(resolve=>{responder=resolve;});
 const fotos=enlazarFotosIngreso(box(),{clave:'clave-ficticia-456',inicial,guardar:()=>cambios++});fotos.reiniciar();
 assert.equal(cambios,1);
 responder(json({fotos:inicial}));await turno();
 assert.deepEqual(fotos.borrador().fotos,[]);assert.equal(cambios,1);assert.throws(()=>fotos.validar('sin_danos'),/tablero/);
}));
test('Sin conexión al recuperar fotos nunca se da el ingreso como completo',()=>conFetch(async()=>{
 globalThis.fetch=async()=>{throw new Error('Offline ficticio');};
 const fotos=enlazarFotosIngreso(box(),{clave:'clave-ficticia-789',inicial,guardar:()=>{}});await turno();
 assert.ok(fotos.borrador().fotos.every(f=>!f.id));assert.throws(()=>fotos.validar('sin_danos'),/no se subió/);
}));
test('Un borrador sin fotos elegidas no informa una carga fallida al recargar',()=>conFetch(async()=>{
 globalThis.fetch=async()=>json({fotos:[]});
 const raiz=box(),sinFotos=inicial.map(({intentada,...f})=>({...f,id:null}));
 const fotos=enlazarFotosIngreso(raiz,{clave:'clave-vacia-ficticia',inicial:sinFotos,guardar:()=>{}});await turno();
 assert.ok(!raiz.innerHTML.includes('no llegó'));assert.ok(raiz.innerHTML.includes('Tablero y exterior: obligatorias'));assert.equal(fotos.tieneFotos(),false);
}));
test('Una foto subiendo no cuenta como guardada y el reintento usa el mismo token sin duplicar',()=>conFetch(async()=>{
 const pedidos=servidor({falla:(t,p)=>p.length===1});
 const fotos=enlazarFotosIngreso(box(),{clave:'clave-reintento-ficticia',guardar:()=>{}});
 fotos.agregarArchivos([foto('tablero')],{tipo:'tablero'});
 assert.throws(()=>fotos.validarFotos(),/subiendo/);await turno();await turno();
 assert.throws(()=>fotos.validarFotos(),/no se subió/);
 const [f]=fotos.borrador().fotos;fotos.reintentar(f.clave);await turno();await turno();
 assert.equal(pedidos.length,2);assert.equal(pedidos[0],pedidos[1]);assert.ok(fotos.borrador().fotos[0].id);
 assert.throws(()=>fotos.validarFotos(),/exterior/);
}));
test('Reemplazar conserva la foto anterior si la nueva falla y la cambia solo cuando el servidor confirma',()=>conFetch(async()=>{
 let fallar=false;servidor({falla:()=>fallar});
 const fotos=enlazarFotosIngreso(box(),{clave:'clave-reemplazo-ficticia',guardar:()=>{}});
 fotos.agregarArchivos([foto('ext-1')],{tipo:'exterior'});await turno();await turno();
 const antes=fotos.borrador().fotos[0];assert.ok(antes.id);
 fallar=true;fotos.reemplazar(antes.clave,foto('ext-2'));await turno();await turno();
 assert.deepEqual(fotos.borrador().fotos[0],antes);assert.throws(()=>fotos.validarFotos(),/reemplazo/);
 fallar=false;fotos.reintentar(antes.clave);await turno();await turno();
 const despues=fotos.borrador().fotos[0];assert.equal(despues.clave,antes.clave);assert.notEqual(despues.id,antes.id);assert.notEqual(despues.token,antes.token);
}));
test('Quitar se puede deshacer y los daños conservan su correspondencia con las fotos',()=>conFetch(async()=>{
 servidor();
 let car='con_danos';const fotos=enlazarFotosIngreso(box(),{clave:'clave-danos-ficticia',danos:[{clave:'dano-a',descripcion:'Rayón puerta (ficticio)'},{clave:'dano-b',descripcion:'Paragolpes (ficticio)'}],carroceria:{leer:()=>car,poner:v=>{car=v;}},guardar:()=>{}});
 for(const [tipo,dano] of [['tablero'],['exterior'],['detalle','dano-b'],['detalle','dano-a'],['detalle','dano-b']])fotos.agregarArchivos([foto(tipo+dano)],{tipo,dano});
 await turno();await turno();
 assert.doesNotThrow(()=>fotos.validar('con_danos'));
 const envio=fotos.envio('con_danos');assert.deepEqual(envio.danos.map(d=>d.descripcion),['Rayón puerta (ficticio)','Paragolpes (ficticio)']);
 assert.deepEqual(envio.fotos.filter(f=>f.tipo==='detalle').map(f=>f.dano),[1,0,1]);
 const deA=fotos.borrador().fotos.find(f=>f.dano==='dano-a');fotos.quitar(deA.clave);
 assert.throws(()=>fotos.validar('con_danos'),/Falta la foto del daño 1/);
 fotos.deshacer();assert.doesNotThrow(()=>fotos.validar('con_danos'));
 // Cambiar a «Sin daños» conserva lo cargado y exige resolverlo antes de continuar.
 car='sin_danos';assert.throws(()=>fotos.validar('sin_danos'),/Sin daños/);assert.equal(fotos.borrador().fotos.length,5);
}));
