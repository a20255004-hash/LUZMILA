/* =========================================================
   Conversación con Mila (panel lateral en escritorio,
   pantalla completa en el celular)
   ========================================================= */
function tarjetaChat(c){
  const und = c.log && S.registro.find(l=>l.id===c.log && l.estado!=="deshecho") ? `<button type="button" class="mini-btn" data-act="undo" data-id="${c.log}">${ICON.undo}Deshacer</button>` : "";
  switch(c.k){
    case "mov": { const m=S.movimientos.find(x=>x.id===c.id); if(!m) return und?`<div class="cc cc-gone">Eliminado ${und}</div>`:""; return `<div class="cc cc-mov" style="--c:${m.tipo==="ingreso"?"#1FA97A":colorCat(m.categoria)}"><span class="cc-ic">${m.tipo==="ingreso"?"＋":(CAT_IC[m.categoria]||"•")}</span><div class="grow"><b>${m.tipo==="ingreso"?"+":"−"}${money(m.monto)}</b><small>${esc(m.concepto)} · ${esc(m.tipo==="ingreso"?(m.fuente||"Ingreso"):m.categoria)} · ${esc(m.metodo)} · ${relDia(m.fecha)}</small></div><span class="cc-acc"><button type="button" class="mini-btn" data-act="movEditar" data-id="${m.id}">${ICON.edit}Corregir</button>${und}</span></div>`; }
    case "tarea": { const x=S.tareas.find(y=>y.id===c.id); if(!x) return und?`<div class="cc cc-gone">Tarea eliminada ${und}</div>`:""; return `<div class="cc cc-tarea">${itemTarea(x,{compacto:true})}${und?`<span class="cc-acc">${und}</span>`:""}</div>`; }
    case "tareas": return `<div class="cc cc-lista"><div class="lista-tareas">${c.ids.map(id=>S.tareas.find(x=>x.id===id)).filter(Boolean).map(x=>itemTarea(x,{compacto:true})).join("")}</div></div>`;
    case "evento": { const e=buscarEvento(c.id); if(!e) return und?`<div class="cc cc-gone">Evento eliminado ${und}</div>`:""; return `<div class="cc cc-ev" style="--c:${catColor(e.cat)}" data-act="evAbrir" data-id="${esc(e.id)}"><span class="cc-fecha"><b>${e.ini.getDate()}</b><small>${MESES[e.ini.getMonth()].slice(0,3)}</small></span><div class="grow"><b>${esc(e.titulo)}</b><small>${capital(relDia(e.ini))} · ${e.allDay?"todo el día":hhmm(e.ini)+" – "+hhmm(e.fin)}${e.src==="g"?" · Google Calendar":""}</small></div><span class="cc-acc">${und}</span></div>`; }
    case "mem": { const m=S.memorias.find(x=>x.id===c.id); if(!m) return ""; return `<div class="cc cc-mem"><span class="cc-ic">${ICON.spark}</span><div class="grow"><small>Mila recuerda</small><b>${esc(m.texto)}</b></div><span class="cc-acc"><button type="button" class="mini-btn" data-act="memEditar" data-id="${m.id}">${ICON.edit}</button>${und}</span></div>`; }
    case "rec": { const r=S.recuerdos.find(x=>x.id===c.id); if(!r) return ""; return `<div class="cc cc-rec" style="--c:${emoColor(r.emocion)}" data-act="recAbrir" data-id="${r.id}"><span class="rc-emo">${emoLabel(r.emocion)}</span><b>${esc(r.titulo)}</b><small>Guardado en tu diario · ${r.fecha?relDia(r.fecha):""}</small>${und?`<span class="cc-acc">${und}</span>`:""}</div>`; }
    case "habito": { const h=S.habitos.find(x=>x.id===c.id); if(!h) return ""; const r=racha(h); return `<div class="cc cc-hab"><span class="hab-ic">${HAB_IC[h.icono]||ICON.leaf}</span><div class="grow"><b>${esc(h.nombre)}</b><small>${r?`${plural(r,"día","días")} seguidos`:"Nuevo hábito"}</small></div>${und}</div>`; }
    case "habitos": return `<div class="cc"><div class="habs">${S.habitos.map(x=>`<button type="button" class="hab ${x.registros?.[todayStr()]?"on":""}" data-act="habToggle" data-id="${x.id}"><span class="hab-ic">${HAB_IC[x.icono]||ICON.leaf}</span><span class="hab-n">${esc(x.nombre)}</span></button>`).join("")}</div></div>`;
    case "meta": { const g=S.metas.find(x=>x.id===c.id); if(!g) return ""; return `<div class="cc cc-meta"><b>${esc(g.titulo)}</b>${barraProg((g.progreso||0)/100)}<small>${g.progreso||0}% · ${g.proxima_accion?"Próximo: "+esc(g.proxima_accion):"Sin próximo paso"}</small>${und}</div>`; }
    case "nota": { const n=S.notas.find(x=>x.id===c.id); if(!n) return ""; return `<div class="cc cc-nota"><span class="cc-ic">${ICON.edit}</span><p>${esc(n.texto)}</p>${und}</div>`; }
    case "undo": return und ? `<div class="cc cc-undo">${und}</div>` : "";
    case "agenda": { const evs=eventosEntre(c.desde, c.hasta).filter(e=>!e.alerta).slice(0,7); return `<div class="cc cc-agenda">${evs.length?evs.map(e=>`<div class="cca-ev" style="--c:${catColor(e.cat)}" data-act="evAbrir" data-id="${esc(e.id)}"><span>${c.desde===c.hasta?"":DIAS_C[e.ini.getDay()]+" "}${e.allDay?"día":hhmm(e.ini)}</span><b>${esc(e.titulo)}</b></div>`).join(""):`<small>Sin eventos</small>`}<button type="button" class="mini-btn" data-act="agendaDia" data-v="${c.desde}">${ICON.cal}Abrir agenda</button></div>`; }
    case "dinero": { const ms=S.movimientos.filter(m=>m.estado==="registrado"&&m.fecha>=c.desde&&m.fecha<=c.hasta); const g=sum(ms.filter(m=>m.tipo==="gasto"),m=>m.monto), i=sum(ms.filter(m=>m.tipo==="ingreso"),m=>m.monto);
      const cats=Object.entries(groupBy(ms.filter(m=>m.tipo==="gasto"),m=>m.categoria||"Otros")).map(([k,l])=>[k,sum(l,m=>m.monto)]).sort((a,b)=>b[1]-a[1]).slice(0,4);
      return `<div class="cc cc-din"><div class="din-kpis"><div><small>Gastos</small><b class="neg">${money0(g)}</b></div><div><small>Ingresos</small><b class="pos">${money0(i)}</b></div><div><small>Balance</small><b>${money0(i-g)}</b></div></div>${cats.map(([k,v])=>`<div class="barra-area"><span>${esc(k)}</span>${barraProg(v/Math.max(1,g), colorCat(k))}<b>${money0(v)}</b></div>`).join("")}<button type="button" class="mini-btn" data-act="ir" data-v="dinero">${ICON.wallet}Ver Dinero</button></div>`; }
    case "plan": return `<div class="cc cc-plan">${c.bloques.map(b=>`<div class="pl-b"><span>${b.hora}</span><b>${esc(b.titulo)}</b><small>${b.dur} min</small></div>`).join("")}</div>`;
  }
  return "";
}
function pintarChat(soloSiAbierto){
  const log=$("#chatlog"); if(!log) return; if(soloSiAbierto && !S.ui.chatOpen && innerWidth<1280) return;
  const ult = S.chat.length-1;
  const msgs = S.chat.slice(-50);
  if(!msgs.length){ log.innerHTML = `<div class="chat-vacio"><div class="mila-host" data-size="120"></div><h3>Hola, ${esc(N())}</h3><p>Soy ${esc(S.profile.asistente)}. Háblame como a una amiga: registro tus gastos, organizo tu agenda, guardo tus recuerdos y te ayudo a cumplir lo que te propones.</p></div>`; }
  else log.innerHTML = msgs.map((m,i)=>{ const idx = S.chat.length-msgs.length+i; if(m.r==="u") return `<div class="msg u"><p>${esc(etiquetaUsuario(m.t))}</p></div>`;
    const cards = (m.cards||[]).map(tarjetaChat).join(""); const chips = idx===ult && m.chips?.length ? `<div class="msg-chips">${m.chips.map(ch=>`<button type="button" class="chip" data-act="decir" data-v="${esc(ch.say)}">${esc(ch.l)}</button>`).join("")}</div>` : "";
    return `<div class="msg a ${m.typing?"typing":""}"><span class="msg-av">${milaSVG({emo:m.emo||"alegre"})}</span><div class="msg-b">${m.typing?`<p class="dots"><i></i><i></i><i></i></p>`:`<p>${esc(m.t)}</p>`}${cards}${chips}</div></div>`; }).join("");
  for(const s of log.querySelectorAll(".mila-host")) s.innerHTML = milaSVG({emo:"alegre"});
  log.scrollTop = log.scrollHeight;
  const sug=$("#sug"); if(sug) sug.innerHTML = sugerenciasChat().map(x=>`<button type="button" class="chip" data-act="decir" data-v="${esc(x)}">${esc(x)}</button>`).join("");
  const est=$("#chatEstado"); if(est) est.textContent = S.busy ? "Pensando…" : Oido.activo ? "Escuchando…" : (IA.lista() ? "Inteligencia completa · "+(PROVEEDORES[IA.cfg().prov]?.n||"") : "Cerebro local · gratis");
}
function sugerenciasChat(){
  const h=new Date().getHours(); const out=[];
  if(S.chat.length<2) out.push(h<12?"¿Qué tengo hoy?":"¿Qué tengo mañana?");
  if(tareasDeHoy().length>2) out.push("Organiza mi día");
  if(Coach.pendientes().length) out.push("Ya lo hice"); out.push("Gasté 5 soles en pasaje"); if(h>=16) out.push("Motívame");
  if(h>=19) out.push("¿Cuánto gasté este mes?");
  out.push("Guarda en recuerdos que…");
  return out.slice(0,4);
}
async function enviar(texto){
  texto = String(texto||"").trim(); if(!texto || S.busy) return;
  if(texto==="#ajustes-ia"){ go("ajustes"); setTimeout(()=>$("#aj-ia")?.scrollIntoView({behavior:"smooth"}),200); return; }
  if(texto.endsWith("…")){ const q=$("#q"); q.value = texto.replace(/…$/," "); q.focus(); return; }
  Voz.parar(); abrirChat(true);
  S.chat.push({r:"u", t:texto, ts:Date.now()}); const turno = {r:"a", t:"", ts:Date.now(), typing:true, emo:"pensativa"}; S.chat.push(turno);
  S.busy=true; Mila.set("pensando","pensativa"); pintarChat();
  let r; try{ r = await responder(texto); }catch(e){ console.error(e); r = R("Uy, algo falló: "+errMsg(e), {emo:"preocupada"}); }
  Object.assign(turno, {t:r.t, emo:r.emo, cards:r.cards||[], chips:r.chips||[], typing:false});
  S.busy=false; const em=r.emo||"alegre"; Mila.set(em==="enojada"?"enojada":em==="animada"?"celebra":"idle", em); if(em==="enojada"||em==="animada") setTimeout(()=>{ if(Mila.emo===em) Mila.set("idle", em==="enojada"?"pensativa":"alegre"); }, 3200);
  pintarChat(); render();
  Store.saveChat().catch(()=>{});
  if(!r.privado) Voz.decir(r.t);
}
function autoAlto(el){ el.style.height="auto"; el.style.height = Math.min(140, el.scrollHeight)+"px"; }
const COACH_ETQ = {hecho:"✓ Ya lo hice", posponer60:"Posponer 1 hora", posponer15:"Posponer 15 min", manana:"Para mañana", ayuda:"Necesito ayuda", procrastinacion:"No tengo ganas, lo estoy evitando", sobrecarga:"Tengo demasiado", obstaculo:"Algo me lo impide", dividir:"Divídelo en pasos"};
function etiquetaUsuario(t){ const m=String(t||"").match(/^#coach (\w+)/); return m ? (COACH_ETQ[m[1]]||"Ok") : t; }