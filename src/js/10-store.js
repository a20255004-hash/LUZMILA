/* =========================================================
   Estado, almacenamiento y acciones
   Los datos viven en la misma estructura que las versiones anteriores
   (data/users/local/profile/...), así nada se pierde al actualizar.
   ========================================================= */
const DEFAULT_PROFILE = {
  nombre:"Luzmila", asistente:"Mila", appUrl:"",
  avatar:{ piel:"#C98E68", pelo:"#1B1311", ropa:"#1F1B24", labios:"#B4505A", lentes:false, aretes:true },
  ajustes:{ umbralGasto:100, proactividad:"normal", vozNombre:"", vozRate:1, vozPitch:1, hablar:true, autoEnviar:true,
            metodoPorDefecto:"Efectivo", silencioDesde:"23:00", silencioHasta:"07:00", tema:"auto", movimiento:"normal", inicioDia:6,
            coach:{ activo:true, estricto:false, intervalos:[30,60,120], maxDia:8, sistema:true, celular:true, gracia:10 } },
  ciclo:{ recordar:false, diasAntes:2, mostrarTexto:false, sync:true, pin:"", enInicio:false },
  descanso:null, fuentes:{}, frase:{ cats:[] },
  categorias:["Comida","Pasajes","Apoyo al hogar","Mascotas","Deudas","Cuidado personal","Recargas","Estudios","Salud","Ocio","Inversión","Otros"],
  metodos:["Efectivo","Yape","Plin","Tarjeta Scotiabank","Transferencia"],
  fuentes:["Scotiabank","Yape","Prácticas","Familia","Otro"],
  presupuestos:{},
  areas:["Tesis","Prácticas","Estudios","Personal","NUTRIMISI"]
};
const DEV_ID = (()=>{ try{ let v=localStorage.getItem("mila-dev"); if(!v){ v=Math.random().toString(36).slice(2,10); localStorage.setItem("mila-dev", v); } return v; }catch{ return "x"; } })();
const COLS = ["tareas","movimientos","memorias","notas","habitos","metas","registro","alertas","recuerdos","animo","eventos","frases","ciclo","ciclodia","media"];
const S = {
  route:"hoy", profile:structuredClone(DEFAULT_PROFILE), chat:[], loaded:{}, standalone:false,
  cal:{ status:"none", msg:"", ranges:{}, events:new Map() },
  agenda:{ view: innerWidth<760 ? "3dias" : "semana", date:new Date(), hourH: 54 },
  dinero:{ mes: ymd(new Date()).slice(0,7), cat:null, tipo:"todos", q:"" },
  tareasUI:{ filtro:"hoy", area:"", vista:"lista", q:"" },
  recUI:{ tab:"diario", emo:"", q:"" }, memUI:{ q:"", cat:"", fuente:"" }, fraseUI:{ cat:"", tab:"hoy", i:0 }, cicloUI:{ mes:null, abierto:false }, fuentesUI:{ cargando:false },
  crecerUI:{ tab:"habitos" },
  ctx:{ last:null, pending:null, lastFree:"" },
  ui:{ chatOpen: false, sheet:null },
  busy:false
};
COLS.forEach(c => S[c] = []);

let db=null, mcp=null;
const Store = {
  P:null, q:new Map(), unsubs:[],
  chain(key, fn){ const prev=this.q.get(key)||Promise.resolve(); const p=prev.catch(()=>{}).then(fn); this.q.set(key,p); return p; },
  col(c){ return this.P.collection(c); },
  async set(c,id,data){ return this.chain(c+"/"+id, ()=>this.col(c).doc(id).set(data)); },
  async update(c,id,patch){ return this.chain(c+"/"+id, ()=>this.col(c).doc(id).update(patch)); },
  async del(c,id){ return this.chain(c+"/"+id, ()=>this.col(c).doc(id).delete()); },
  async add(c,data){ const id=uid8(); await this.set(c,id,data); return id; },
  async saveProfile(patch){
    S.profile = deepMerge(S.profile, patch);
    return this.chain("profile", async ()=>{ const s=await this.P.get(); if(s.exists) await this.P.update(patch); else await this.P.set(S.profile); });
  },
  async saveChat(){ const turnos = S.chat.slice(-60).map(m=>({r:m.r, t:m.t, ts:m.ts, cards:(m.cards||[]).filter(c=>c.k!=="chips")})); return this.chain("chat", ()=>this.col("estado").doc("chat").set({turnos})); },
  subscribe(){
    COLS.forEach(c=>{
      this.unsubs.push(this.col(c).onSnapshot(snap=>{ S[c] = snap.docs.map(d=>({id:d.id, ...d.data()})); S.loaded[c]=true; render(); }));
    });
    this.unsubs.push(this.P.onSnapshot(snap=>{
      S.profile = deepMerge(structuredClone(DEFAULT_PROFILE), snap.exists ? snap.data() : {});
      if(!snap.exists && !this.created){ this.created=true; this.chain("profile", ()=>this.P.set(S.profile)); }
      S.loaded.profile = true; aplicarTema(); render();
    }));
    this.unsubs.push(this.col("estado").doc("chat").onSnapshot(snap=>{ if(snap.exists && !S.busy){ S.chat=(snap.data().turnos||[]).slice(); render(); } }));
  }
};
function deepMerge(a,b){
  if(!b || typeof b!=="object" || Array.isArray(b)) return b===undefined ? a : b;
  const out = Array.isArray(a)||typeof a!=="object"||!a ? {} : {...a};
  for(const k of Object.keys(b)) out[k] = (b[k] && typeof b[k]==="object" && !Array.isArray(b[k])) ? deepMerge(out[k]||{}, b[k]) : b[k];
  return out;
}
// db de respaldo en memoria (solo si se abre fuera de la app)
function memDb(){
  const tree={}, ls=new Set(); const notify=()=>queueMicrotask(()=>ls.forEach(f=>f()));
  const docSnap=p=>({id:p.split("/").pop(), exists:tree[p]!==undefined, data:()=>tree[p]});
  const doc=p=>({ async get(){return docSnap(p);}, async set(d){tree[p]=structuredClone(d);notify();}, async update(d){tree[p]={...tree[p],...structuredClone(d)};notify();}, async delete(){delete tree[p];notify();},
    onSnapshot(f){ const r=()=>f(docSnap(p)); ls.add(r); queueMicrotask(r); return ()=>ls.delete(r); }, collection:s=>col(p+"/"+s) });
  const col=p=>({ doc:id=>doc(p+"/"+(id||uid8())), onSnapshot(f){ const r=()=>f({docs:Object.keys(tree).filter(k=>k.split("/").slice(0,-1).join("/")===p).map(docSnap)}); ls.add(r); queueMicrotask(r); return ()=>ls.delete(r); } });
  return {doc};
}

/* ---------------- Categorías visuales (agenda, tareas y áreas) ---------------- */
const CATS = {
  estudios:{n:"Estudios", c:"#7C5CFF", kw:/clase|curso|estudi|examen|parcial|universidad|unjbg|exposici|seminario|taller|leer|lectura|practica calificada|trabajo grupal|tarea de/},
  tesis:{n:"Tesis", c:"#D9468C", kw:/tesis|asesor|socializacion|capitulo|marco teorico|encuesta|instrumento|jurado|sustentacion/},
  practicas:{n:"Prácticas", c:"#E8912D", kw:/practica|roqaseg|oficina|reunion|jefe|turno|informe|trabajo/},
  salud:{n:"Salud", c:"#1FA97A", kw:/doctor|medic|dentista|gimnasio|gym|ejercicio|correr|caminar|yoga|terapia|cita medica|dormir|meditar/},
  personal:{n:"Personal", c:"#3A8DDE", kw:/cumple|familia|mama|papa|herman|amig|salida|cine|almuerzo|cena|viaje|iglesia|misa|compras|casa/},
  dinero:{n:"Dinero", c:"#119C9C", kw:/pago|pagar|banco|scotiabank|deuda|cuota|yape|presupuesto/},
  nutrimisi:{n:"NUTRIMISI", c:"#C2702B", kw:/nutrimisi|gato|gatit|mascota/},
  otros:{n:"Otros", c:"#8A86A6", kw:/$^/}
};
function catDe(texto, explicita){
  if(explicita){ const k=norm(explicita); const f=Object.entries(CATS).find(([id,c])=>id===k||norm(c.n)===k); if(f) return f[0]; }
  const t=norm(texto); for(const [id,c] of Object.entries(CATS)) if(c.kw.test(t)) return id; return "otros";
}
const catColor = id => (CATS[id]||CATS.otros).c;
const areaCat = a => catDe("", a) !== "otros" ? catDe("", a) : catDe(a||"");

/* ---------------- Registro de acciones (para deshacer) ---------------- */
async function logAction(texto, deshacer){
  const id = await Store.add("registro", {texto, deshacer:deshacer||null, ts:Date.now(), estado:"hecho"});
  const old = [...S.registro].sort((a,b)=>a.ts-b.ts);
  if(old.length>90) for(const o of old.slice(0, old.length-70)) Store.del("registro", o.id).catch(()=>{});
  return id;
}
async function undo(logId){
  let l = logId ? S.registro.find(x=>x.id===logId) : [...S.registro].filter(x=>x.deshacer && x.estado!=="deshecho").sort((a,b)=>b.ts-a.ts)[0];
  if(!l || !l.deshacer || l.estado==="deshecho") return {ok:false, resumen:"No hay nada reciente que deshacer."};
  const d = l.deshacer;
  try{
    if(d.op==="del") await Store.del(d.col, d.id);
    else if(d.op==="restore") await Store.set(d.col, d.id, d.data);
    else if(d.op==="restore_field") await Store.update(d.col, d.id, {[d.field]:d.data});
    else if(d.op==="cal_del"){ await Cal.call("delete_event",{eventId:d.eventId}); S.cal.events.delete(d.eventId); }
    else if(d.op==="cal_update"){ await Cal.call("update_event",{eventId:d.eventId, startTime:d.startTime, endTime:d.endTime, summary:d.summary}); Cal.invalidar(); }
    else if(d.op==="cal_restore"){ await Cal.call("create_event", d.data); Cal.invalidar(); }
    else if(d.op==="alerta_del"){ await Cal.call("delete_event",{eventId:d.eventId}).catch(()=>{}); await Store.del("alertas", d.id); S.cal.events.delete(d.eventId); }
    await Store.update("registro", l.id, {estado:"deshecho"});
    render(); return {ok:true, resumen:"Deshecho: "+l.texto};
  }catch(e){ return {ok:false, resumen:"No pude deshacerlo: "+errMsg(e)}; }
}
const lastLog = () => [...S.registro].sort((a,b)=>b.ts-a.ts)[0];
function errMsg(e){ return e?.message || e?.code || String(e||"error"); }

/* ---------------- Google Calendar ---------------- */
const CALN = "Google Calendar";
const Cal = {
  ok(){ return !!mcp && window.MilaApp?.Google?.valido(); },
  disponible(){ return !!mcp; },
  async call(tool, input){ if(!mcp) throw {code:"capability_disabled", message:"Conecta Google en Ajustes."}; const r = await mcp.callTool(CALN, tool, input); return r.payload ?? r; },
  norm(e){
    const sd = e.start?.dateTime || e.start?.date, ed = e.end?.dateTime || e.end?.date; if(!sd) return null;
    const allDay = !e.start?.dateTime;
    const ini = allDay ? pymd(sd) : new Date(sd), fin = ed ? (allDay ? pymd(ed) : new Date(ed)) : ini;
    const titulo = e.summary||"(sin título)";
    return { id:e.id, src:"g", titulo, ini, fin, allDay, link:e.htmlLink||"", meet:e.conferenceUrl||e.hangoutLink||"", notas:e.description||"", lugar:e.location||"",
      recurrente:!!e.recurringEventId, propio: e.organizer?.self ?? e.creator?.self ?? true,
      cat: catDe(titulo+" "+(e.description||""), e.extendedProperties?.private?.milaCat), alerta: /^🔔/.test(titulo) };
  },
  invalidar(){ Object.keys(S.cal.ranges).forEach(k=>S.cal.ranges[k].at=0); },
  async cargar(desde, hasta, {force=false}={}){
    if(!mcp) return [];
    const key = desde+"_"+hasta, prev=S.cal.ranges[key];
    if(prev && !force && Date.now()-prev.at < 120000) return prev.list;
    if(prev?.p) return prev.p;
    const p = (async()=>{
      try{
        let all=[], pageToken, g=0;
        do{ const r = await this.call("list_events", {startTime:`${desde}T00:00:00`, endTime:`${ymd(addDays(pymd(hasta),1))}T00:00:00`, orderBy:"startTime", pageSize:250, ...(pageToken?{pageToken}:{})});
            all = all.concat((r?.events||[]).map(e=>this.norm(e)).filter(Boolean)); pageToken=r?.nextPageToken; g++; } while(pageToken && g<4);
        for(const [id,ev] of S.cal.events){ if(ymd(ev.ini)>=desde && ymd(ev.ini)<=hasta) S.cal.events.delete(id); }
        all.forEach(ev=>S.cal.events.set(ev.id, ev));
        S.cal.ranges[key] = {at:Date.now(), list:all}; S.cal.status="ok"; S.cal.msg=""; render(); return all;
      }catch(e){ delete S.cal.ranges[key]; S.cal.status="error"; S.cal.msg=errMsg(e); render(); throw e; }
    })();
    S.cal.ranges[key] = {at:0, p}; return p;
  }
};
// eventos locales (cuando Google no está conectado) con la misma forma
function evLocal(e){ const ini=new Date(e.ini), fin=new Date(e.fin||e.ini); return {id:e.id, src:"l", titulo:e.titulo, ini, fin, allDay:!!e.allDay, notas:e.notas||"", lugar:e.lugar||"", cat:e.cat||catDe(e.titulo), rec:e.rec, propio:true}; }
function tareaComoEvento(t){ if(!t.vence || !t.hora || t.estado==="hecha") return null; const ini=new Date(`${t.vence}T${t.hora}:00`); return {id:"t:"+t.id, tid:t.id, src:"t", titulo:t.titulo, ini, fin:addMin(ini, Number(t.dur)||30), allDay:false, cat:areaCat(t.area)||catDe(t.titulo), tarea:true, prioridad:t.prioridad}; }
function eventosEntre(desde, hasta, {tareas=true}={}){
  const out = [...S.cal.events.values(), ...S.eventos.map(evLocal)];
  if(tareas) S.tareas.forEach(t=>{ const e=tareaComoEvento(t); if(e) out.push(e); });
  return out.filter(ev => ymd(ev.ini)<=hasta && ymd(ev.allDay?addDays(ev.fin,-1):ev.fin)>=desde && ev.fin>=ev.ini).sort((a,b)=>a.ini-b.ini);
}
function buscarEvento(id){ if(!id) return null; if(String(id).startsWith("t:")){ const t=S.tareas.find(x=>"t:"+x.id===id); return t?tareaComoEvento(t):null; } return S.cal.events.get(id) || (S.eventos.find(e=>e.id===id) ? evLocal(S.eventos.find(e=>e.id===id)) : null); }
function cruces(list){ const t=list.filter(x=>!x.allDay && x.fin>x.ini).sort((a,b)=>a.ini-b.ini); const out=new Set(); for(let i=0;i<t.length;i++) for(let j=i+1;j<t.length;j++){ if(t[j].ini<t[i].fin){ out.add(t[i].id); out.add(t[j].id); } else break; } return out; }

/* ---------------- Acciones: las usa la interfaz, el motor local y la IA ---------------- */
const A = {
  /* ---- dinero ---- */
  async movimiento(inp, origen="mila"){
    const tipo = /ingreso/i.test(inp.tipo) ? "ingreso" : "gasto";
    const monto = round2(Number(String(inp.monto??"").replace(",",".")));
    if(!(monto>0)) throw new Error("Falta el monto o no es válido.");
    const concepto = capital(String(inp.concepto||"").trim()) || (tipo==="gasto"?"Compra":"Ingreso");
    const categoria = tipo==="gasto" ? (matchCat(inp.categoria) || inferCat(concepto) || "Otros") : "";
    const metodo = inp.metodo ? (S.profile.metodos.find(m=>norm(m)===norm(inp.metodo)) || inferMetodo(inp.metodo) || String(inp.metodo)) : (inferMetodo(concepto) || S.profile.ajustes.metodoPorDefecto);
    const fecha = /^\d{4}-\d{2}-\d{2}$/.test(inp.fecha||"") ? inp.fecha : todayStr();
    const doc = { tipo, monto, concepto, categoria, metodo, fecha, detalles:String(inp.detalles||""), fuente: tipo==="ingreso" ? String(inp.fuente||"") : "",
      estado:"registrado", origen, creado:Date.now(), disp:DEV_ID, motivoPendiente:"" };
    const id = await Store.add("movimientos", doc);
    const log = await logAction(`${tipo==="gasto"?"Gasto":"Ingreso"} ${money(monto)} · ${concepto}`, {op:"del", col:"movimientos", id});
    S.ctx.last = {type:"mov", id}; HojaSync.pronto();
    return { ok:true, id, log, doc, resumen:`${tipo} de ${money(monto)} registrado (${concepto}${categoria?", "+categoria:""}, ${metodo}, ${fecha})` };
  },
  async editarMovimiento(id, cambios){
    const m = S.movimientos.find(x=>x.id===id); if(!m) throw new Error("No encontré ese movimiento.");
    const prev = {...m}; delete prev.id; const patch = {};
    if(cambios.monto!==undefined){ const v=round2(Number(String(cambios.monto).replace(",","."))); if(!(v>0)) throw new Error("Ese monto no es válido."); patch.monto=v; }
    if(cambios.tipo && /ingreso|gasto/.test(cambios.tipo)) patch.tipo = /ingreso/.test(cambios.tipo)?"ingreso":"gasto";
    if(cambios.concepto) patch.concepto = capital(cambios.concepto);
    if(cambios.categoria) patch.categoria = matchCat(cambios.categoria) || capital(cambios.categoria);
    if(cambios.metodo) patch.metodo = S.profile.metodos.find(x=>norm(x)===norm(cambios.metodo)) || inferMetodo(cambios.metodo) || cambios.metodo;
    if(cambios.fecha && /^\d{4}-\d{2}-\d{2}$/.test(cambios.fecha)) patch.fecha = cambios.fecha;
    if(cambios.fuente!==undefined) patch.fuente = String(cambios.fuente);
    if(cambios.detalles!==undefined) patch.detalles = String(cambios.detalles);
    if(cambios.estado) patch.estado = cambios.estado;
    if((patch.tipo||m.tipo)==="gasto" && !(patch.categoria||m.categoria)) patch.categoria = inferCat(patch.concepto||m.concepto) || "Otros";
    if(!Object.keys(patch).length) throw new Error("No me dijiste qué cambiar.");
    await Store.update("movimientos", id, patch);
    const log = await logAction(`Movimiento corregido: ${m.concepto}`, {op:"restore", col:"movimientos", id, data:prev});
    S.ctx.last = {type:"mov", id}; HojaSync.pronto();
    return {ok:true, id, log, patch, resumen:`Corregido: ${Object.entries(patch).map(([k,v])=>k+" → "+(k==="monto"?money(v):v)).join(", ")}`};
  },
  async borrarMovimiento(id){
    const m = S.movimientos.find(x=>x.id===id); if(!m) throw new Error("No encontré ese movimiento.");
    const prev = {...m}; delete prev.id;
    await Store.del("movimientos", id);
    const log = await logAction(`${m.tipo==="gasto"?"Gasto":"Ingreso"} borrado: ${money(m.monto)} · ${m.concepto}`, {op:"restore", col:"movimientos", id, data:prev});
    S.ctx.last = null; HojaSync.pronto();
    return {ok:true, log, resumen:`Borré el ${m.tipo} de ${money(m.monto)} (${m.concepto})`};
  },
  /* ---- tareas ---- */
  async tarea(inp){
    const titulo = capital(String(inp.titulo||"").trim()); if(!titulo) throw new Error("Falta el nombre de la tarea.");
    const doc = { titulo, estado:"pendiente", prioridad:["alta","media","baja"].includes(inp.prioridad)?inp.prioridad:"media",
      vence:/^\d{4}-\d{2}-\d{2}$/.test(inp.vence||"")?inp.vence:"", hora:/^\d{2}:\d{2}$/.test(inp.hora||"")?inp.hora:"",
      area:String(inp.area||""), notas:String(inp.notas||""), dur:Number(inp.dur)||30, recordar:!!inp.recordar, creado:Date.now() };
    if(!doc.area){ const c=catDe(titulo); if(c!=="otros") doc.area = CATS[c].n; }
    const id = await Store.add("tareas", doc);
    const log = await logAction(`Tarea creada: ${titulo}`, {op:"del", col:"tareas", id});
    S.ctx.last = {type:"tarea", id};
    return {ok:true, id, log, doc, resumen:`Tarea «${titulo}»${doc.vence?" para "+relDia(doc.vence):""}${doc.hora?" a las "+doc.hora:""}`};
  },
  async editarTarea(id, cambios){
    const t = S.tareas.find(x=>x.id===id); if(!t) throw new Error("No encontré esa tarea.");
    const prev = {...t}; delete prev.id; const patch = {};
    for(const k of ["titulo","estado","prioridad","vence","hora","area","notas"]) if(cambios[k]!==undefined) patch[k]=String(cambios[k]);
    if(cambios.dur!==undefined) patch.dur = Number(cambios.dur)||30;
    if(patch.estado==="hecha") patch.hecha_en = Date.now();
    if(patch.estado==="pendiente") patch.hecha_en = null;
    if((patch.vence!==undefined && patch.vence!==t.vence) || (patch.hora!==undefined && patch.hora!==t.hora)) patch.seg = {...(t.seg||{}), nivel:0, prox:0};
    if(patch.estado==="hecha" && t.seg?.calId) setTimeout(()=>Coach.quitarCal({...t}).catch(()=>{}), 50);
    await Store.update("tareas", id, patch);
    const log = await logAction(patch.estado==="hecha" ? `Tarea hecha: ${t.titulo}` : `Tarea actualizada: ${t.titulo}`, {op:"restore", col:"tareas", id, data:prev});
    S.ctx.last = {type:"tarea", id};
    return {ok:true, id, log, resumen: patch.estado==="hecha" ? `«${t.titulo}» completada` : `Tarea «${t.titulo}» actualizada`};
  },
  async borrarTarea(id){
    const t = S.tareas.find(x=>x.id===id); if(!t) throw new Error("No encontré esa tarea.");
    const prev = {...t}; delete prev.id; if(t.seg?.calId){ try{ if(Cal.ok()) await Cal.call("delete_event",{eventId:t.seg.calId}); }catch{} prev.seg={...t.seg, calId:null}; } await Store.del("tareas", id);
    const log = await logAction(`Tarea borrada: ${t.titulo}`, {op:"restore", col:"tareas", id, data:prev});
    S.ctx.last = null; return {ok:true, log, resumen:`Borré la tarea «${t.titulo}»`};
  },
  /* ---- agenda ---- */
  async evento(inp){
    const ini = inp.ini instanceof Date ? inp.ini : new Date(inp.inicio || inp.ini);
    if(isNaN(ini)) throw new Error("No entendí la fecha u hora.");
    const allDay = !!inp.allDay;
    const fin = inp.fin ? new Date(inp.fin) : (allDay ? addDays(startDay(ini),1) : addMin(ini, Number(inp.dur)||60));
    if(!(fin>ini)) throw new Error("La hora de fin debe ser después del inicio.");
    const titulo = capital(String(inp.titulo||"Evento")); const cat = catDe(titulo, inp.cat); const rec = Number.isFinite(Number(inp.rec)) ? clamp(Number(inp.rec),0,10080) : 30;
    const choques = eventosEntre(ymd(ini), ymd(ini), {tareas:false}).filter(e=>!e.allDay && !allDay && e.ini<fin && e.fin>ini);
    if(Cal.ok()){
      const body = { summary:titulo, startTime:isoLocal(ini), endTime:isoLocal(fin), allDay, description:String(inp.notas||""), location:String(inp.lugar||""),
        overrideReminders:[{method:"popup", minutes:rec}], extendedProperties:{private:{milaCat:cat}} };
      const p = await Cal.call("create_event", body); const ev = p?.event || p || {};
      if(!ev.id) throw new Error("Google Calendar no confirmó el evento.");
      const n = Cal.norm({...ev, summary:ev.summary||titulo, start:ev.start||(allDay?{date:ymd(ini)}:{dateTime:isoLocal(ini)}), end:ev.end||(allDay?{date:ymd(fin)}:{dateTime:isoLocal(fin)})}); if(n){ n.cat=cat; S.cal.events.set(n.id, n); }
      Cal.invalidar();
      const log = await logAction(`Evento creado: ${titulo} (${fmtDia(ini)}${allDay?"":" "+hhmm(ini)})`, {op:"cal_del", eventId:ev.id});
      S.ctx.last = {type:"evento", id:ev.id}; render();
      return {ok:true, id:ev.id, log, google:true, choques, resumen:`Evento «${titulo}» ${relDia(ini)}${allDay?"":" a las "+hhmm(ini)} en tu Google Calendar`};
    }
    const doc = { titulo, ini:isoLocal(ini), fin:isoLocal(fin), allDay, cat, lugar:String(inp.lugar||""), notas:String(inp.notas||""), rec, creado:Date.now() };
    const id = await Store.add("eventos", doc);
    const log = await logAction(`Evento creado: ${titulo}`, {op:"del", col:"eventos", id});
    S.ctx.last = {type:"evento", id};
    return {ok:true, id, log, google:false, choques, resumen:`Evento «${titulo}» ${relDia(ini)}${allDay?"":" a las "+hhmm(ini)}`};
  },
  async editarEvento(id, cambios){
    const ev = buscarEvento(id); if(!ev) throw new Error("No encontré ese evento.");
    if(ev.src==="t"){ // bloque de tarea en la agenda
      const ini = cambios.ini ? new Date(cambios.ini) : ev.ini; const fin = cambios.fin ? new Date(cambios.fin) : addMin(ini, (ev.fin-ev.ini)/60000);
      return A.editarTarea(ev.tid, {vence:ymd(ini), hora:hhmm(ini), dur:Math.max(15, Math.round((fin-ini)/60000)), ...(cambios.titulo?{titulo:cambios.titulo}:{})});
    }
    const ini = cambios.ini ? new Date(cambios.ini) : ev.ini;
    const fin = cambios.fin ? new Date(cambios.fin) : (cambios.ini ? addMin(ini, (ev.fin-ev.ini)/60000) : ev.fin);
    const titulo = cambios.titulo ? capital(cambios.titulo) : ev.titulo;
    if(ev.src==="g"){
      const body = { eventId:ev.id, startTime:isoLocal(ini), endTime:isoLocal(fin), allDay:ev.allDay, summary:titulo };
      if(cambios.notas!==undefined) body.description = cambios.notas; if(cambios.lugar!==undefined) body.location = cambios.lugar;
      if(cambios.cat) body.extendedProperties = {private:{milaCat:cambios.cat}};
      if(cambios.rec!==undefined) body.overrideReminders = [{method:"popup", minutes:Number(cambios.rec)}];
      await Cal.call("update_event", body);
      const log = await logAction(`Evento cambiado: ${ev.titulo}`, {op:"cal_update", eventId:ev.id, startTime:isoLocal(ev.ini), endTime:isoLocal(ev.fin), summary:ev.titulo});
      S.cal.events.set(ev.id, {...ev, ini, fin, titulo, cat:cambios.cat||ev.cat, notas:cambios.notas??ev.notas, lugar:cambios.lugar??ev.lugar}); Cal.invalidar(); S.ctx.last={type:"evento", id:ev.id}; render();
      return {ok:true, id:ev.id, log, resumen:`«${titulo}» quedó ${relDia(ini)}${ev.allDay?"":" a las "+hhmm(ini)}`};
    }
    const raw = S.eventos.find(e=>e.id===id); const prev={...raw}; delete prev.id;
    const patch = { ini:isoLocal(ini), fin:isoLocal(fin), titulo };
    for(const k of ["notas","lugar","cat","rec","allDay"]) if(cambios[k]!==undefined) patch[k]=cambios[k];
    await Store.update("eventos", id, patch);
    const log = await logAction(`Evento cambiado: ${ev.titulo}`, {op:"restore", col:"eventos", id, data:prev});
    S.ctx.last={type:"evento", id};
    return {ok:true, id, log, resumen:`«${titulo}» quedó ${relDia(ini)}${ev.allDay?"":" a las "+hhmm(ini)}`};
  },
  async borrarEvento(id){
    const ev = buscarEvento(id); if(!ev) throw new Error("No encontré ese evento.");
    if(ev.src==="t") return A.editarTarea(ev.tid, {hora:""});
    if(ev.src==="g"){
      await Cal.call("delete_event", {eventId:ev.id}); S.cal.events.delete(ev.id); Cal.invalidar();
      const data = { summary:ev.titulo, startTime:isoLocal(ev.ini), endTime:isoLocal(ev.fin), allDay:ev.allDay, description:ev.notas, location:ev.lugar, extendedProperties:{private:{milaCat:ev.cat}} };
      const log = await logAction(`Evento borrado: ${ev.titulo}`, {op:"cal_restore", data});
      S.ctx.last=null; render(); return {ok:true, log, resumen:`Borré «${ev.titulo}» de tu calendario`};
    }
    const raw=S.eventos.find(e=>e.id===id); const prev={...raw}; delete prev.id; await Store.del("eventos", id);
    const log = await logAction(`Evento borrado: ${ev.titulo}`, {op:"restore", col:"eventos", id, data:prev});
    S.ctx.last=null; return {ok:true, log, resumen:`Borré «${ev.titulo}»`};
  },
  async alerta(inp){ // aviso que suena en el celular (Google Calendar)
    const cuando = new Date(inp.cuando); if(isNaN(cuando)) throw new Error("No entendí cuándo avisarte.");
    const titulo = String(inp.titulo||"Recordatorio");
    if(!Cal.ok()) return {ok:false, resumen:"Para avisos en el celular necesito Google Calendar conectado."};
    const p = await Cal.call("create_event", { summary:`🔔 ${titulo}`, startTime:isoLocal(cuando), endTime:isoLocal(addMin(cuando,15)), description:`${inp.mensaje||titulo}\n\n— ${S.profile.asistente}`,
      overrideReminders:[{method:"popup", minutes:0},{method:"popup", minutes:10}], availability:"AVAILABILITY_FREE" });
    const ev = p?.event || p || {}; if(!ev.id) throw new Error("Google Calendar no confirmó el aviso.");
    const id = await Store.add("alertas", { titulo, mensaje:String(inp.mensaje||titulo), cuando:isoLocal(cuando), eventId:ev.id, link:ev.htmlLink||"", creado:Date.now() });
    const n = Cal.norm(ev); if(n) S.cal.events.set(n.id, n);
    const log = await logAction(`Aviso programado: ${titulo}`, {op:"alerta_del", id, eventId:ev.id});
    return {ok:true, id, log, resumen:`Aviso «${titulo}» ${relDia(cuando)} a las ${hhmm(cuando)}`};
  },
  /* ---- memoria (lo que Mila sabe de ti) ---- */
  async recordar(inp){
    const texto = capital(String(inp.texto||"").trim()); if(!texto) throw new Error("Falta qué recordar.");
    const dup = S.memorias.find(m=>norm(m.texto)===norm(texto)); if(dup) return {ok:true, id:dup.id, dup:true, resumen:"Eso ya lo tenía guardado."};
    const id = await Store.add("memorias", { texto, tipo:String(inp.tipo||"hecho"), area:String(inp.area||"General"), fuente:String(inp.fuente||"Me lo dijiste"), confianza:inp.confianza==="inferido"?"inferido":"confirmado", creado:Date.now(), actualizado:Date.now() });
    const log = await logAction(`Recordaré: ${texto.slice(0,60)}`, {op:"del", col:"memorias", id});
    S.ctx.last = {type:"mem", id}; return {ok:true, id, log, resumen:`Guardé en tu memoria: ${texto}`};
  },
  async corregirMemoria(id, texto){
    const m=S.memorias.find(x=>x.id===id); if(!m) throw new Error("No encontré ese dato.");
    const prev={...m}; delete prev.id; await Store.update("memorias", id, {texto:capital(texto), confianza:"confirmado", actualizado:Date.now()});
    const log = await logAction(`Dato corregido`, {op:"restore", col:"memorias", id, data:prev}); S.ctx.last={type:"mem", id};
    return {ok:true, id, log, resumen:`Corregido: ${capital(texto)}`};
  },
  async olvidar(id){
    const m=S.memorias.find(x=>x.id===id); if(!m) throw new Error("No encontré ese dato.");
    const prev={...m}; delete prev.id; await Store.del("memorias", id);
    const log = await logAction(`Olvidado: ${m.texto.slice(0,60)}`, {op:"restore", col:"memorias", id, data:prev}); S.ctx.last=null;
    return {ok:true, log, resumen:`Olvidé: ${m.texto}`};
  },
  /* ---- diario de recuerdos ---- */
  async recuerdo(inp){
    let relato = String(inp.relato||inp.texto||"").trim(); if(!relato) throw new Error("El recuerdo está vacío.");
    relato = relato.charAt(0).toUpperCase() + relato.slice(1);
    const meta = recMeta(relato);
    const doc = { relato, texto:relato, titulo:capital(inp.titulo||meta.titulo), fecha:/^\d{4}-\d{2}-\d{2}$/.test(inp.fecha||"")?inp.fecha:(meta.fecha||todayStr()), fecha_aprox:String(inp.fecha_aprox||""),
      emocion: EMOS.some(e=>e[0]===inp.emocion) ? inp.emocion : meta.emocion, intensidad:3, personas:inp.personas||meta.personas, lugar:String(inp.lugar||""), etiquetas:inp.etiquetas||meta.etiquetas,
      estado:"listo", origen:inp.origen||"conversación", creado:Date.now() };
    const id = await Store.add("recuerdos", doc);
    const log = await logAction(`Recuerdo guardado: ${doc.titulo}`, {op:"del", col:"recuerdos", id});
    S.ctx.last = {type:"rec", id};
    return {ok:true, id, log, doc, resumen:`Guardé tu recuerdo «${doc.titulo}»`};
  },
  async editarRecuerdo(id, cambios){
    const r=S.recuerdos.find(x=>x.id===id); if(!r) throw new Error("No encontré ese recuerdo."); const prev={...r}; delete prev.id;
    const patch={}; for(const k of ["titulo","texto","fecha","emocion","lugar"]) if(cambios[k]!==undefined) patch[k]=cambios[k]; if(patch.texto) patch.relato=patch.texto;
    await Store.update("recuerdos", id, patch); const log=await logAction(`Recuerdo editado: ${r.titulo}`, {op:"restore", col:"recuerdos", id, data:prev});
    return {ok:true, id, log, resumen:"Recuerdo actualizado"};
  },
  async borrarRecuerdo(id){
    const r=S.recuerdos.find(x=>x.id===id); if(!r) throw new Error("No encontré ese recuerdo."); const prev={...r}; delete prev.id;
    await Store.del("recuerdos", id); const log=await logAction(`Recuerdo borrado: ${r.titulo}`, {op:"restore", col:"recuerdos", id, data:prev}); S.ctx.last=null;
    return {ok:true, log, resumen:`Borré el recuerdo «${r.titulo}»`};
  },
  /* ---- notas ---- */
  async nota(inp){
    const texto = capital(String(inp.texto||"").trim()); if(!texto) throw new Error("La nota está vacía.");
    const id = await Store.add("notas", { texto, tipo: inp.tipo==="idea"?"idea":"nota", area:String(inp.area||""), creado:Date.now() });
    const log = await logAction(`${inp.tipo==="idea"?"Idea":"Nota"} guardada`, {op:"del", col:"notas", id}); S.ctx.last={type:"nota", id};
    return {ok:true, id, log, resumen:`${inp.tipo==="idea"?"Idea":"Nota"} guardada`};
  },
  async borrarNota(id){ const n=S.notas.find(x=>x.id===id); if(!n) throw new Error("No encontré esa nota."); const prev={...n}; delete prev.id; await Store.del("notas", id); const log=await logAction("Nota borrada", {op:"restore", col:"notas", id, data:prev}); return {ok:true, log, resumen:"Nota borrada"}; },
  /* ---- hábitos ---- */
  async habito(nombre, fecha=todayStr(), valor=true){
    const h = buscarHabito(nombre); if(!h) throw new Error(`No tienes un hábito llamado «${nombre}».`);
    const registros = {...(h.registros||{})}; const prev = {...(h.registros||{})};
    if(valor) registros[fecha]=true; else delete registros[fecha];
    await Store.update("habitos", h.id, {registros});
    const log = await logAction(`Hábito ${valor?"cumplido":"desmarcado"}: ${h.nombre}`, {op:"restore_field", col:"habitos", id:h.id, field:"registros", data:prev});
    S.ctx.last = {type:"habito", id:h.id};
    return {ok:true, id:h.id, log, racha:racha(h.id===h.id?{...h,registros}:h), resumen:`«${h.nombre}» ${valor?"cumplido":"desmarcado"} ${relDia(fecha)}`};
  },
  async nuevoHabito(inp){
    const nombre = capital(String(inp.nombre||"").trim()); if(!nombre) throw new Error("Falta el nombre del hábito.");
    if(buscarHabito(nombre)) return {ok:true, dup:true, resumen:`Ya tienes el hábito «${nombre}».`};
    const id = await Store.add("habitos", { nombre, icono:inp.icono||iconoHabito(nombre), color:inp.color||"", meta_semana:Number(inp.meta_semana)||7, registros:{}, creado:Date.now() });
    const log = await logAction(`Hábito creado: ${nombre}`, {op:"del", col:"habitos", id}); S.ctx.last={type:"habito", id};
    return {ok:true, id, log, resumen:`Nuevo hábito «${nombre}»`};
  },
  async borrarHabito(id){ const h=S.habitos.find(x=>x.id===id); if(!h) throw new Error("No encontré ese hábito."); const prev={...h}; delete prev.id; await Store.del("habitos", id); const log=await logAction(`Hábito borrado: ${h.nombre}`, {op:"restore", col:"habitos", id, data:prev}); return {ok:true, log, resumen:`Borré el hábito «${h.nombre}»`}; },
  /* ---- metas ---- */
  async meta(inp){
    if(inp.id){
      const g = S.metas.find(x=>x.id===inp.id); if(!g) throw new Error("No encontré esa meta.");
      const prev={...g}; delete prev.id; const patch={};
      for(const k of ["titulo","proxima_accion","fecha_limite","estado","area"]) if(inp[k]!==undefined) patch[k]=String(inp[k]);
      if(inp.progreso!==undefined) patch.progreso = clamp(Number(inp.progreso)||0, 0, 100);
      if(inp.avance){ patch.ultima_vez = todayStr(); patch.avances = [...(g.avances||[]), {fecha:todayStr(), texto:String(inp.avance===true?"":inp.avance)}].slice(-60); }
      if(patch.estado==="lograda") patch.progreso = 100;
      await Store.update("metas", g.id, patch);
      const log = await logAction(`Meta actualizada: ${g.titulo}`, {op:"restore", col:"metas", id:g.id, data:prev}); S.ctx.last={type:"meta", id:g.id};
      return {ok:true, id:g.id, log, resumen:`Meta «${g.titulo}» actualizada`};
    }
    const titulo = capital(String(inp.titulo||"").trim()); if(!titulo) throw new Error("Falta el nombre de la meta.");
    const id = await Store.add("metas", { titulo, area:String(inp.area||""), proxima_accion:String(inp.proxima_accion||""), fecha_limite:String(inp.fecha_limite||""), ultima_vez:todayStr(), progreso:0, avances:[], estado:"activa", creado:Date.now() });
    const log = await logAction(`Meta creada: ${titulo}`, {op:"del", col:"metas", id}); S.ctx.last={type:"meta", id};
    const activas = S.metas.filter(g=>g.estado==="activa").length+1;
    return {ok:true, id, log, resumen:`Meta «${titulo}» creada${activas>3?` (ojo: ya son ${activas} activas; tu regla es máximo 3)`:""}`};
  },
  async borrarMeta(id){ const g=S.metas.find(x=>x.id===id); if(!g) throw new Error("No encontré esa meta."); const prev={...g}; delete prev.id; await Store.del("metas", id); const log=await logAction(`Meta borrada: ${g.titulo}`, {op:"restore", col:"metas", id, data:prev}); return {ok:true, log, resumen:`Borré la meta «${g.titulo}»`}; },
  /* ---- ánimo ---- */
  async animo(estado, nota="", fecha=todayStr()){
    const prev = S.animo.find(a=>a.id===fecha); await Store.set("animo", fecha, {estado, fecha, nota:String(nota||prev?.nota||""), ts:Date.now()});
    const log = await logAction(`Ánimo: ${estado}`, prev ? {op:"restore", col:"animo", id:fecha, data:(({id,...r})=>r)(prev)} : {op:"del", col:"animo", id:fecha});
    return {ok:true, log, resumen:`Ánimo de ${relDia(fecha)}: ${estado}`};
  },
  /* ---- frases (propias y favoritas) ---- */
  async frase(inp){
    const texto = String(inp.texto||"").trim().replace(/^["“«]+|["”»]+$/g,""); if(!texto) throw new Error("La frase está vacía.");
    const dup = S.frases.find(f=>norm(f.texto)===norm(texto)); if(dup){ if(inp.fav && !dup.fav) await Store.update("frases", dup.id, {fav:true}); return {ok:true, id:dup.id, dup:true, resumen:"Esa frase ya estaba guardada."}; }
    const doc = { texto:capital(texto)+(/[.!?…]$/.test(texto)?"":"."), autor:String(inp.autor||""), cat:String(inp.cat||"Mías"), propia: inp.propia!==false, fav:!!inp.fav, clave:String(inp.clave||""), situacion:String(inp.situacion||""), origen:String(inp.origen||"Tú"), creado:Date.now() };
    const id = await Store.add("frases", doc); const log = await logAction(`Frase guardada`, {op:"del", col:"frases", id});
    return {ok:true, id, log, resumen:`Guardé tu frase`};
  },
  async favFrase(f){ // f: {id} de una guardada o {clave, texto, autor, cat} del banco
    if(f.id){ const x=S.frases.find(y=>y.id===f.id); if(!x) throw new Error("No encontré esa frase."); await Store.update("frases", x.id, {fav:!x.fav}); return {ok:true, fav:!x.fav}; }
    const x = S.frases.find(y=>y.clave && y.clave===f.clave);
    if(x){ if(x.propia===false){ await Store.del("frases", x.id); return {ok:true, fav:false}; } await Store.update("frases", x.id, {fav:!x.fav}); return {ok:true, fav:!x.fav}; }
    await Store.add("frases", {texto:f.texto, autor:f.autor||"", cat:f.cat||"", propia:false, fav:true, clave:f.clave, origen:"Banco de Mila", creado:Date.now()}); return {ok:true, fav:true};
  },
  async borrarFrase(id){ const x=S.frases.find(y=>y.id===id); if(!x) throw new Error("No encontré esa frase."); const prev={...x}; delete prev.id; await Store.del("frases", id); const log=await logAction("Frase borrada", {op:"restore", col:"frases", id, data:prev}); return {ok:true, log, resumen:"Frase borrada"}; },
  /* ---- mi ciclo (datos sensibles: nunca salen en notificaciones sin permiso) ---- */
  async periodoInicio(fecha=todayStr()){
    const abierto = S.ciclo.find(p=>!p.fin && diffDays(pymd(p.inicio), pymd(fecha))>=0 && diffDays(pymd(p.inicio), pymd(fecha))<=12);
    if(abierto) return {ok:true, id:abierto.id, dup:true, resumen:`Ya tenía registrado que tu periodo empezó ${relDia(abierto.inicio)}.`};
    const cerca = S.ciclo.find(p=>Math.abs(diffDays(pymd(p.inicio), pymd(fecha)))<=3);
    if(cerca) return {ok:true, id:cerca.id, dup:true, resumen:`Ya había un periodo que empezó ${relDia(cerca.inicio)}.`};
    const id = await Store.add("ciclo", {inicio:fecha, fin:"", notas:"", creado:Date.now()});
    const dia = S.ciclodia.find(d=>d.id===fecha); if(!dia?.flujo) await Store.set("ciclodia", fecha, {...(dia?(({id,...r})=>r)(dia):{}), fecha, flujo:dia?.flujo||3});
    const log = await logAction("Periodo registrado", {op:"del", col:"ciclo", id});
    return {ok:true, id, log, resumen:`Registré el inicio de tu periodo ${relDia(fecha)}`};
  },
  async periodoFin(fecha=todayStr()){
    const abierto = S.ciclo.filter(p=>!p.fin && p.inicio<=fecha).sort((a,b)=>b.inicio.localeCompare(a.inicio))[0];
    if(!abierto) return {ok:false, resumen:"No tengo un periodo abierto. ¿Quieres que registre cuándo empezó?"};
    const prev={...abierto}; delete prev.id; await Store.update("ciclo", abierto.id, {fin:fecha});
    const log = await logAction("Fin de periodo registrado", {op:"restore", col:"ciclo", id:abierto.id, data:prev});
    return {ok:true, id:abierto.id, log, dias:diffDays(pymd(abierto.inicio), pymd(fecha))+1, resumen:`Registré que tu periodo terminó ${relDia(fecha)} (${plural(diffDays(pymd(abierto.inicio), pymd(fecha))+1,"día","días")})`};
  },
  async editarPeriodo(id, cambios){ const p=S.ciclo.find(x=>x.id===id); if(!p) throw new Error("No encontré ese periodo."); const prev={...p}; delete prev.id; const patch={};
    for(const k of ["inicio","fin","notas"]) if(cambios[k]!==undefined) patch[k]=String(cambios[k]);
    if(patch.fin && patch.fin < (patch.inicio||p.inicio)) throw new Error("El fin no puede ser antes del inicio.");
    await Store.update("ciclo", id, patch); const log=await logAction("Periodo corregido", {op:"restore", col:"ciclo", id, data:prev}); return {ok:true, log, resumen:"Periodo actualizado"}; },
  async borrarPeriodo(id){ const p=S.ciclo.find(x=>x.id===id); if(!p) throw new Error("No encontré ese periodo."); const prev={...p}; delete prev.id; await Store.del("ciclo", id); const log=await logAction("Periodo borrado", {op:"restore", col:"ciclo", id, data:prev}); return {ok:true, log, resumen:"Periodo borrado"}; },
  async cicloDia(fecha, patch){
    const prev = S.ciclodia.find(d=>d.id===fecha); const base = prev ? (({id,...r})=>r)(prev) : {fecha};
    const doc = {...base, ...patch, fecha, ts:Date.now()};
    if(patch.sintomas) doc.sintomas = [...new Set(patch.sintomas)];
    await Store.set("ciclodia", fecha, doc);
    const log = await logAction("Registro de ciclo", prev ? {op:"restore", col:"ciclodia", id:fecha, data:base} : {op:"del", col:"ciclodia", id:fecha});
    return {ok:true, log, resumen:"Guardado en Mi ciclo"};
  },
  async borrarCicloTodo(){ for(const p of [...S.ciclo]) await Store.del("ciclo", p.id); for(const d of [...S.ciclodia]) await Store.del("ciclodia", d.id); return {ok:true, resumen:"Borré todos tus datos de Mi ciclo"}; },
  /* ---- descanso: pausa la insistencia sin culpas ---- */
  async descanso(hasta, motivo=""){
    const h = hasta || (()=>{ const d=addDays(startDay(new Date()),1); d.setHours(S.profile.ajustes.inicioDia||7); return d; })();
    await Store.saveProfile({descanso:{hasta:h.getTime(), motivo:String(motivo||""), desde:Date.now()}});
    return {ok:true, resumen:`Descanso activado hasta ${relDia(h)} ${h12(h)}`};
  },
  async finDescanso(){ await Store.saveProfile({descanso:null}); return {ok:true, resumen:"Descanso terminado"}; },
  /* ---- foto de perfil (privada) ---- */
  async foto(src, origen="Ajustes"){ if(!/^data:image\//.test(src||"")) throw new Error("Esa imagen no es válida."); await Store.set("media", "foto", {src, origen, ts:Date.now()}); return {ok:true, resumen:"Foto guardada"}; },
  async quitarFoto(){ await Store.del("media", "foto"); return {ok:true, resumen:"Foto quitada"}; }
};
function buscarHabito(nombre){ const n=norm(nombre); if(!n) return null; return S.habitos.find(x=>norm(x.nombre)===n) || S.habitos.find(x=>norm(x.nombre).includes(n) || n.includes(norm(x.nombre))) || S.habitos.find(x=>simil(x.nombre, nombre)>=0.5) || null; }
function racha(h){ let n=0, d=new Date(); if(!h?.registros?.[ymd(d)]) d=addDays(d,-1); while(h?.registros?.[ymd(d)]){ n++; d=addDays(d,-1); } return n; }
function iconoHabito(n){ const t=norm(n); return /agua/.test(t)?"drop":/lee|libro|lectura/.test(t)?"book":/ejerc|correr|gym|camin|yoga|deporte/.test(t)?"run":/medit|respir/.test(t)?"lotus":/dorm|sueno/.test(t)?"moon":/estudi|tesis/.test(t)?"cap":/ahorr|dinero/.test(t)?"coin":/orar|rezar|biblia/.test(t)?"spark":"leaf"; }

/* ---------------- Dinero: interpretar montos, categorías y métodos ---------------- */
const NUMW = {cero:0,un:1,uno:1,una:1,dos:2,tres:3,cuatro:4,cinco:5,seis:6,siete:7,ocho:8,nueve:9,diez:10,once:11,doce:12,trece:13,catorce:14,quince:15,
  dieciseis:16,diecisiete:17,dieciocho:18,diecinueve:19,veinte:20,veintiun:21,veintiuno:21,veintiuna:21,veintidos:22,veintitres:23,veinticuatro:24,veinticinco:25,
  veintiseis:26,veintisiete:27,veintiocho:28,veintinueve:29,treinta:30,cuarenta:40,cincuenta:50,sesenta:60,setenta:70,ochenta:80,noventa:90,
  cien:100,ciento:100,doscientos:200,doscientas:200,trescientos:300,trescientas:300,cuatrocientos:400,cuatrocientas:400,quinientos:500,quinientas:500,seiscientos:600,setecientos:700,ochocientos:800,novecientos:900};
function wordsNumber(tokens, i){
  let total=0, cur=0, used=0, j=i;
  while(j<tokens.length){ const w=tokens[j];
    if(w in NUMW){ cur += NUMW[w]; used++; j++; continue; }
    if(w==="mil"){ cur=(cur||1)*1000; total+=cur; cur=0; used++; j++; continue; }
    if(w==="y" && used && j+1<tokens.length && tokens[j+1] in NUMW){ j++; continue; }
    break; }
  return used ? {value: total+cur, next:j} : null;
}
function parseMonto(text, {suelto=true}={}){
  const t = norm(text).replace(/s\/\.?/g," s/ ");
  let m = t.match(/s\/\s*(\d+(?:[.,]\d{1,2})?)/) || t.match(/(\d+(?:[.,]\d{1,2})?)\s*(?:soles?|lucas?|so\b|pen\b|mangos?)/);
  if(m){ let v=parseFloat(m[1].replace(",",".")); const after=t.slice(t.indexOf(m[0])+m[0].length); const c=after.match(/^\s*(?:con\s+)?(\d{1,2})\s*(?:centimos|cent)/)||after.match(/^\s*con\s+(\d{1,2})\b/); if(c) v+=Number(c[1])/100; return round2(v); }
  const tokens = t.replace(/[^a-z0-9ñ\s]/g," ").split(/\s+/).filter(Boolean);
  for(let i=0;i<tokens.length;i++){
    const r = wordsNumber(tokens,i); if(!r) continue;
    let v=r.value, j=r.next; const isMoney=/^(soles?|lucas?|mangos?)$/.test(tokens[j]||""); if(isMoney) j++;
    if(tokens[j]==="con"){ const d=wordsNumber(tokens,j+1)||(/^\d+$/.test(tokens[j+1]||"")?{value:Number(tokens[j+1])}:null); if(d && d.value<100) v+=d.value/100; }
    if(tokens[j]==="y" && tokens[j+1]==="medio") v+=0.5;
    if(isMoney) return round2(v); i=r.next-1;
  }
  if(!suelto) return null;
  m = t.match(/(?:^|[^\d:])(\d+(?:[.,]\d{1,2})?)(?![\d:])(?!\s*(?:am|pm|de la|hrs?|horas?|minutos?|dias?|semanas?|de (?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)))/);
  return m ? round2(parseFloat(m[1].replace(",","."))) : null;
}
const CAT_KW = [
  ["Pasajes", /pasaje|taxi|combi|micro\b|colectivo|movilidad|bus\b|uber|moto(taxi)?|indrive|cabify|didi|gasolina/],
  ["Comida", /almuerzo|menu|desayuno|cena|comida|jugo|cafe|latte|helado|cachito|empanada|galleta|snack|chicha|yogurt|sandwich|pan\b|pollo|salchipapa|gaseosa|agua mineral|fruta|lonche|golosina|chocolate|papa rellena|chifa|ceviche|tentacion|pizza|hamburguesa|picarones|torta|queque|postre|lucuma|mazamorra|anticucho/],
  ["Apoyo al hogar", /leche|internet|luz\b|agua\b|mercado|viveres|gas\b|abarrotes|arroz|azucar|aceite|limpieza|detergente|cable|alquiler|hogar|casa/],
  ["Mascotas", /gato|perro|mascota|higado|veterinari|arena|croqueta|nutrimisi|misi/],
  ["Deudas", /deuda|prestamo|le debia|pague a|cuota|tarjeta de credito/],
  ["Cuidado personal", /shampoo|champu|acondicionador|desodorante|crema|mechas|peluqueria|corte de pelo|maquillaje|perfume|jabon|cepillo|toalla|unas|skincare|bloqueador/],
  ["Recargas", /recarga|saldo|megas|plan (de )?celular|claro|movistar|entel|bitel/],
  ["Estudios", /copias|impresion|imprimir|libro|curso|matricula|util(es)?|cuaderno|lapicero|tesis|anillado|empastado|fotocopia|separata|pension|universidad/],
  ["Salud", /farmacia|pastilla|medicina|consulta|doctor|dentista|analisis|vitamina|inkafarma|mifarma/],
  ["Ocio", /cine|salida|regalo|juego|concierto|netflix|spotify|fiesta|cumple|discoteca|youtube|disney|entrada/],
  ["Inversión", /inversion|hapi|acciones|bolsa|cripto|solana|etf|voo|ahorro|plazo fijo/]
];
function inferCat(text){ const t=norm(text); for(const [c,re] of CAT_KW) if(re.test(t)) return S.profile.categorias.includes(c)?c:c; return null; }
function inferMetodo(text){ const t=norm(text);
  if(/yape|yapee|yapeo|yapear/.test(t)) return "Yape"; if(/plin/.test(t)) return "Plin"; if(/tarjeta|scotia|debito|credito/.test(t)) return "Tarjeta Scotiabank";
  if(/efectivo|cash|sencillo/.test(t)) return "Efectivo"; if(/transferencia|transferi/.test(t)) return "Transferencia"; return null; }
function matchCat(name){ if(!name) return null; const n=norm(name); return S.profile.categorias.find(c=>norm(c)===n) || S.profile.categorias.find(c=>norm(c).startsWith(n)||n.startsWith(norm(c))) || inferCat(name) || null; }
function totalesMes(mes){ const ms=S.movimientos.filter(m=>m.fecha?.startsWith(mes) && m.estado==="registrado"); const g=sum(ms.filter(m=>m.tipo==="gasto"),m=>m.monto), i=sum(ms.filter(m=>m.tipo==="ingreso"),m=>m.monto); return {g:round2(g), i:round2(i), bal:round2(i-g), ms}; }
