/* =========================================================
   Inteligencia conversacional opcional (gratis con tu propia clave)
   Proveedores con capa gratuita y compatibles con el formato OpenAI:
   Groq, Google Gemini (AI Studio), Cerebras, OpenRouter y Mistral.
   También funciona con Claude si tienes saldo.
   Si no hay clave o falla, Mila sigue con su cerebro local.
   ========================================================= */
const PROVEEDORES = {
  groq:{ n:"Groq", base:"https://api.groq.com/openai/v1", url:"https://console.groq.com/keys", pref:["openai/gpt-oss-120b","llama-3.3-70b-versatile","moonshotai/kimi-k2-instruct-0905","moonshotai/kimi-k2-instruct","qwen/qwen3-32b","openai/gpt-oss-20b"], nota:"Gratis, muy rápido. Entra con tu cuenta de Google o correo; no pide tarjeta." },
  gemini:{ n:"Google Gemini", base:"https://generativelanguage.googleapis.com/v1beta/openai", url:"https://aistudio.google.com/apikey", pref:["gemini-3-flash","gemini-2.5-flash","gemini-flash-latest","gemini-2.0-flash"], nota:"Gratis desde Google AI Studio (no es Google Cloud). Usa una cuenta personal de Gmail si la de la universidad no te deja." },
  cerebras:{ n:"Cerebras", base:"https://api.cerebras.ai/v1", url:"https://cloud.cerebras.ai", pref:["gpt-oss-120b","qwen-3-235b-a22b-instruct-2507","llama-3.3-70b","llama3.1-8b"], nota:"Gratis con límite diario generoso." },
  openrouter:{ n:"OpenRouter (modelos :free)", base:"https://openrouter.ai/api/v1", url:"https://openrouter.ai/keys", pref:[], nota:"Modelos gratuitos con límite diario." },
  mistral:{ n:"Mistral", base:"https://api.mistral.ai/v1", url:"https://console.mistral.ai/api-keys", pref:["mistral-small-latest","mistral-medium-latest","mistral-large-latest"], nota:"Plan gratuito «Experiment» (pide verificar tu celular)." },
  claude:{ n:"Claude (de pago)", base:"", url:"https://console.anthropic.com", pref:[], nota:"Requiere saldo en tu cuenta de Anthropic." }
};
const IA = {
  cfg(){ const k = window.MilaApp?.Claves.get() || {}; const prov = k.llmProv || (k.claude ? "claude" : ""); return {prov, key: prov==="claude" ? k.claude : k.llmKey, model:k.llmModel||"", on: k.llmOn!==false}; },
  configurada(){ const c=this.cfg(); return !!(c.prov && c.key); },
  lista(){ const c=this.cfg(); return this.configurada() && c.on && navigator.onLine!==false && !(this.pausaHasta>Date.now()); },
  pausaHasta:0, cards:null,
  async modelos(prov, key){
    const P = PROVEEDORES[prov]; const r = await fetch(P.base+"/models", {headers:{Authorization:"Bearer "+key}});
    const j = await r.json().catch(()=>({}));
    if(!r.ok) throw new Error(r.status===401||r.status===403||r.status===400 ? "La clave no es válida para "+P.n+"." : (j?.error?.message||("Error "+r.status)));
    let ids = (j.data||j.models||[]).map(m=>({id:String(m.id||m.name||"").replace(/^models\//,""), tools: Array.isArray(m.supported_parameters) ? m.supported_parameters.includes("tools") : true}));
    if(prov==="openrouter") ids = ids.filter(m=>m.id.endsWith(":free") && m.tools);
    return ids.map(m=>m.id);
  },
  elegirModelo(prov, ids){
    const P=PROVEEDORES[prov]; for(const p of P.pref){ const f = ids.find(i=>i===p) || ids.find(i=>i.startsWith(p)); if(f) return f; }
    return ids.find(i=>/gpt-oss-120b|70b|flash|large|qwen3|kimi|deepseek/.test(i) && !/vision|guard|embed|tts|whisper|audio|image|lite-preview/.test(i)) || ids.find(i=>!/guard|embed|tts|whisper|audio|image/.test(i)) || ids[0];
  },
  async configurar(prov, key){
    key = String(key||"").trim(); if(!prov) throw new Error("Elige un proveedor.");
    if(prov==="claude"){ window.MilaApp.Claves.set({llmProv:"claude", claude:key, llmOn:true}); return {modelo: window.MilaApp.Claves.get().modelo || "claude"}; }
    if(!key) throw new Error("Pega tu clave.");
    const ids = await this.modelos(prov, key); const model = this.elegirModelo(prov, ids);
    if(!model) throw new Error("No encontré un modelo disponible con esa clave.");
    window.MilaApp.Claves.set({llmProv:prov, llmKey:key, llmModel:model, llmOn:true});
    const prueba = await this.chat([{role:"user", content:"Responde solo: ok"}], {tools:false, max:10});
    return {modelo:model, prueba: prueba.content};
  },
  async chat(messages, {tools=true, max=700}={}){
    const c = this.cfg(); const P = PROVEEDORES[c.prov];
    const body = {model:c.model, messages, temperature:0.5, max_tokens:max};
    if(tools){ body.tools = TOOLS_IA.map(t=>({type:"function", function:{name:t.name, description:t.description, parameters:t.parameters}})); body.tool_choice="auto"; }
    const ctl = new AbortController(); const to = setTimeout(()=>ctl.abort(), 45000);
    let r; try{ r = await fetch(P.base+"/chat/completions", {method:"POST", headers:{"Content-Type":"application/json", Authorization:"Bearer "+c.key, ...(c.prov==="openrouter"?{"HTTP-Referer":location.origin, "X-Title":"Mila"}:{})}, body:JSON.stringify(body), signal:ctl.signal}); }
    finally{ clearTimeout(to); }
    const j = await r.json().catch(()=>({}));
    if(!r.ok){ const msg = j?.error?.message || j?.message || ("Error "+r.status);
      if(r.status===401||r.status===403) throw {fatal:true, message:`Tu clave de ${P.n} no funciona (${msg.slice(0,80)}). Revísala en Ajustes → Inteligencia.`};
      if(r.status===429){ this.pausaHasta = Date.now()+60000; throw {message:"Límite gratuito alcanzado por ahora"}; }
      if(r.status===404 || /model/i.test(msg)){ throw {message:"Modelo no disponible: "+msg}; }
      throw {message:msg}; }
    return j.choices?.[0]?.message || {content:""};
  },
  async responder(texto){
    const c = this.cfg(); this.cards = [];
    if(c.prov==="claude") return this.responderClaude(texto);
    const msgs = [{role:"system", content:contextoIA()}, ...historialIA(), {role:"user", content:texto}];
    for(let ronda=0; ronda<5; ronda++){
      const m = await this.chat(msgs);
      const calls = m.tool_calls || [];
      if(!calls.length){ const t = limpiarRespuesta(m.content||""); return R(t.t || "Listo.", {emo:t.emo||"alegre", cards:this.cards}); }
      msgs.push({role:"assistant", content:m.content||"", tool_calls:calls});
      for(const call of calls){
        let out; try{ const tdef = TOOLS_IA.find(x=>x.name===call.function?.name); if(!tdef) throw new Error("herramienta desconocida");
          const args = JSON.parse(call.function.arguments||"{}"); out = await tdef.run(args); }
        catch(e){ out = {ok:false, error: errMsg(e)}; }
        msgs.push({role:"tool", tool_call_id:call.id, content: JSON.stringify(out).slice(0,6000)});
      }
    }
    return R("Listo.", {cards:this.cards});
  },
  async responderClaude(texto){
    const sample = await window.claude.use("sample"); if(!sample) throw {fatal:true, message:"Falta tu clave de Claude en Ajustes."};
    const tools = TOOLS_IA.map(t=>({name:t.name, description:t.description, inputSchema:t.parameters, execute:(i)=>t.run(i)}));
    const input = [{role:"user", content:contextoIA()}, ...historialIA(), {role:"user", content:texto}];
    try{ const r = await sample(input, {tools, modelTier:"quick"}); const t = limpiarRespuesta(r.text); return R(t.t||"Listo.", {emo:t.emo||"alegre", cards:this.cards}); }
    catch(e){ if(e?.code==="not_granted") throw {fatal:true, message:e.message}; throw e; }
  }
};
function limpiarRespuesta(text){
  let t = String(text||"").trim(); let emo=null;
  const m = t.match(/\[emo:([a-záéíóú]+)\]/i); if(m) emo=norm(m[1]);
  t = t.replace(/\[emo:[^\]]*\]\s*/gi,"").replace(/<think>[\s\S]*?<\/think>/g,"").replace(/\*\*/g,"").replace(/^#+\s*/gm,"").trim();
  return {t, emo};
}
function historialIA(){
  const out=[]; for(const m of S.chat.slice(-11,-1)){ if(m.t) out.push({role: m.r==="u"?"user":"assistant", content:m.t.slice(0,600)}); }
  return out;
}
function contextoIA(){
  const now=new Date(), p=S.profile, hoy=todayStr();
  const pend = priorizar(S.tareas.filter(t=>t.estado!=="hecha")).slice(0,30).map(t=>`[${t.id}] ${t.titulo}${t.vence?` · ${t.vence}${t.hora?" "+t.hora:""}`:""} · ${t.prioridad}${t.area?" · "+t.area:""}`).join("\n")||"(ninguna)";
  const ev = eventosEntre(ymd(addDays(now,-1)), ymd(addDays(now,7)), {tareas:false}).filter(e=>!e.alerta).slice(0,30).map(e=>`[${e.id}] ${ymd(e.ini)} ${e.allDay?"todo el día":hhmm(e.ini)+"-"+hhmm(e.fin)} ${e.titulo}`).join("\n")||"(ninguno)";
  const movs = S.movimientos.slice().sort((a,b)=>(b.creado||0)-(a.creado||0)).slice(0,12).map(m=>`[${m.id}] ${m.fecha} ${m.tipo} ${m.monto} ${m.concepto} · ${m.categoria||m.fuente||""} · ${m.metodo}`).join("\n")||"(ninguno)";
  const {g,i} = totalesMes(hoy.slice(0,7));
  const mem = S.memorias.slice(0,80).map(m=>`[${m.id}] ${m.texto}`).join("\n")||"(vacía)";
  const hab = S.habitos.map(h=>`${h.nombre}: ${h.registros?.[hoy]?"hecho hoy":"pendiente"} (racha ${racha(h)})`).join("; ")||"(ninguno)";
  const metas = S.metas.filter(x=>x.estado==="activa").map(x=>`[${x.id}] ${x.titulo} ${x.progreso||0}% · próxima: ${x.proxima_accion||"-"}`).join("\n")||"(ninguna)";
  const recs = S.recuerdos.slice().sort((a,b)=>(b.creado||0)-(a.creado||0)).slice(0,6).map(r=>`- ${r.titulo} (${r.fecha||""}, ${emoLabel(r.emocion)})`).join("\n")||"(ninguno)";
  const last = S.ctx.last ? `${S.ctx.last.type} id ${S.ctx.last.id}` : "nada";
  return `Eres ${p.asistente}, la asistente personal de ${p.nombre}: una luciérnaga digital cálida, cercana y práctica (español de Perú, natural, sin exagerar). ${p.nombre} estudia Administración (9.º ciclo, UNJBG, Tacna, turno noche), hace prácticas en ROQASEG hasta enero de 2027 y prepara su tesis sobre socialización organizacional. Le cuesta la constancia, así que eres amable pero insistente con lo importante.
Ahora: ${DIAS[now.getDay()]} ${hoy} ${hhmm(now)} (America/Lima). "Mañana", "el viernes", "a las 9" se interpretan respecto a esto. Horas ambiguas 1-6 = tarde.
REGLAS: 1) Para cualquier cambio de datos usa SIEMPRE herramientas; nunca digas que hiciste algo sin una herramienta con ok:true. 2) Si algo es ambiguo (varios candidatos, falta monto u hora), pregunta UNA cosa breve antes de actuar. 3) "bórralo", "cámbialo", "eso" se refieren al último elemento: ${last}. 4) Si ella cuenta algo duradero de sí misma, guárdalo con recordar_dato; si es una anécdota que quiere conservar, con guardar_recuerdo. 5) Responde en 1-3 frases cortas, naturales para oír en voz alta, sin listas largas ni markdown ni emojis. Puedes iniciar con [emo:alegre|animada|pensativa|preocupada|neutral]. 6) No inventes datos: si no está aquí, di que no lo sabes. 7) No das asesoría de inversión; sí ordenas y resumes sus finanzas.
Categorías de gasto: ${p.categorias.join(", ")}. Métodos: ${p.metodos.join(", ")}.
MEMORIA (datos sobre ella):\n${mem}
METAS:\n${metas}
HÁBITOS HOY: ${hab}
TAREAS PENDIENTES:\n${pend}
AGENDA (ayer a +7 días):\n${ev}
MOVIMIENTOS RECIENTES:\n${movs}
FINANZAS DEL MES: gastos ${money(g)}, ingresos ${money(i)}.
RECUERDOS RECIENTES:\n${recs}`;
}
const card = (c) => { IA.cards?.push(c); };
const TOOLS_IA = [
  {name:"registrar_movimiento", description:"Registra un gasto o ingreso. fecha YYYY-MM-DD (hoy por defecto).", parameters:{type:"object", properties:{tipo:{type:"string", enum:["gasto","ingreso"]}, monto:{type:"number"}, concepto:{type:"string"}, categoria:{type:"string"}, metodo:{type:"string"}, fecha:{type:"string"}, fuente:{type:"string", description:"De quién viene el ingreso"}}, required:["tipo","monto"]},
    async run(a){ const r=await A.movimiento(a,"mila"); card({k:"mov", id:r.id, log:r.log}); return {ok:true, id:r.id, resumen:r.resumen}; }},
  {name:"editar_movimiento", description:"Corrige un gasto/ingreso existente por id (monto, categoria, metodo, fecha, concepto, tipo, fuente).", parameters:{type:"object", properties:{id:{type:"string"}, monto:{type:"number"}, categoria:{type:"string"}, metodo:{type:"string"}, fecha:{type:"string"}, concepto:{type:"string"}, tipo:{type:"string"}, fuente:{type:"string"}}, required:["id"]},
    async run(a){ const {id,...c}=a; const r=await A.editarMovimiento(id,c); card({k:"mov", id, log:r.log}); return {ok:true, resumen:r.resumen}; }},
  {name:"borrar", description:"Borra un elemento por id. tipo: movimiento|tarea|evento|recuerdo|dato|nota|habito|meta. Es reversible con deshacer.", parameters:{type:"object", properties:{tipo:{type:"string", enum:["movimiento","tarea","evento","recuerdo","dato","nota","habito","meta"]}, id:{type:"string"}}, required:["tipo","id"]},
    async run(a){ const map={movimiento:"mov",tarea:"tarea",evento:"evento",recuerdo:"rec",dato:"mem",nota:"nota",habito:"habito",meta:"meta"}; const r=await ejecutarSobre("borrar", map[a.tipo], a.id); IA.cards.push(...r.cards); return {ok:true, resumen:r.t}; }},
  {name:"crear_tarea", description:"Crea una tarea. vence YYYY-MM-DD, hora HH:MM, prioridad alta|media|baja.", parameters:{type:"object", properties:{titulo:{type:"string"}, vence:{type:"string"}, hora:{type:"string"}, prioridad:{type:"string", enum:["alta","media","baja"]}, area:{type:"string"}}, required:["titulo"]},
    async run(a){ const r=await A.tarea(a); card({k:"tarea", id:r.id, log:r.log}); return {ok:true, id:r.id, resumen:r.resumen}; }},
  {name:"editar_tarea", description:"Cambia una tarea por id: titulo, vence, hora, prioridad, estado (pendiente|hecha), area.", parameters:{type:"object", properties:{id:{type:"string"}, titulo:{type:"string"}, vence:{type:"string"}, hora:{type:"string"}, prioridad:{type:"string"}, estado:{type:"string"}, area:{type:"string"}}, required:["id"]},
    async run(a){ const {id,...c}=a; const r=await A.editarTarea(id,c); card({k:"tarea", id, log:r.log}); return {ok:true, resumen:r.resumen}; }},
  {name:"crear_evento", description:"Crea un evento en la agenda. inicio 'YYYY-MM-DDTHH:MM' (o fecha + todo_el_dia). fin opcional.", parameters:{type:"object", properties:{titulo:{type:"string"}, inicio:{type:"string"}, fin:{type:"string"}, todo_el_dia:{type:"boolean"}, fecha:{type:"string"}, lugar:{type:"string"}, notas:{type:"string"}, recordatorio_min:{type:"number"}}, required:["titulo"]},
    async run(a){ const ini = a.todo_el_dia ? pymd(a.fecha||String(a.inicio||"").slice(0,10)) : new Date(a.inicio); const r=await A.evento({titulo:a.titulo, ini, fin:a.fin, allDay:!!a.todo_el_dia, lugar:a.lugar, notas:a.notas, rec:a.recordatorio_min}); card({k:"evento", id:r.id, log:r.log}); return {ok:true, id:r.id, resumen:r.resumen, cruces:r.choques?.map(c=>c.titulo)}; }},
  {name:"mover_evento", description:"Cambia fecha/hora o título de un evento por id. inicio 'YYYY-MM-DDTHH:MM'.", parameters:{type:"object", properties:{id:{type:"string"}, inicio:{type:"string"}, fin:{type:"string"}, titulo:{type:"string"}}, required:["id"]},
    async run(a){ const c={}; if(a.inicio) c.ini=new Date(a.inicio).toISOString(); if(a.fin) c.fin=new Date(a.fin).toISOString(); if(a.titulo) c.titulo=a.titulo; const r=await A.editarEvento(a.id,c); card({k:"evento", id:a.id, log:r.log}); return {ok:true, resumen:r.resumen}; }},
  {name:"ver_agenda", description:"Eventos y tareas entre dos fechas YYYY-MM-DD (inclusive).", parameters:{type:"object", properties:{desde:{type:"string"}, hasta:{type:"string"}}, required:["desde"]},
    async run(a){ const h=a.hasta||a.desde; try{ if(Cal.ok()) await Cal.cargar(a.desde,h); }catch{} card({k:"agenda", desde:a.desde, hasta:h}); return {eventos:eventosEntre(a.desde,h).slice(0,40).map(e=>({id:e.id, titulo:e.titulo, dia:ymd(e.ini), hora:e.allDay?"todo el día":hhmm(e.ini)+"-"+hhmm(e.fin), tarea:!!e.tarea}))}; }},
  {name:"resumen_finanzas", description:"Totales de gastos e ingresos entre fechas, por categoría.", parameters:{type:"object", properties:{desde:{type:"string"}, hasta:{type:"string"}}, required:["desde","hasta"]},
    async run(a){ const ms=S.movimientos.filter(m=>m.estado==="registrado"&&m.fecha>=a.desde&&m.fecha<=a.hasta); const cat={}; ms.filter(m=>m.tipo==="gasto").forEach(m=>cat[m.categoria||"Otros"]=round2((cat[m.categoria||"Otros"]||0)+m.monto)); card({k:"dinero", desde:a.desde, hasta:a.hasta}); return {gastos:round2(sum(ms.filter(m=>m.tipo==="gasto"),m=>m.monto)), ingresos:round2(sum(ms.filter(m=>m.tipo==="ingreso"),m=>m.monto)), por_categoria:cat, presupuestos:S.profile.presupuestos}; }},
  {name:"recordar_dato", description:"Guarda un dato duradero sobre ella (gustos, personas, fechas, rutinas).", parameters:{type:"object", properties:{texto:{type:"string"}, tipo:{type:"string"}}, required:["texto"]},
    async run(a){ const r=await A.recordar(a); if(!r.dup) card({k:"mem", id:r.id, log:r.log}); return {ok:true, resumen:r.resumen}; }},
  {name:"corregir_dato", description:"Corrige el texto de un dato de su memoria por id, o lo olvida (olvidar:true).", parameters:{type:"object", properties:{id:{type:"string"}, nuevo_texto:{type:"string"}, olvidar:{type:"boolean"}}, required:["id"]},
    async run(a){ const r = a.olvidar ? await A.olvidar(a.id) : await A.corregirMemoria(a.id, a.nuevo_texto||""); card({k:"undo", log:r.log}); return {ok:true, resumen:r.resumen}; }},
  {name:"guardar_recuerdo", description:"Guarda un momento de su vida en su diario de Recuerdos, con sus propias palabras.", parameters:{type:"object", properties:{relato:{type:"string"}, titulo:{type:"string"}, emocion:{type:"string", enum:EMOS.map(e=>e[0])}, fecha:{type:"string"}}, required:["relato"]},
    async run(a){ const r=await A.recuerdo(a); card({k:"rec", id:r.id, log:r.log}); return {ok:true, resumen:r.resumen}; }},
  {name:"marcar_habito", description:"Marca un hábito como cumplido (fecha opcional YYYY-MM-DD).", parameters:{type:"object", properties:{nombre:{type:"string"}, fecha:{type:"string"}}, required:["nombre"]},
    async run(a){ const r=await A.habito(a.nombre, a.fecha||todayStr()); card({k:"habito", id:r.id, log:r.log}); return {ok:true, resumen:r.resumen}; }},
  {name:"crear_habito", description:"Crea un hábito nuevo.", parameters:{type:"object", properties:{nombre:{type:"string"}}, required:["nombre"]},
    async run(a){ const r=await A.nuevoHabito(a); card({k:"habito", id:r.id}); return {ok:true, resumen:r.resumen}; }},
  {name:"meta", description:"Crea (sin id) o actualiza (con id) una meta: titulo, proxima_accion, progreso 0-100, estado activa|pausada|lograda, avance (texto).", parameters:{type:"object", properties:{id:{type:"string"}, titulo:{type:"string"}, proxima_accion:{type:"string"}, progreso:{type:"number"}, estado:{type:"string"}, avance:{type:"string"}}},
    async run(a){ const r=await A.meta(a); card({k:"meta", id:r.id, log:r.log}); return {ok:true, resumen:r.resumen}; }},
  {name:"guardar_nota", description:"Guarda una nota o idea.", parameters:{type:"object", properties:{texto:{type:"string"}, tipo:{type:"string", enum:["nota","idea"]}}, required:["texto"]},
    async run(a){ const r=await A.nota(a); card({k:"nota", id:r.id, log:r.log}); return {ok:true}; }},
  {name:"registrar_animo", description:"Registra su ánimo de hoy: genial|bien|normal|cansada|estresada|triste.", parameters:{type:"object", properties:{estado:{type:"string", enum:MOODS.map(m=>m.k)}, nota:{type:"string"}}, required:["estado"]},
    async run(a){ await A.animo(a.estado, a.nota||""); return {ok:true}; }},
  {name:"deshacer", description:"Deshace la última acción.", parameters:{type:"object", properties:{}},
    async run(){ return undo(); }}
];
