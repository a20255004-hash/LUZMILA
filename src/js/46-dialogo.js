/* =========================================================
   Diálogo: ejecuta lo que Mila entendió y responde con calidez
   ========================================================= */
const EMOS = [["alegre","Alegre","#F5B53F"],["gracioso","Gracioso","#FF8E4F"],["logro","Logro","#22B07D"],["gratitud","Gratitud","#F06C9B"],["aprendizaje","Aprendizaje","#3A8DDE"],["triste","Triste","#7C8DB5"],["dificil","Difícil","#8E6CFF"]];
const emoLabel = k => (EMOS.find(e=>e[0]===k)||[k,"Recuerdo"])[1];
const emoColor = k => (EMOS.find(e=>e[0]===k)||[0,0,"#A88BFF"])[2];
const MOODS = [{k:"genial",l:"Radiante",c:"#F5B53F",v:5},{k:"bien",l:"Bien",c:"#22B07D",v:4},{k:"normal",l:"Normal",c:"#7FA3E8",v:3},{k:"cansada",l:"Cansada",c:"#A994E0",v:2},{k:"estresada",l:"Estresada",c:"#FF8E6E",v:2},{k:"triste",l:"Triste",c:"#7C8DB5",v:1}];
const moodDe = k => MOODS.find(m=>m.k===k) || MOODS[2];
const MOOD_MAP = {feliz:"genial",contenta:"genial",genial:"genial",emocionada:"genial",orgullosa:"genial",motivada:"genial",bien:"bien",tranquila:"bien",normal:"normal",regular:"normal","mas o menos":"normal",
  cansada:"cansada",agotada:"cansada","con sueno":"cansada","con flojera":"cansada","sin ganas":"cansada",enferma:"cansada",estresada:"estresada",ansiosa:"estresada",abrumada:"estresada",nerviosa:"estresada",preocupada:"estresada",harta:"estresada",enojada:"estresada",frustrada:"estresada",
  triste:"triste",mal:"triste",sola:"triste",desanimada:"triste",aburrida:"normal",fatal:"triste"};

function recMeta(raw){
  const t=norm(raw); let emocion="alegre";
  if(/(jaja|risa|gracios|chistos|me rei|nos reimos|roche|vergonz|palta)/.test(t)) emocion="gracioso";
  else if(/(logre|aprobe|gane|consegui|me aceptaron|orgullos|termine|ingrese|me eligieron|primer puesto|sustente|mejorando|avance|lo hice|logro)/.test(t)) emocion="logro";
  else if(/(triste|llore|extran|perdi|murio|falleci|me duele|dolio|me senti sola|pena)/.test(t)) emocion="triste";
  else if(/(aprendi|leccion|me di cuenta|entendi que)/.test(t)) emocion="aprendizaje";
  else if(/(gracias|agradec|bendec|afortunada)/.test(t)) emocion="gratitud";
  else if(/(miedo|ansiedad|estres|discusion|pelea|me enoje|frustr|hasta las \d+ ?am|desvelada|no dormi)/.test(t)) emocion= /(mejorando|avance|logr)/.test(t)?"logro":"dificil";
  const f=parseFecha(raw); const limpio = raw.trim().replace(/^(que\s+)/i,"");
  const w=limpio.split(/\s+/); const titulo = capital(w.slice(0,7).join(" ").replace(/[,.;:]+$/,""))+(w.length>7?"…":"");
  const personas = [...raw.matchAll(/\bcon\s+(mi\s+)?([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+|mam[aá]|pap[aá]|herman[oa]|amig[oa]s?|novio|abuel[oa])/g)].map(m=>m[2]).slice(0,5);
  const etiquetas = palabras(raw).filter(x=>x.length>4).slice(0,4);
  return {titulo, fecha:f?.single?f.desde:"", emocion, personas, etiquetas};
}
const REC_REPLY = { gracioso:"Jaja, ¡qué buena! Ya la guardé para cuando necesites reírte.", logro:"¡Qué orgullo! Lo guardé entre tus logros.", alegre:"Qué bonito momento. Ya quedó guardado en tu diario.",
  gratitud:"Qué lindo que lo valores. Lo guardé.", aprendizaje:"Lo guardé. Es valioso lo que te llevaste de eso.", triste:"Gracias por contármelo. Lo guardé con cuidado; aquí estoy si quieres hablar.", dificil:"Gracias por confiármelo. Ya está guardado; lo atravesaste y eso cuenta." };

/* ---------- contexto: "bórralo" se refiere a lo último ---------- */
const COL2TIPO = {movimientos:"mov", tareas:"tarea", eventos:"evento", memorias:"mem", recuerdos:"rec", notas:"nota", habitos:"habito", metas:"meta"};
function ultimo(tipo){
  const l = S.ctx.last; if(l && (!tipo || l.tipo===tipo || l.type===tipo || (tipo==="gasto"||tipo==="ingreso") && l.type==="mov")) return l.type ? l : null;
  const logs = [...S.registro].filter(x=>x.estado!=="deshecho" && x.deshacer?.op==="del" && COL2TIPO[x.deshacer.col]).sort((a,b)=>b.ts-a.ts);
  for(const x of logs){ const ty=COL2TIPO[x.deshacer.col]; if(tipo && !(ty===tipo || (ty==="mov" && (tipo==="gasto"||tipo==="ingreso"||tipo==="mov")))) continue; if(existe(ty, x.deshacer.id)) return {type:ty, id:x.deshacer.id}; }
  if(S.ctx.last?.type==="evento" && (!tipo||tipo==="evento")) return S.ctx.last;
  return null;
}
function existe(type, id){ const col={mov:"movimientos",tarea:"tareas",evento:"eventos",mem:"memorias",rec:"recuerdos",nota:"notas",habito:"habitos",meta:"metas"}[type]; return type==="evento" ? !!buscarEvento(id) : !!S[col]?.some(x=>x.id===id); }
function guardarCtx(){ try{ sessionStorage.setItem("mila-ctx", JSON.stringify({last:S.ctx.last, lastFree:S.ctx.lastFree})); }catch{} }
try{ const c=JSON.parse(sessionStorage.getItem("mila-ctx")||"{}"); if(c.last) S.ctx.last=c.last; if(c.lastFree) S.ctx.lastFree=c.lastFree; }catch{}

/* ---------- extraer concepto / fuente de un gasto o ingreso ---------- */
function extraerConcepto(raw, tipo){
  let t = " "+norm(raw).replace(/[¿?¡!;:]/g," ")+" ";
  let fuente = "";
  const mf = t.match(/\b(?:de parte de|departe de|parte de|de parte del|enviado por|que me dio|que me dieron|que me mando|de mi|del)\s+([a-zñ][a-zñ ]{1,40}?)(?=\s+(?:por|en|con|para|hoy|ayer|el|la|a las?)\b|\s*$)/);
  if(mf) fuente = capital(mf[1].trim());
  t = t.replace(/\b(con|por|via|en|desde mi|de mi)\s+(yape|plin|efectivo|tarjeta( scotiabank| de credito| de debito| scotia)?|transferencia|scotia)\b/g," ")
       .replace(/\b(hoy|ayer|ahorita|recien|antes|anteayer|pasado manana|manana)\b/g," ");
  const nw = [...Object.keys(NUMW),"mil","y","medio"].join("|");
  t = t.replace(new RegExp(`\\b(?:(?:${nw})\\s+)+(?:soles?|lucas?)(?:\\s+con\\s+(?:(?:${nw})\\s*)+(?:centimos)?)?`,"g")," MONTO ")
       .replace(/(?:s\/\.?\s*)?\d+(?:[.,]\d+)?\s*(?:soles?|lucas?|mangos?)?(?:\s+con\s+\d+\s*(?:centimos)?)?/g," MONTO ");
  t = t.replace(/^\s*(agrega|anade|añade|registra|anota|apunta|pon|suma|mete|ingresa|crea)\w*\s+(un|una|el|mi)?\s*(gasto|ingreso|egreso|pago|compra)\s*(de)?\s*/," ");
  const art = "(?:(?:un|una|el|la|los|las|mi|mis|unos|unas|del|al)\\s+)?";
  let m = t.match(new RegExp(`\\b(?:en|por|para|de)\\s+${art}([a-zñ][a-zñ ]*?)\\s*(?:MONTO|$)`))
       || t.match(new RegExp(`\\b(?:gaste|pague|compre|me costo|me salio|me cobraron)\\s+${art}([a-zñ][a-zñ ]*?)\\s+(?:a|en|por|de)?\\s*MONTO`))
       || t.match(new RegExp(`MONTO\\s+(?:en|por|para|de)\\s+${art}([a-zñ][a-zñ ]*)`))
       || t.match(new RegExp(`\\b(?:compre|pague)\\s+${art}([a-zñ][a-zñ ]*)`));
  let c = m ? m[1].trim() : "";
  c = c.replace(/\b(soles?|lucas?|parte de .*|de parte de .*)\b/g,"").replace(/\b(gaste|pague|compre|me|costo|salio|que|y)\b/g," ").replace(/\s+/g," ").trim();
  if(tipo==="ingreso" && fuente && (!c || norm(fuente).includes(c) || c.includes(norm(fuente)))) c = "";
  if(!c || /^(algo|cosas?|compras?|una compra|varios|varias cosas|gasto|ingreso|pago)$/.test(c)) c = "";
  if(tipo==="ingreso" && !fuente && c){ fuente = capital(recuperar(raw, c)); c = ""; }
  return {concepto: capital(recuperar(raw, c)), fuente: fuente ? capital(recuperar(raw, norm(fuente))) : ""};
}

/* =========================================================
   Respuesta principal
   ========================================================= */
async function responder(raw){
  const pen = S.ctx.pending;
  if(pen){ const r = await resolverPendiente(pen, raw); if(r) { guardarCtx(); return r; } }
  const it = entender(raw);
  let r;
  try{ r = await ejecutar(it); }
  catch(e){ r = R(`No pude hacerlo: ${errMsg(e)}`, {emo:"preocupada"}); }
  if(!r || r.noEntendi){ r = await respuestaLibre(it, r); }
  if(["libre"].includes(it.intent) && !it.q) S.ctx.lastFree = raw;
  guardarCtx();
  if(r?.t) r.t = horas12(r.t);
  return r;
}
// "a las 16:00" → "a las 4 p. m." (más natural al oído)
function horas12(s){ return String(s).replace(/\b(a las|las|desde las|hasta las|a la)\s+(\d{2}):(\d{2})\b/g, (m,pre,h,mi)=>{ h=+h; const suf = h<12 ? "a. m." : "p. m."; const hh = ((h+11)%12)+1; return `${hh===1&&pre==="a las"?"a la":pre==="a la"&&hh!==1?"a las":pre} ${hh}${mi!=="00"?":"+mi:""} ${suf}`; }); }
// recupera tildes y mayúsculas del texto original para una frase normalizada
function recuperar(raw, frase){
  if(!frase) return frase; const ws = String(raw).split(/\s+/); const nw = ws.map(w=>norm(w).replace(/[^a-z0-9ñ]/g,"")); const tk = norm(frase).split(/\s+/).filter(Boolean);
  for(let i=0;i+tk.length<=nw.length;i++){ if(tk.every((x,j)=>nw[i+j]===x)) return ws.slice(i,i+tk.length).join(" ").replace(/^[¿¡"«(]+|[?!.,;:»")]+$/g,""); }
  return frase;
}
const SI = /^(si|sip|si por favor|claro|dale|ok|okey|ya|confirmo|hazlo|de una|por supuesto|obvio|correcto|exacto|eso|asi es|afirmativo|bueno|listo|guardalo|guardala|agendalo|si agendalo|si, agendalo|me parece bien|perfecto|va)\b/;
const NO = /^(no|nop|cancela|mejor no|olvidalo|dejalo|ninguno|ninguna|nada|nel|no gracias)\b/;
async function resolverPendiente(p, raw){
  const t = limpia(raw);
  if(/^#cancelar/.test(t) || (NO.test(t) && p.kind!=="monto")){ S.ctx.pending=null; return R(pick(["Ok, lo dejamos así.","Entendido, no hago nada.","Tranqui, cancelado."])); }
  switch(p.kind){
    case "elegir": {
      let idx = -1; const mn = t.match(/#elegir (\d+)/); if(mn) idx=+mn[1]-1;
      else if(/^(el |la )?(primer[oa]?|1|uno)\b/.test(t)) idx=0; else if(/^(el |la )?(segund[oa]|2|dos)\b/.test(t)) idx=1; else if(/^(el |la )?(tercer[oa]?|3|tres)\b/.test(t)) idx=2; else if(/^(el |la )?(ultim[oa])\b/.test(t)) idx=p.ids.length-1;
      else { const monto=parseMonto(t,{suelto:true}); const cands = p.ids.map((id,i)=>{ const o = p.tipo==="mov"?S.movimientos.find(x=>x.id===id):p.tipo==="tarea"?S.tareas.find(x=>x.id===id):p.tipo==="evento"?buscarEvento(id):null; if(!o) return [i,0]; const lbl = p.tipo==="mov"?etqMov(o):p.tipo==="tarea"?etqTarea(o):etqEv(o); return [i, puntuar(lbl, t) + (monto && o.monto===monto ? 2 : 0)]; }).sort((a,b)=>b[1]-a[1]); if(cands[0] && cands[0][1]>=0.6) idx=cands[0][0]; }
      if(idx<0 || idx>=p.ids.length) { S.ctx.pending=null; return null; }
      S.ctx.pending=null; return ejecutarSobre(p.accion, p.tipo, p.ids[idx], p.extra||{});
    }
    case "monto": {
      const v = parseMonto(t, {suelto:true}); if(!v){ S.ctx.pending=null; return null; }
      S.ctx.pending=null; return registrarMov({...p.data, monto:v});
    }
    case "hora": {
      let hora = parseHora(t) || (/^\d{1,2}$/.test(t) ? pad((+t>=1&&+t<=6)?+t+12:+t)+":00" : null);
      if(/todo el dia|todo el día|sin hora|dia completo/.test(t)){ S.ctx.pending=null; return crearEvento({...p.data, allDay:true}); }
      if(!hora){ S.ctx.pending=null; return null; }
      S.ctx.pending=null; return crearEvento({...p.data, hora});
    }
    case "fechaTarea": {
      const f = parseFecha(t) || (/sin fecha|ninguna|no tiene/.test(t)?{desde:""}:null); if(!f){ S.ctx.pending=null; return null; }
      S.ctx.pending=null; const hora=parseHora(t); const r = await A.editarTarea(p.id, {vence:f.desde||"", ...(hora?{hora}:{})});
      return R(f.desde ? `${pick(["Perfecto","Listo","Hecho"])}, la dejo para ${relDia(f.desde)}${hora?" a las "+hora:""}.` : "Ok, la dejo sin fecha.", {emo:"alegre", cards:[{k:"tarea", id:p.id, log:r.log}]});
    }
    case "confirmarDato": {
      if(SI.test(t)){ S.ctx.pending=null; const r=await A.recordar({texto:p.texto, tipo:"preferencia"}); return R(`¡Anotado! Ya sé que ${p.texto.replace(/^Me /,"te ").replace(/^No me /,"no te ").toLowerCase()}.`, {emo:"alegre", cards:[{k:"mem", id:r.id, log:r.log}]}); }
      if(/^no\b/.test(t)){ S.ctx.pending=null; const neg = p.texto.startsWith("Me ") ? "No me "+p.texto.slice(3) : p.texto; const r=await A.recordar({texto:neg, tipo:"preferencia"}); return R(`Entendido, lo anoto así: ${neg.toLowerCase()}.`, {cards:[{k:"mem", id:r.id, log:r.log}]}); }
      S.ctx.pending=null; return null;
    }
    case "ofrecerRecuerdo": {
      if(SI.test(t)){ S.ctx.pending=null; return guardarRecuerdo(p.texto); }
      S.ctx.pending=null; return null;
    }
    case "recuerdo": {
      S.ctx.pending=null; if(t.length<3) return R("Ok, cuando quieras me lo cuentas.");
      return guardarRecuerdo(raw);
    }
    case "planConfirm": {
      if(SI.test(t)){ S.ctx.pending=null; for(const b of p.bloques) await A.editarTarea(b.id, {vence:b.fecha, hora:b.hora, dur:b.dur}); Mila.celebrar();
        return R(`¡Agendado! Tu plan ya está en la agenda. Empieza con «${p.bloques[0].titulo}» a las ${p.bloques[0].hora}. Yo te acompaño.`, {emo:"animada", cards:[{k:"agenda", desde:p.bloques[0].fecha, hasta:p.bloques[0].fecha}]}); }
      S.ctx.pending=null; return null;
    }
    case "masivo": {
      if(SI.test(t)){ S.ctx.pending=null; let n=0; for(const id of p.ids){ try{ await ejecutarSobre("borrar", p.tipo, id, {silencio:true}); n++; }catch{} } return R(`Listo, borré ${n}. Si fue un error, di «deshaz» varias veces para recuperarlos.`); }
      S.ctx.pending=null; return null;
    }
    case "nombreHabito": { S.ctx.pending=null; const r=await A.nuevoHabito({nombre:raw}); return R(r.dup?r.resumen:`¡Hecho! Nuevo hábito: «${capital(raw)}». Márcalo cada día y verás crecer tu racha.`, {emo:"animada", cards:[{k:"habito", id:r.id}]}); }
    case "coachObstaculo": { S.ctx.pending=null; return Coach.motivo(p.id, "obstaculo", capital(raw)); }
    case "cicloDolor": { S.ctx.pending=null; const n=(t.match(/\b(10|[0-9])\b/)||[])[1]; const dia=S.ciclodia.find(x=>x.id===todayStr());
      const sint=[...new Set([...(dia?.sintomas||[]), "Cólicos"])]; await A.cicloDia(todayStr(), {sintomas:sint, ...(n?{dolor:Number(n)}:{})});
      return R(n&&Number(n)>=7 ? `Anotado: dolor ${n}/10. Es bastante. Si quieres, activo el modo descanso y no te insisto hoy. Y si el dolor es muy fuerte o distinto a lo habitual, consulta con un profesional de salud.` : `Anotado${n?` (${n}/10)`:""}. Cuídate; una bolsa de agua tibia y algo calentito suelen ayudar. 💜`, {emo:"empatica", privado:true, chips: n&&Number(n)>=7?[{l:"Activa el descanso",say:"necesito descansar hoy"}]:[]}); }
    case "nombreMeta": { S.ctx.pending=null; const r=await A.meta({titulo:raw}); return R(`Meta creada: «${capital(raw)}». ¿Cuál sería el primer paso pequeño? Dímelo y lo pongo como próxima acción.`, {emo:"animada", cards:[{k:"meta", id:r.id}]}); }
  }
  S.ctx.pending=null; return null;
}

async function ejecutar(it){
  const {intent, t, raw} = it;
  switch(intent){
    case "vacio": return R("Te escucho.");
    case "elegir": case "cancelar": return R("Ya no tengo nada pendiente que elegir. ¿Qué necesitas?");
    case "deshacer": { const r = await undo(); return R(r.ok ? `${r.resumen}.` : r.resumen, {emo: r.ok?"alegre":"pensativa"}); }
    case "coach": {
      const id=it.id; const tt=S.tareas.find(x=>x.id===id); if(!tt) return R("Esa tarea ya no está pendiente.");
      if(it.acc==="hecho"){ const r=await Coach.hecho(id); return R(r.resumen, {emo:"animada"}); }
      if(it.acc==="posponer60"||it.acc==="posponer15"){ const r=await Coach.posponer(id, it.acc==="posponer15"?15:60); return R(r.resumen, {emo:r.preguntar?"pensativa":"alegre", chips:r.preguntar?coachChipsMotivo(id):[]}); }
      if(it.acc==="manana"){ const r=await Coach.posponer(id, "manana"); return R(r.resumen, {emo:"alegre", chips:r.preguntar?coachChipsMotivo(id):[]}); }
      if(it.acc==="ayuda") return R(`Cuéntame qué pasa con «${tt.titulo}» y lo resolvemos juntas:`, {emo:"escuchando", chips:coachChipsMotivo(id)});
      if(it.acc==="procrastinacion"||it.acc==="sobrecarga") return Coach.motivo(id, it.acc);
      if(it.acc==="obstaculo"){ S.ctx.pending={kind:"coachObstaculo", id}; return R("¿Qué te lo está impidiendo? Cuéntamelo en una frase.", {emo:"escuchando"}); }
      if(it.acc==="dividir") return Coach.dividir(id);
      return R("Entendido.");
    }
    case "cicloInicio": { const f=parseFecha(t); const fecha=f?.desde && f.desde<=todayStr() ? f.desde : todayStr(); const r=await A.periodoInicio(fecha);
      return R(r.dup ? r.resumen : `Anotado con discreción en Mi ciclo: empezó ${relDia(fecha)}. ¿Cómo te sientes? Si hay dolor, dime del 0 al 10.`, {emo:"carinosa", privado:true, chips:[{l:"Tengo cólicos",say:"tengo cólicos"},{l:"Estoy bien",say:"gracias"},{l:"Ver Mi ciclo",say:"abre mi ciclo"}]}); }
    case "cicloFin": { const f=parseFecha(t); const fecha=f?.desde && f.desde<=todayStr() ? f.desde : todayStr(); const r=await A.periodoFin(fecha); return R(r.resumen+(r.ok?".":""), {emo:"alegre", privado:true}); }
    case "cicloSintoma": { S.ctx.pending={kind:"cicloDolor"}; return R("Lo siento, los cólicos son molestos. ¿Del 0 al 10, cuánto te duele? Lo anoto en Mi ciclo.", {emo:"empatica", privado:true}); }
    case "cicloConsulta": { const st=cicloStats(); if(!st.prox) return R(`Todavía no puedo estimarlo: necesito al menos 3 periodos registrados y llevas ${st.ps.length}. Cada vez que te venga, dímelo y lo anoto.`, {emo:"pensativa", privado:true});
      return R(`Según tus registros, podría llegar ${relDia(st.prox.ini)}, más o menos entre el ${st.prox.desde.getDate()} y el ${st.prox.hasta.getDate()} de ${MESES[st.prox.hasta.getMonth()]}. Es solo una estimación (confianza ${st.prox.confianza}); el estrés o el sueño pueden moverla.`, {emo:"alegre", privado:true}); }
    case "descanso": { await A.descanso(null, /enferm|dolor|regla|colico/.test(t)?"cuidarme":""); Mila.set("idle","carinosa");
      return R(`Hecho. Activé el modo descanso hasta mañana temprano: no te voy a insistir con pendientes. Descansar también es parte del plan, ${N()}. 💜`, {emo:"carinosa"}); }
    case "finDescanso": { await A.finDescanso(); return R("¡Bienvenida de vuelta! Retomo los recordatorios con calma.", {emo:"alegre"}); }
    case "estricto": { await Store.saveProfile({ajustes:{coach:{...Coach.cfg(), estricto:!!it.on}}});
      return it.on ? R(`Modo entrenadora estricta: ACTIVADO 😤. Desde ahora seré directa: si algo se pospone, te lo voy a reclamar (con cariño). Si un día necesitas tregua, dime «necesito descansar».`, {emo:"enojada"}) : R("Listo, vuelvo a mi modo amable. Igual te seguiré recordando las cosas, pero con más suavidad. 🐼", {emo:"carinosa"}); }
    case "frase": { const f=fraseDelDia(Math.floor(Math.random()*50)+1); return R(`«${f.texto}»${f.autor&&f.autor!=="Mila"?" — "+f.autor:""}`, {emo:"carinosa", chips:[{l:"Otra",say:"dame una frase"},{l:"Ver frases",say:"abre mis frases"}]}); }
    case "fraseGuardar": { const txt=(it.texto||"").trim(); if(!txt || norm(txt).length<4) return R("¿Qué frase quieres guardar? Dímela después de «guarda la frase».");
      const r=await A.frase({texto:txt, cat:"Mías"}); return R(r.dup?r.resumen:`¡Me encanta! Guardé tu frase en Frases → Mías.`, {emo:"carinosa"}); }
    case "navegar": go(it.ruta); return R(pick([`Te llevo a ${NOMBRES_RUTA[it.ruta]}.`,`Abriendo ${NOMBRES_RUTA[it.ruta]}.`]));
    case "recuerdo": {
      let c = it.contenido;
      if(!c && S.ctx.lastFree && Date.now() - (S.ctx.lastFreeTs||Date.now()) < 3600000) c = S.ctx.lastFree;
      if(!c){ S.ctx.pending = {kind:"recuerdo"}; return R("Claro. Cuéntamelo con tus palabras y lo guardo en tu diario.", {emo:"escuchando"}); }
      return guardarRecuerdo(c);
    }
    case "movimiento": {
      const monto = parseMonto(raw, {suelto:true}); const f=parseFecha(raw); const metodo=inferMetodo(raw); const {concepto, fuente} = extraerConcepto(raw, it.tipo);
      const data = {tipo:it.tipo, concepto, fuente, metodo, fecha:f?.single?f.desde:undefined, categoria: it.tipo==="gasto" ? (matchCatEnTexto(raw) || inferCat(concepto) || inferCat(raw)) : ""};
      if(!monto){ S.ctx.pending = {kind:"monto", data}; return R(`¿De cuánto fue ${it.tipo==="gasto"?"el gasto":"el ingreso"}${concepto?` de ${concepto.toLowerCase()}`:""}?`, {emo:"pensativa"}); }
      return registrarMov({...data, monto});
    }
    case "borrar": return borrarDesdeTexto(it);
    case "borrarMasivo": {
      const tipo = it.tipo; const f = parseFecha(t);
      let items = tipo==="gasto"||tipo==="ingreso"||tipo==="mov" ? S.movimientos.filter(m=>(tipo==="mov"||m.tipo===tipo) && (!f || (m.fecha>=f.desde && m.fecha<=f.hasta))) : tipo==="tarea" ? S.tareas.filter(x=>/hecha|completad|terminad/.test(t) ? x.estado==="hecha" : true) : [];
      if(!items.length) return R("No encontré nada que coincida para borrar.");
      S.ctx.pending = {kind:"masivo", tipo: tipo==="gasto"||tipo==="ingreso"?"mov":tipo, ids:items.map(x=>x.id)};
      return R(`Eso borraría ${plural(items.length, "elemento", "elementos")}. ¿Segura? Responde «sí» para confirmar.`, {emo:"preocupada", chips:[{l:"Sí, bórralos", say:"sí"},{l:"No", say:"#cancelar"}]});
    }
    case "editar": return editarDesdeTexto(it);
    case "mover": return moverDesdeTexto(it);
    case "hecho": return marcarHecho(it);
    case "agendaConsulta": {
      if(/\b(proximo|siguiente|que sigue)\b/.test(t)){ const hoy=new Date(); try{ if(Cal.ok()) await Cal.cargar(ymd(hoy), ymd(addDays(hoy,14))); }catch{}
        const ev = eventosEntre(ymd(hoy), ymd(addDays(hoy,14))).filter(e=>e.ini>hoy && !e.alerta)[0];
        return ev ? R(`Lo siguiente es «${ev.titulo}», ${relDia(ev.ini)}${ev.allDay?"":" a las "+hhmm(ev.ini)} (${cuentaAtras(ev.ini)}).`, {cards:[{k:"evento", id:ev.id}]}) : R("No veo nada agendado en las próximas dos semanas."); }
      const f = parseFecha(t) || {desde:todayStr(), hasta:todayStr(), single:true};
      if(/\b(libre|ocupada)\b/.test(t)){ const h=parseHora(t); if(h){ const ini=new Date(`${f.desde}T${h}:00`); const evs=eventosEntre(f.desde,f.desde).filter(e=>!e.allDay && e.ini<addMin(ini,60) && e.fin>ini); return R(evs.length?`A esa hora tienes «${evs[0].titulo}» (${hhmm(evs[0].ini)}–${hhmm(evs[0].fin)}).`:`Sí, ${relDia(f.desde)} a las ${h} estás libre.`); } }
      try{ if(Cal.ok()) await Cal.cargar(f.desde, f.hasta); }catch{}
      const saludo = /^(hola|buenas|buenos)/.test(t) ? saludoHora()+", "+N()+". " : "";
      return R(saludo + describirAgenda(f), {cards:[{k:"agenda", desde:f.desde, hasta:f.hasta}], emo:"alegre"});
    }
    case "tareasConsulta": {
      const pend = priorizar(S.tareas.filter(x=>x.estado!=="hecha")); if(!pend.length) return R("¡No tienes pendientes! Disfruta o dime qué quieres lograr hoy.", {emo:"animada"});
      const hoy=todayStr(); const venc = pend.filter(x=>x.vence && x.vence<hoy).length, deHoy = pend.filter(x=>x.vence===hoy).length;
      return R(`Tienes ${plural(pend.length,"pendiente","pendientes")}${deHoy?`, ${deHoy} para hoy`:""}${venc?` y ${venc} atrasado${venc>1?"s":""}`:""}. Lo primero: «${pend[0].titulo}».`, {cards:[{k:"tareas", ids:pend.slice(0,6).map(x=>x.id)}], chips: venc?[{l:"Pasar atrasadas a hoy", say:"pasa mis tareas vencidas para hoy"}]:[{l:"Organiza mi día", say:"organiza mi día"}]});
    }
    case "dineroConsulta": return consultaDinero(it);
    case "planificar": return planificar(it);
    case "reprogramarTareas": {
      const f = parseFecha(t.split(/\b(para|a|al)\b/).slice(-1)[0]) || parseFecha(t) || {desde:ymd(addDays(new Date(),1))};
      const hoy=todayStr(); const items = S.tareas.filter(x=>x.estado!=="hecha" && x.vence && (/(de hoy)/.test(t) ? x.vence===hoy : x.vence<hoy || (/pendientes/.test(t) && x.vence<=hoy)));
      if(!items.length) return R("No tienes tareas atrasadas. ¡Vas al día!", {emo:"animada"});
      for(const x of items) await A.editarTarea(x.id, {vence:f.desde});
      return R(`${ok()}: moví ${plural(items.length,"tarea","tareas")} para ${relDia(f.desde)}. Si fue mucho, di «deshaz».`, {emo:"alegre", cards:[{k:"tareas", ids:items.map(x=>x.id)}]});
    }
    case "recordatorio": {
      const texto = it.texto; const f=parseFecha(texto), hora=parseHora(texto); let titulo = capital(quitarFechaHora(texto)) || "Recordatorio";
      let fecha = f?.single ? f.desde : ""; if(hora && !fecha){ fecha=todayStr(); if(new Date(`${fecha}T${hora}:00`)<new Date()) fecha=ymd(addDays(new Date(),1)); }
      const r = await A.tarea({titulo, vence:fecha, hora:hora||"", prioridad:"alta", recordar:true});
      const cards=[{k:"tarea", id:r.id, log:r.log}]; let extra="";
      if(hora && Cal.ok()){ try{ const al = await A.alerta({titulo, cuando:`${fecha}T${hora}`, mensaje:`${N()}, te recuerdo: ${titulo}.`}); extra=" También sonará en tu celular."; }catch{} }
      else if(hora) extra = " Te avisaré aquí si tengo la app abierta.";
      if(!fecha){ S.ctx.pending={kind:"fechaTarea", id:r.id}; return R(`Anotado: «${titulo}». ¿Para cuándo te lo recuerdo?`, {cards, chips:[{l:"Hoy",say:"hoy"},{l:"Mañana",say:"mañana"},{l:"Esta semana",say:"el viernes"},{l:"Sin fecha",say:"sin fecha"}]}); }
      return R(`${ok()}, te lo recuerdo ${relDia(fecha)}${hora?" a las "+hora:""}: ${titulo}.${extra}`, {emo:"alegre", cards});
    }
    case "tarea": {
      const texto = it.texto; const f=parseFecha(texto), hora=parseHora(texto);
      let titulo = capital(quitarFechaHora(texto).replace(/^(una|un|la|el|que)\s+/i,"").replace(/\s*[#!](\w+)/g,"")) || "Tarea";
      const prioridad = /urgente|importante|prioridad alta|!alta|!!/.test(norm(texto)) ? "alta" : /prioridad baja|!baja|cuando pueda|algun dia/.test(norm(texto)) ? "baja" : "media";
      titulo = titulo.replace(/\b(urgente|importante|con prioridad (alta|baja|media)|cuando pueda)\b/gi,"").replace(/\s+/g," ").trim();
      const area = (texto.match(/#(\w+)/)||[])[1] || "";
      let fecha = f?.single ? f.desde : ""; if(hora && !fecha){ fecha=todayStr(); if(new Date(`${fecha}T${hora}:00`)<new Date()) fecha=ymd(addDays(new Date(),1)); }
      const r = await A.tarea({titulo, vence:fecha, hora:hora||"", prioridad, area});
      const cards=[{k:"tarea", id:r.id, log:r.log}];
      if(!fecha){ S.ctx.pending={kind:"fechaTarea", id:r.id}; return R(`${ok()}: «${titulo}» está en tus pendientes. ¿Le pongo fecha?`, {emo:"alegre", cards, chips:[{l:"Hoy",say:"hoy"},{l:"Mañana",say:"mañana"},{l:"Esta semana",say:"el viernes"},{l:"Sin fecha",say:"sin fecha"}]}); }
      return R(`${ok()}: «${titulo}» para ${relDia(fecha)}${hora?" a las "+hora:""}.`, {emo:"alegre", cards});
    }
    case "evento": {
      const texto = it.texto; const f=parseFecha(texto); const rg=parseRango(texto); const hora = rg?.ini || parseHora(texto);
      let titulo = capital(quitarFechaHora(texto).replace(/^(una|un|la|el|de|que)\s+/i,"").replace(/\s+(el|la|para|a)$/i,"")) || "Evento";
      const data = {titulo, fecha: f?.single ? f.desde : "", hora, fin: rg?.fin, dur: rg?.dur, allDay: /todo el dia/.test(norm(texto))};
      if(!data.hora && !data.allDay){ S.ctx.pending = {kind:"hora", data}; return R(`¿A qué hora es «${titulo}»${data.fecha?" "+relDia(data.fecha):""}?`, {emo:"pensativa", chips:[{l:"Todo el día",say:"todo el día"},{l:"9:00",say:"a las 9"},{l:"15:00",say:"a las 3 de la tarde"},{l:"19:00",say:"a las 7 de la noche"}]}); }
      return crearEvento(data);
    }
    case "habitoNuevo": {
      const nombre = raw.replace(/^[\s\S]*?\b(h[aá]bito de|h[aá]bito|empezar a|comenzar a|crear el h[aá]bito de)\b\s*/i,"").replace(/\b(todos los d[ií]as|diario|cada d[ií]a)\b/gi,"").trim();
      if(!nombre || norm(nombre)===limpia(raw)){ S.ctx.pending={kind:"nombreHabito"}; return R("¡Me encanta! ¿Cómo se llama el hábito? Por ejemplo: «Tomar 2 litros de agua».", {emo:"animada"}); }
      const r = await A.nuevoHabito({nombre}); return R(r.dup ? r.resumen : `¡Listo! Nuevo hábito: «${capital(nombre)}». Te lo mostraré cada día en Inicio.`, {emo:"animada", cards:[{k:"habito", id:r.id}]});
    }
    case "habitosConsulta": {
      if(!S.habitos.length) return R("Aún no tienes hábitos. Dime «nuevo hábito leer 10 minutos» y empezamos.", {emo:"pensativa"});
      const hoy=todayStr(); const hechos = S.habitos.filter(h=>h.registros?.[hoy]); const mejor = S.habitos.map(h=>[h,racha(h)]).sort((a,b)=>b[1]-a[1])[0];
      return R(`Hoy llevas ${hechos.length} de ${S.habitos.length} hábitos.${mejor && mejor[1]?` Tu mejor racha: «${mejor[0].nombre}» con ${plural(mejor[1],"día seguido","días seguidos")}.`:""}${hechos.length<S.habitos.length?` Te falta: ${S.habitos.filter(h=>!h.registros?.[hoy]).map(h=>h.nombre).join(", ")}.`:" ¡Todos cumplidos!"}`, {emo: hechos.length===S.habitos.length?"animada":"alegre", cards:[{k:"habitos"}]});
    }
    case "metaNueva": {
      const titulo = raw.replace(/^[\s\S]*?\b(nueva meta|mi meta es|quiero lograr|meta|mi objetivo es)\b[\s:,-]*(que\s+)?/i,"").trim();
      if(!titulo){ S.ctx.pending={kind:"nombreMeta"}; return R("¡Vamos! ¿Cuál es la meta?", {emo:"animada"}); }
      const r = await A.meta({titulo}); return R(`${r.resumen}. ¿Cuál es el primer paso pequeño?`, {emo:"animada", cards:[{k:"meta", id:r.id, log:r.log}]});
    }
    case "metasConsulta": {
      const act = S.metas.filter(g=>g.estado==="activa"); if(!act.length) return R("No tienes metas activas. Dime «nueva meta: terminar el capítulo 2» y la seguimos juntas.");
      return R(`Tienes ${plural(act.length,"meta activa","metas activas")}: ${act.map(g=>`${g.titulo} (${g.progreso||0}%)`).join(", ")}.`, {cards:act.map(g=>({k:"meta", id:g.id}))});
    }
    case "metaAvance": {
      const act = S.metas.filter(g=>g.estado==="activa"); const g = act.map(x=>[x, puntuar(x.titulo, t)]).sort((a,b)=>b[1]-a[1])[0]?.[0] || act[0];
      if(!g) return R("No tienes metas activas todavía.");
      const p = parseMonto(t,{suelto:true}); const r = await A.meta({id:g.id, avance:raw, ...(p && p<=100 && /%|por ciento|porciento/.test(t)?{progreso:p}:{})});
      return R(`¡Bien! Registré tu avance en «${g.titulo}».`, {emo:"animada", cards:[{k:"meta", id:g.id, log:r.log}]});
    }
    case "nota": { const r = await A.nota({texto:it.texto ? raw.slice(raw.length-it.texto.length) : raw, tipo:it.tipo}); return R(it.tipo==="idea"?pick(["¡Buena idea! Ya está en tus notas.","Guardada en tus ideas."]):"Nota guardada.", {emo:"alegre", cards:[{k:"nota", id:r.id, log:r.log}]}); }
    case "memoria": {
      let texto = capital(it.texto.replace(/[.\s]+$/,""));
      const tipo = /gusta|encanta|odio|prefiero|favorit/.test(norm(texto)) ? "preferencia" : /cumpleanos|mama|papa|herman|novio|amig/.test(norm(texto)) ? "persona" : "hecho";
      // "ya no me gusta X" → corrige lo anterior
      const r = await A.recordar({texto, tipo});
      return R(r.dup ? "Eso ya lo sabía 😊".replace(" 😊","") : pick([`Guardado: ${texto.toLowerCase()}. No se me olvida.`, `Lo guardo en mi memoria, ${N()}.`, `Anotado para siempre: ${texto.toLowerCase()}.`]), {emo:"alegre", cards: r.dup?[]:[{k:"mem", id:r.id, log:r.log}]});
    }
    case "memoriaPregunta": return preguntarMemoria(it);
    case "olvidar": {
      const q = raw.replace(/^[\s\S]*?\b(olvida(r|lo|te)?( que| lo de)?|ya no recuerdes( que)?|borra de tu memoria( que)?)\b\s*/i,"").replace(/^ya no /i,"");
      const c = buscarMem(q || raw);
      if(/^ya no me gusta/i.test(raw.trim())){ const obj=raw.replace(/^ya no me gusta(n)?\s*/i,""); const m=buscarMem("me gusta "+obj)[0]; if(m){ const r=await A.corregirMemoria(m.id, `Ya no me gusta ${obj}`); return R(`Entendido, actualizo: ya no te gusta ${obj}.`, {cards:[{k:"mem", id:m.id, log:r.log}]}); } const r=await A.recordar({texto:`Ya no me gusta ${obj}`, tipo:"preferencia"}); return R("Anotado.", {cards:[{k:"mem", id:r.id, log:r.log}]}); }
      if(!c.length){ const l=ultimo("mem"); if(l && PRONOMBRE.test(t)){ const r=await A.olvidar(l.id); return R(r.resumen+".", {cards:[{k:"undo", log:r.log}]}); } return R("No encontré ese dato en mi memoria. Puedes revisar todo lo que sé en Recuerdos → Lo que sé de ti."); }
      if(c.length>1 && puntuar(c[0].texto,q)-puntuar(c[1].texto,q) < .3) return preguntarEleccion("olvidar","mem",c, "¿Cuál de estos olvido?");
      const r = await A.olvidar(c[0].id); return R(`Listo, olvidé: «${c[0].texto}».`, {cards:[{k:"undo", log:r.log}]});
    }
    case "animo": {
      const k = MOOD_MAP[it.estado] || "normal"; const r = await A.animo(k, raw);
      const mood = moodDe(k);
      if(mood.v>=4) return R(pick([`¡Qué alegría, ${N()}! Lo anoto en tu ánimo de hoy. ¿Qué lo hizo especial? Si quieres, lo guardamos como recuerdo.`, "¡Me encanta oír eso! Quedó registrado en tu diario de ánimo."]), {emo:"animada", chips:[{l:"Guardarlo como recuerdo", say:"guárdalo en recuerdos: "+raw}]});
      if(k==="cansada"){ const ts=tareasDeHoy(); return R(`Gracias por decírmelo. Anoté que hoy estás cansada.${ts.length>2?` Tienes ${ts.length} tareas para hoy; ¿muevo las menos urgentes a mañana?`:" Date un respiro sin culpa."}`, {emo:"preocupada", chips: ts.length>2?[{l:"Sí, aligérame el día", say:"pasa mis tareas de hoy para mañana"}]:[]}); }
      if(k==="estresada") return R("Respira conmigo: inhala 4, sostén 4, exhala 6. Ahora elijamos solo una cosa. ¿Quieres que organice tu día en bloques cortos?", {emo:"preocupada", chips:[{l:"Organiza mi día", say:"organiza mi día"}]});
      return R(pick([`Gracias por contármelo, ${N()}. No tienes que poder con todo hoy. ¿Quieres contarme qué pasó?`, "Te escucho. Lo dejo anotado en tu ánimo. Si quieres hablar, aquí estoy."]), {emo:"preocupada"});
    }
    case "hora": return R(`Son las ${hhmm(new Date())}.`);
    case "fecha": return R(`Hoy es ${fmtDiaLargo(new Date())} de ${new Date().getFullYear()}.`);
    case "ayuda": return R(`Puedo registrar gastos e ingresos, corregirlos o borrarlos, organizar tu agenda, crear y mover eventos, anotar tareas, marcar hábitos, seguir tus metas, guardar recuerdos y recordar cosas sobre ti. Prueba alguno:`, {emo:"alegre",
      chips:[{l:"Gasté 12 soles en almuerzo",say:"Gasté 12 soles en almuerzo"},{l:"¿Qué tengo mañana?",say:"¿Qué tengo mañana?"},{l:"Reunión el viernes a las 4",say:"Agenda reunión con mi asesor el viernes a las 4"},{l:"Organiza mi día",say:"Organiza mi día"},{l:"¿Cuánto gasté este mes?",say:"¿Cuánto gasté este mes?"}]});
    case "charla": { const [, f, emo] = charlaMatch(t); const opts = f(t); return R(Array.isArray(opts)?pick(opts):opts, {emo:emo||"alegre"}); }
    case "libre": case "preguntaLibre": return {noEntendi:true};
  }
  return {noEntendi:true};
}
const NOMBRES_RUTA = {hoy:"Inicio", agenda:"tu agenda", tareas:"tus tareas", crecer:"Hábitos y metas", dinero:"tus finanzas", recuerdos:"tus recuerdos", progreso:"tu progreso", ajustes:"Ajustes", mila:"la conversación", frases:"tus frases", ciclo:"Mi ciclo", memoria:"lo que sé de ti", fuentes:"tus hojas"};
function matchCatEnTexto(raw){ const t=norm(raw); return S.profile.categorias.find(c=>new RegExp(`\\b${norm(c)}\\b`).test(t)) || null; }
function cuentaAtras(d){ const m=Math.round((d-new Date())/60000); if(m<60) return `en ${m} min`; if(m<1440) return `en ${Math.floor(m/60)} h ${m%60?m%60+" min":""}`.trim(); return `en ${Math.round(m/1440)} días`; }

/* ---------- crear evento ---------- */
async function crearEvento(d){
  let fecha = d.fecha;
  if(!fecha){ fecha = todayStr(); if(d.hora && new Date(`${fecha}T${d.hora}:00`) < new Date()) fecha = ymd(addDays(new Date(),1)); }
  const ini = d.allDay ? pymd(fecha) : new Date(`${fecha}T${d.hora}:00`);
  let fin = null; if(!d.allDay && d.fin){ fin = new Date(`${fecha}T${d.fin}:00`); if(fin<=ini) fin=null; }
  const r = await A.evento({titulo:d.titulo, ini, fin, dur:d.dur||60, allDay:!!d.allDay});
  const cuando = `${relDia(ini)}${d.allDay?" (todo el día)":" a las "+hhmm(ini)}`;
  const choque = r.choques?.length ? ` Ojo: se cruza con «${r.choques[0].titulo}».` : "";
  const dest = r.google ? " Ya está en tu Google Calendar." : (Cal.disponible() ? "" : "");
  return R(`${pick(["Listo","Agendado","Hecho"])}: «${capital(d.titulo)}» ${cuando}.${dest}${choque}`, {emo: choque?"preocupada":"alegre", cards:[{k:"evento", id:r.id, log:r.log}]});
}

/* ---------- dinero ---------- */
async function registrarMov(data){
  if(data.tipo==="ingreso" && !data.concepto && data.fuente) data = {...data, concepto:data.fuente};
  const r = await A.movimiento(data, "mila"); const m = r.doc;
  let extra = "";
  if(m.tipo==="gasto"){
    const mes = m.fecha.slice(0,7); const lim = Number(S.profile.presupuestos?.[m.categoria]||0);
    if(lim){ const usado = sum(S.movimientos.filter(x=>x.tipo==="gasto" && x.categoria===m.categoria && x.fecha?.startsWith(mes) && x.id!==r.id), x=>x.monto)+m.monto; const p=usado/lim;
      extra = p>=1 ? ` Ojo: ya pasaste tu presupuesto de ${m.categoria} (${money0(usado)} de ${money0(lim)}).` : p>=.8 ? ` Llevas ${Math.round(p*100)}% de tu presupuesto de ${m.categoria}.` : ""; }
  }
  const txt = m.tipo==="ingreso" ? pick([`¡Bien ahí! Sumé ${money(m.monto)} a tus ingresos${m.fuente?` (de ${m.fuente})`:""}.`, `Listo, anoté ${money(m.monto)} de ingreso${m.fuente?` de ${m.fuente}`:""}.`])
    : pick([`${ok()}, anoté ${money(m.monto)} en ${m.categoria}${m.concepto && m.concepto!=="Compra"?` (${m.concepto.toLowerCase()})`:""}.`, `Apuntado: ${money(m.monto)} en ${m.categoria}.`]);
  return R(txt+extra, {emo:"alegre", cards:[{k:"mov", id:r.id, log:r.log}]});
}
async function consultaDinero(it){
  const t = it.t; const f = parseFecha(t) || (()=>{ const d=new Date(); return {desde:ymd(new Date(d.getFullYear(),d.getMonth(),1)), hasta:ymd(new Date(d.getFullYear(),d.getMonth()+1,0)), label:"este mes"}; })();
  const cat = matchCatEnTexto(t) || (/\ben\s+(\w+)/.test(t) ? matchCat(t.match(/\ben\s+(\w+)/)[1]) : null);
  const ms = S.movimientos.filter(m=>m.estado==="registrado" && m.fecha>=f.desde && m.fecha<=f.hasta);
  const g = round2(sum(ms.filter(m=>m.tipo==="gasto"),m=>m.monto)), i = round2(sum(ms.filter(m=>m.tipo==="ingreso"),m=>m.monto));
  const lbl = f.single ? relDia(f.desde) : (f.label||"en ese periodo");
  if(cat){ const gc = round2(sum(ms.filter(m=>m.tipo==="gasto" && m.categoria===cat), m=>m.monto)); return R(`${capital(lbl)} gastaste ${money(gc)} en ${cat}${g?` (${Math.round(gc/g*100)}% de tus gastos)`:""}.`, {cards:[{k:"dinero", desde:f.desde, hasta:f.hasta}]}); }
  if(!ms.length) return R(`${capital(lbl)} no tengo movimientos registrados. Cuando gastes algo, solo dime «gasté 10 soles en…».`, {emo:"pensativa"});
  const porCat = Object.entries(groupBy(ms.filter(m=>m.tipo==="gasto"), m=>m.categoria||"Otros")).map(([c,l])=>[c, sum(l,m=>m.monto)]).sort((a,b)=>b[1]-a[1]);
  let s = `${capital(lbl)}: gastos ${money(g)}, ingresos ${money(i)}. Balance ${money(i-g)}.`;
  if(porCat[0]) s += ` Lo que más pesa: ${porCat[0][0]} (${money(porCat[0][1])}).`;
  if(i && g>i) s += " Estás gastando más de lo que entra; ¿revisamos juntas en qué recortar?";
  return R(s, {emo: g>i&&i ? "preocupada":"neutral", cards:[{k:"dinero", desde:f.desde, hasta:f.hasta}]});
}

/* ---------- borrar ---------- */
async function ejecutarSobre(accion, tipo, id, extra={}){
  if(accion==="borrar"){
    let r;
    if(tipo==="mov") r = await A.borrarMovimiento(id); else if(tipo==="tarea") r = await A.borrarTarea(id); else if(tipo==="evento") r = await A.borrarEvento(id);
    else if(tipo==="rec") r = await A.borrarRecuerdo(id); else if(tipo==="mem") r = await A.olvidar(id); else if(tipo==="nota") r = await A.borrarNota(id);
    else if(tipo==="habito") r = await A.borrarHabito(id); else if(tipo==="meta") r = await A.borrarMeta(id);
    else throw new Error("No sé borrar eso todavía.");
    return R(`${pick(["Listo","Hecho","Ya está"])}. ${r.resumen}. Si fue un error, di «deshaz».`, {emo:"alegre", cards:[{k:"undo", log:r.log}]});
  }
  if(accion==="editar") return aplicarEdicion(tipo, id, extra.texto || "");
  if(accion==="mover") return aplicarMovimiento(tipo, id, extra.texto || "");
  if(accion==="hecho"){ const r = await A.editarTarea(id, {estado:"hecha"}); Mila.celebrar(); return R(felicitar(), {emo:"animada", cards:[{k:"tarea", id, log:r.log}]}); }
  if(accion==="olvidar"){ const r = await A.olvidar(id); return R(`${r.resumen}.`, {cards:[{k:"undo", log:r.log}]}); }
  return R("Hecho.");
}
async function borrarDesdeTexto(it){
  const {t} = it; let tipo = it.tipo; const tipoMov = tipo==="gasto"||tipo==="ingreso"||tipo==="mov";
  const resto = quitarFechaHora(quitarComando(t)).replace(/\b\d+([.,]\d+)?\b|\bsoles?\b/g," ").trim();
  const conFiltros = resto.length>2 || parseMonto(t,{suelto:true}) || parseFecha(t);
  // pronombre o sin detalles → lo último
  if(!conFiltros || (it.pron && !resto)){
    const l = ultimo(tipo); if(l) return ejecutarSobre("borrar", l.type, l.id);
    if(!tipo) return R("¿Qué quieres que borre? Dime por ejemplo «borra el gasto de 20 soles de ayer».", {emo:"pensativa"});
  }
  if(tipoMov || (!tipo && parseMonto(t,{suelto:true}))){
    const c = buscarMovs(t, {tipo: tipoMov && tipo!=="mov" ? tipo : null});
    if(!c.length) return R(`No encontré ese ${tipo==="ingreso"?"ingreso":"gasto"}. ¿Me das el monto o la fecha?`, {emo:"pensativa"});
    if(c.length===1 || !conFiltros) return ejecutarSobre("borrar","mov",c[0].id);
    const top = c.slice(0,4); if(top.length>1 && !parseMonto(t,{suelto:true}) && !resto) return ejecutarSobre("borrar","mov",top[0].id);
    return preguntarEleccion("borrar","mov",top,"Encontré varios. ¿Cuál borro?");
  }
  const busc = {tarea:()=>buscarTareas(t,{pend:false}), evento:()=>buscarEventos(t), rec:()=>buscarRec(resto), mem:()=>buscarMem(resto), nota:()=>S.notas.filter(n=>puntuar(n.texto,resto)>=.5), habito:()=>{ const h=buscarHabito(resto); return h?[h]:[]; }, meta:()=>S.metas.filter(g=>puntuar(g.titulo,resto)>=.5)};
  const tipos = tipo && busc[tipo] ? [tipo] : ["evento","tarea","rec","nota","meta","habito"];
  for(const ty of tipos){ const c = busc[ty](); if(c.length===1) return ejecutarSobre("borrar", ty, c[0].id); if(c.length>1) return preguntarEleccion("borrar", ty, c.slice(0,4), "Encontré varios. ¿Cuál borro?"); }
  return R(`No encontré «${resto||t}» para borrar. ¿Me das más detalles?`, {emo:"pensativa"});
}

/* ---------- editar ---------- */
async function editarDesdeTexto(it){
  const {t} = it; let tipo = it.tipo;
  let target = null;
  if(tipo==="gasto"||tipo==="ingreso"||tipo==="mov"){ const resto = quitarFechaHora(quitarComando(t)).replace(/\b(era|eran|es|son|no|sino|monto|categoria|metodo|concepto|nombre|a|por)\b|\b\d+([.,]\d+)?\b|\bsoles?\b/g," ").trim();
    const l = ultimo(tipo); if(l && (!resto || resto.length<3)) target = l; else { const c=buscarMovs(resto||"", {tipo: tipo!=="mov"?tipo:null}); target = c[0] ? {type:"mov", id:c[0].id} : l; } }
  else if(tipo==="tarea"){ const c=buscarTareas(t); target = c[0] ? {type:"tarea", id:c[0].id} : ultimo("tarea"); }
  else if(tipo==="evento"){ const c=buscarEventos(t); target = c[0] ? {type:"evento", id:c[0].id} : ultimo("evento"); }
  else if(tipo==="rec"){ target = ultimo("rec"); }
  else if(tipo==="mem"){ target = ultimo("mem"); }
  else target = ultimo(null);
  if(!target) return R("¿Qué quieres corregir? Por ejemplo: «corrige el gasto de ayer, eran 15 soles».", {emo:"pensativa"});
  return aplicarEdicion(target.type, target.id, it.raw);
}
async function aplicarEdicion(tipo, id, raw){
  const t = limpia(raw);
  if(tipo==="mov"){
    const m = S.movimientos.find(x=>x.id===id); if(!m) return R("Ese movimiento ya no existe.");
    const c = {};
    const nums = [...t.matchAll(/(?:s\/\s*)?(\d+(?:[.,]\d{1,2})?)(?!\s*(?:de (?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)|:\d|am|pm|horas?))/g)].map(x=>parseFloat(x[1].replace(",",".")));
    const enPalabras = parseMonto(t.replace(/\d+([.,]\d+)?/g," "), {suelto:false});
    let v = null; const mm = t.match(/\bno (?:era|eran|es|son|fue|fueron)\s+(?:s\/\s*)?([\d.,]+)\D+?([\d.,]+)/); if(mm) v = parseFloat(mm[2].replace(",","."));
    else if(nums.length){ const otros = nums.filter(n=>Math.abs(n-m.monto)>0.001); v = otros.length ? otros[otros.length-1] : null; }
    else if(enPalabras) v = enPalabras;
    if(v) c.monto = v;
    const cat = matchCatEnTexto(t) || ((t.match(/\bcategoria\s+(?:a|es|de|:)?\s*(\w+)/)||[])[1] ? matchCat(t.match(/\bcategoria\s+(?:a|es|de|:)?\s*(\w+)/)[1]) : null); if(cat && cat!==m.categoria) c.categoria = cat;
    const met = /\b(yape|plin|efectivo|tarjeta|transferencia|scotia)\b/.test(t) ? inferMetodo(t) : null; if(met && met!==m.metodo) c.metodo = met;
    if(/\b(era|es|fue|no era)\s+(un\s+)?ingreso\b|\bno era (un )?gasto\b/.test(t)) c.tipo="ingreso"; else if(/\b(era|es|fue|no era)\s+(un\s+)?gasto\b|\bno era (un )?ingreso\b/.test(t)) c.tipo="gasto";
    const f = parseFecha(t); if(f?.single && /\b(fecha|fue|era|del|de)\b/.test(t)) c.fecha = f.desde;
    const mc = raw.match(/\b(?:concepto|nombre|descripci[oó]n|detalle)\s+(?:es|sea|a|por|como|:)?\s*["«]?([^"»]+)["»]?$/i) || raw.match(/\b(?:era|fue)\s+(?:por|en|de)\s+(?!\d)([a-záéíóúñ][\wáéíóúñ ]{2,40})$/i);
    if(mc && !/\b(yape|plin|efectivo|tarjeta|ayer|hoy|soles?)\b/i.test(mc[1])) c.concepto = mc[1].trim();
    const mfu = raw.match(/\b(?:de parte de|fuente\s+(?:es|a)?|viene de|era de)\s+([a-záéíóúñ][\wáéíóúñ ]{1,30})$/i); if(mfu && m.tipo==="ingreso" && !c.concepto) c.fuente = capital(mfu[1].trim());
    if(!Object.keys(c).length){ S.ctx.last={type:"mov", id}; return R(`¿Qué le cambio a ${etqMov(m).toLowerCase()}? Puedes decirme el monto, la categoría, el método o la fecha.`, {emo:"pensativa", cards:[{k:"mov", id}], chips:[{l:"Borrarlo",say:"bórralo"}]}); }
    const r = await A.editarMovimiento(id, c);
    const n = S.movimientos.find(x=>x.id===id) || {...m, ...r.patch};
    return R(`${ok()}, lo corregí: ${n.tipo==="gasto"?"gasto":"ingreso"} de ${money(c.monto??m.monto)}${(c.categoria||m.categoria)&&n.tipo==="gasto"?` en ${c.categoria||m.categoria}`:""}${c.metodo?` con ${c.metodo}`:""}${c.fecha?`, ${relDia(c.fecha)}`:""}.`, {emo:"alegre", cards:[{k:"mov", id, log:r.log}]});
  }
  if(tipo==="tarea"){
    const x = S.tareas.find(y=>y.id===id); if(!x) return R("Esa tarea ya no existe."); const c={};
    const f=parseFecha(t), h=parseHora(t); if(f?.single) c.vence=f.desde; if(h) c.hora=h;
    const p = t.match(/prioridad\s+(alta|media|baja)|\b(urgente|importante)\b/); if(p) c.prioridad = p[1] || "alta";
    const nt = raw.match(/\b(?:nombre|t[ií]tulo)\s+(?:a|es|por|:)?\s*["«]?([^"»]+)["»]?$/i) || raw.match(/\bcambia(?:la|r)?\s+(?:a|por)\s+["«]?([^"»]+)["»]?$/i); if(nt && !f && !h) c.titulo = nt[1].trim();
    if(!Object.keys(c).length) return R(`¿Qué le cambio a «${x.titulo}»? Fecha, hora, prioridad o nombre.`, {emo:"pensativa", cards:[{k:"tarea", id}]});
    const r = await A.editarTarea(id, c); return R(`${ok()}: «${c.titulo||x.titulo}»${c.vence?" para "+relDia(c.vence):""}${c.hora?" a las "+c.hora:""}${c.prioridad?", prioridad "+c.prioridad:""}.`, {emo:"alegre", cards:[{k:"tarea", id, log:r.log}]});
  }
  if(tipo==="evento") return aplicarMovimiento("evento", id, raw);
  if(tipo==="mem"){ const nt = raw.replace(/^[\s\S]*?\b(a|por|que|es)\b\s*/i,"").trim(); if(!nt) return R("¿Cómo debería quedar ese dato?"); const r=await A.corregirMemoria(id, nt); return R(r.resumen+".", {cards:[{k:"mem", id, log:r.log}]}); }
  if(tipo==="rec"){ const e = EMOS.find(([k,l])=>t.includes(norm(l))); const nt = raw.match(/\bt[ií]tulo\s+(?:a|es|por|:)?\s*(.+)$/i); const c={}; if(e) c.emocion=e[0]; if(nt) c.titulo=capital(nt[1]); const f=parseFecha(t); if(f?.single) c.fecha=f.desde;
    if(!Object.keys(c).length) return R("¿Qué cambio del recuerdo: el título, la fecha o la emoción?"); const r=await A.editarRecuerdo(id,c); return R(`${ok()}, recuerdo actualizado.`, {cards:[{k:"rec", id, log:r.log}]}); }
  return R("Eso todavía no lo puedo corregir desde la conversación; ábrelo y edítalo con el lápiz.");
}

/* ---------- mover (agenda y tareas) ---------- */
async function moverDesdeTexto(it){
  const {t} = it; const tipo = it.tipo;
  const antes = t.split(/\b(?:para el|para la|para las|para|al|a la|a las|hacia el)\b/)[0];
  let target = null;
  if(tipo!=="tarea"){ const c = buscarEventos(antes); if(c.length===1 || (c.length>1 && puntuar(c[0].titulo,antes)-puntuar(c[1].titulo,antes)>.3)) target={type:"evento", id:c[0].id}; else if(c.length>1) return preguntarEleccion("mover","evento",c.slice(0,4),"¿Cuál de estos muevo?",{texto:it.raw}); }
  if(!target && tipo!=="evento"){ const c = buscarTareas(antes); if(c.length===1 || (c.length>1 && puntuar(c[0].titulo,antes)-puntuar(c[1].titulo,antes)>.3)) target={type:"tarea", id:c[0].id}; else if(c.length>1) return preguntarEleccion("mover","tarea",c.slice(0,4),"¿Cuál muevo?",{texto:it.raw}); }
  if(!target){ const l = ultimo(tipo==="evento"||tipo==="tarea"?tipo:null); if(l && (l.type==="evento"||l.type==="tarea")) target=l; }
  if(!target) return R("¿Qué quieres mover? Dime el nombre del evento o la tarea y la nueva fecha u hora.", {emo:"pensativa"});
  return aplicarMovimiento(target.type, target.id, it.raw);
}
async function aplicarMovimiento(tipo, id, raw){
  const t = limpia(raw); const partes = t.split(/\b(?:para el|para la|para las|para|al|a la|a las|hacia el)\b/); const cola = partes.length>1 ? partes.slice(1).join(" ") : t;
  const pref = partes.length>1 ? (/^a las?|para las?/.test(t.slice(t.indexOf(cola)-8)) ? "a las " : "") : "";
  const f = parseFecha(cola) || (partes.length>1 ? null : parseFecha(t)); const h = parseHora((pref+cola)) || parseHora(" a las "+cola) || parseHora(t.slice(t.lastIndexOf(" a las ")));
  if(tipo==="tarea"){
    const x=S.tareas.find(y=>y.id===id); if(!x) return R("No encontré esa tarea.");
    if(!f && !h) return R(`¿Para cuándo muevo «${x.titulo}»?`, {chips:[{l:"Hoy",say:"para hoy"},{l:"Mañana",say:"para mañana"}]});
    const c={}; if(f?.single) c.vence=f.desde; if(h){ c.hora=h; if(!c.vence && !x.vence) c.vence=todayStr(); }
    const r=await A.editarTarea(id,c); return R(`${ok()}: «${x.titulo}» quedó para ${relDia(c.vence||x.vence)}${c.hora?" a las "+c.hora:""}.`, {emo:"alegre", cards:[{k:"tarea", id, log:r.log}]});
  }
  const ev = buscarEvento(id); if(!ev) return R("No encontré ese evento.");
  if(!f && !h){ const nt = raw.match(/\b(?:nombre|t[ií]tulo)\s+(?:a|es|por|:)?\s*(.+)$/i); if(nt){ const r=await A.editarEvento(id,{titulo:nt[1]}); return R(`${ok()}, ahora se llama «${capital(nt[1])}».`, {cards:[{k:"evento", id, log:r.log}]}); }
    return R(`¿A qué día u hora muevo «${ev.titulo}»?`, {emo:"pensativa"}); }
  const base = f?.single ? pymd(f.desde) : startDay(ev.ini);
  const [hh,mm] = (h || hhmm(ev.ini)).split(":").map(Number); const ini = new Date(base.getFullYear(), base.getMonth(), base.getDate(), hh, mm);
  const r = await A.editarEvento(id, {ini:ini.toISOString()});
  const choques = eventosEntre(ymd(ini), ymd(ini), {tareas:false}).filter(e=>e.id!==id && !e.allDay && e.ini<addMin(ini,(ev.fin-ev.ini)/60000) && e.fin>ini);
  return R(`${ok()}: «${ev.titulo}» ahora es ${relDia(ini)}${ev.allDay?"":" a las "+hhmm(ini)}.${choques.length?` Ojo, se cruza con «${choques[0].titulo}».`:""}`, {emo: choques.length?"preocupada":"alegre", cards:[{k:"evento", id, log:r.log}]});
}

/* ---------- hecho ---------- */
function felicitar(){ const quedan = tareasDeHoy().length; return pick([`¡Bien, ${N()}! Una menos.`, "¡Tachada! Me encanta verte avanzar.", "¡Eso! Cada check cuenta."]) + (quedan ? ` Te ${quedan===1?"queda una":"quedan "+quedan} para hoy.` : " ¡Terminaste lo de hoy!"); }
async function marcarHecho(it){
  const obj = it.objeto || ""; const t = it.t;
  const h = obj ? (buscarHabito(obj) || (it.verbo && buscarHabito(it.verbo)) || S.habitos.find(x=>simil(x.nombre, t)>=.5)) : null;
  if(h){ const r = await A.habito(h.nombre); const rr = racha({...h, registros:{...(h.registros||{}), [todayStr()]:true}}); Mila.celebrar();
    return R(`¡Hábito cumplido: ${h.nombre}!${rr>1?` Llevas ${rr} días seguidos.`:" Hoy empieza tu racha."}`, {emo:"animada", cards:[{k:"habito", id:h.id, log:r.log}]}); }
  if(!obj || PRONOMBRE.test(obj.trim()) || /^(eso|esa|la tarea|lo)$/.test(obj.trim())){ const l=ultimo("tarea"); if(l) return ejecutarSobre("hecho","tarea",l.id); }
  const c = buscarTareas(obj || t);
  if(c.length===1 || (c.length>1 && puntuar(c[0].titulo,obj)-puntuar(c[1].titulo,obj)>.3)) return ejecutarSobre("hecho","tarea",c[0].id);
  if(c.length>1) return preguntarEleccion("hecho","tarea",c.slice(0,4),"¿Cuál terminaste?");
  const pend = priorizar(S.tareas.filter(x=>x.estado!=="hecha")).slice(0,4);
  if(!pend.length) return R(`¡Bien! No la tenía en tu lista, pero lo celebro igual.`, {emo:"animada"});
  S.ctx.pending = {kind:"elegir", accion:"hecho", tipo:"tarea", ids:pend.map(x=>x.id)};
  return R(`No encontré «${obj}» en tus pendientes. ¿Es alguna de estas?`, {emo:"pensativa", chips:[...chipsDe(pend, etqTarea), {l:"Ninguna", say:"#cancelar"}]});
}

/* ---------- memoria ---------- */
async function preguntarMemoria(it){
  const raw = it.raw;
  let prop = raw.replace(/^[\s¿¡]*(?:mila,?\s*)?(?:es cierto que|es verdad que|ser[aá] que|acaso|t[eú] sabes si|sabes si|recuerdas si|te acuerdas (?:de )?si|te acuerdas de que|recuerdas que)\s*/i,"").replace(/[?¿!]+/g,"").trim();
  const t = norm(prop);
  if(/^(que sabes de mi|que recuerdas de mi|que sabes sobre mi)/.test(norm(raw.replace(/[¿?]/g,"")))){
    if(!S.memorias.length) return R("Todavía sé poco de ti. Cuéntame cosas como «me encanta el café» o «mi cumpleaños es el 3 de mayo» y las recordaré.");
    const muestra = S.memorias.slice().sort(()=>Math.random()-.5).slice(0,4).map(m=>m.texto.replace(/[.]$/,"")).join("; ");
    return R(`Sé ${plural(S.memorias.length,"cosa","cosas")} de ti. Por ejemplo: ${muestra}. Puedes ver y editar todo en Recuerdos → Lo que sé de ti.`, {emo:"alegre", chips:[{l:"Ver todo",say:"abre mis recuerdos"}]});
  }
  const mems = buscarMem(prop); const recs = buscarRec(prop);
  const objeto = prop.replace(/^(me gustan?|me encantan?|odio|amo|prefiero|soy|tengo|mi|cu[aá]l es mi|cu[aá]ndo es mi|c[oó]mo se llama mi|qui[eé]n es mi)\s+/i,"");
  if(mems.length){
    const m = mems[0]; const neg = /\b(no me|ya no|odio|no soporto)\b/.test(norm(m.texto)); const preguntaNeg = /\bno me\b/.test(t);
    if(/^(me gustan?|me encantan?)/.test(t)) return R(neg ? `Según lo que me contaste, no: «${m.texto}».` : `¡Sí! Me contaste que ${m.texto.replace(/^Me /,"te ").replace(/^me /,"te ").replace(/[.]$/,"")}.`, {emo:"alegre", cards:[{k:"mem", id:m.id}]});
    return R(`Lo que tengo guardado: «${m.texto}».${mems[1]?` También: «${mems[1].texto}».`:""}`, {emo:"alegre", cards:[{k:"mem", id:m.id}]});
  }
  if(recs.length) return R(`No lo tengo como dato, pero aparece en tu diario: «${recs[0].titulo}» (${recs[0].fecha?relDia(recs[0].fecha):"sin fecha"}).`, {cards:[{k:"rec", id:recs[0].id}]});
  if(IA.lista()) return {noEntendi:true};
  if(/^(me gustan?|me encantan?)\b/.test(t)){
    const frase = capital(prop.replace(/^me encantan?/i, m=>m.toLowerCase()));
    S.ctx.pending = {kind:"confirmarDato", texto: capital(prop)};
    return R(`No lo tengo guardado todavía. ¿Te gusta ${objeto}? Dime sí o no y lo recordaré.`, {emo:"pensativa", chips:[{l:"Sí, me gusta", say:"sí"},{l:"No me gusta", say:"no"}]});
  }
  return R(`No tengo eso guardado, ${N()}. Si me lo cuentas, lo recordaré para siempre.`, {emo:"pensativa"});
}

/* ---------- recuerdos ---------- */
async function guardarRecuerdo(texto){
  const r = await A.recuerdo({relato:texto});
  const em = r.doc.emocion; Mila.set(null, em==="triste"||em==="dificil" ? "preocupada" : "animada");
  return R(REC_REPLY[em] || "Ya quedó guardado en tu diario.", {emo: em==="triste"||em==="dificil" ? "preocupada" : "animada", cards:[{k:"rec", id:r.id, log:r.log}]});
}

/* ---------- planificar el día ---------- */
function huecosLibres(fecha, desdeHora){
  const dia = pymd(fecha); const ahora=new Date();
  let ini = new Date(dia); ini.setHours(Math.max(S.profile.ajustes.inicioDia||7, 7),0,0,0);
  if(sameDay(dia, ahora) && ahora>ini){ ini = new Date(ahora); ini.setMinutes(Math.ceil((ini.getMinutes()+5)/15)*15, 0, 0); }
  if(desdeHora){ const [h,m]=desdeHora.split(":").map(Number); const d=new Date(dia); d.setHours(h,m,0,0); if(d>ini) ini=d; }
  const fin = new Date(dia); fin.setHours(23,0,0,0);
  const ocupados = eventosEntre(fecha, fecha).filter(e=>!e.allDay).map(e=>[e.ini, e.fin]).sort((a,b)=>a[0]-b[0]);
  const huecos = []; let cur = ini;
  for(const [a,b] of ocupados){ if(b<=cur) continue; if(a>cur && (a-cur)>=20*60000) huecos.push([cur, a]); if(b>cur) cur=b; }
  if(fin>cur && (fin-cur)>=20*60000) huecos.push([cur, fin]);
  return huecos;
}
async function planificar(it){
  const f = parseFecha(it.t); const fecha = f?.single ? f.desde : todayStr(); const hoy=todayStr();
  try{ if(Cal.ok()) await Cal.cargar(fecha, fecha); }catch{}
  const cands = priorizar(S.tareas.filter(x=>x.estado!=="hecha" && !x.hora && (!x.vence || x.vence<=ymd(addDays(pymd(fecha),3))))).slice(0,4);
  if(!cands.length) return R(`No tienes tareas sin hora para ${relDia(fecha)}. ${describirAgenda({desde:fecha, hasta:fecha})}`, {emo:"alegre", cards:[{k:"agenda", desde:fecha, hasta:fecha}]});
  const huecos = huecosLibres(fecha, /\btarde\b/.test(it.t)?"14:00":/\bnoche\b/.test(it.t)?"19:00":null);
  const bloques=[]; let hi=0, cur=huecos[0]?.[0];
  for(const x of cands){ const dur = Math.min(90, Math.max(25, Number(x.dur)||45)); while(hi<huecos.length && (huecos[hi][1]-cur) < dur*60000){ hi++; cur=huecos[hi]?.[0]; } if(hi>=huecos.length) break;
    bloques.push({id:x.id, titulo:x.titulo, fecha, hora:hhmm(cur), dur}); cur = addMin(cur, dur+10); }
  if(!bloques.length) return R(`${capital(relDia(fecha))} tu agenda está llena. Te sugiero mover «${cands[0].titulo}» a mañana.`, {emo:"preocupada", chips:[{l:"Moverla a mañana", say:`mueve la tarea ${cands[0].titulo} para mañana`}]});
  S.ctx.pending = {kind:"planConfirm", bloques};
  const txt = bloques.map((b,i)=>`${i+1}) ${b.hora} «${b.titulo}» (${b.dur} min)`).join(", ");
  return R(`Te propongo este plan para ${relDia(fecha)}: ${txt}. ${bloques.length<cands.length?"El resto lo dejamos para después. ":""}¿Lo agendo?`, {emo:"pensativa", cards:[{k:"plan", bloques}], chips:[{l:"Sí, agéndalo",say:"sí"},{l:"Ahora no",say:"#cancelar"}]});
}

/* ---------- respuesta libre ---------- */
async function respuestaLibre(it, prev){
  if(IA.lista()){ try{ return await IA.responder(it.raw); }catch(e){ console.warn("IA", e); if(e?.fatal) return R(e.message, {emo:"preocupada"}); } }
  const t = it.t; const words = t.split(" ").length;
  if(!it.q && words>=6){
    S.ctx.pending = {kind:"ofrecerRecuerdo", texto: it.raw}; S.ctx.lastFree = it.raw; S.ctx.lastFreeTs = Date.now();
    const emo = recMeta(it.raw).emocion;
    const eco = emo==="logro" ? "¡Qué dedicación!" : emo==="triste"||emo==="dificil" ? "Gracias por contármelo." : emo==="gracioso" ? "¡Jaja, buenísimo!" : "Qué bonito que me lo cuentes.";
    return R(`${eco} ¿Quieres que lo guarde en tus recuerdos?`, {emo:"escuchando", chips:[{l:"Sí, guárdalo",say:"sí"},{l:"No",say:"#cancelar"}]});
  }
  const sug = sugerencias(t);
  return R(`${pick(["Mmm, no estoy segura de haber entendido","Esa no la capté del todo","No sé si entendí bien"])}${it.q?" tu pregunta":""}. ${IA.configurada()?"":"Para conversar de cualquier tema, activa la inteligencia gratuita en Ajustes. "}¿Querías alguna de estas cosas?`, {emo:"pensativa", chips: sug});
}
function sugerencias(t){
  const out=[];
  if(/\d/.test(t)) out.push({l:"Registrar como gasto", say:"gasté "+t}, {l:"Registrar como ingreso", say:"me pagaron "+t});
  if(parseFecha(t)||parseHora(t)) out.push({l:"Agendarlo", say:"agenda "+t});
  out.push({l:"Crear tarea", say:"agrega tarea "+t}, {l:"Guardar como nota", say:"anota nota "+t});
  if(!IA.configurada()) out.push({l:"Activar IA gratis", say:"#ajustes-ia"});
  return out.slice(0,4);
}

function coachChipsMotivo(id){ return [{l:"No tengo ganas / lo evito", say:`#coach procrastinacion ${id}`},{l:"Tengo demasiado", say:`#coach sobrecarga ${id}`},{l:"Algo me lo impide", say:`#coach obstaculo ${id}`},{l:"Divídelo en pasos", say:`#coach dividir ${id}`}]; }
