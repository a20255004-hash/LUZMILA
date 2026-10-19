/* =========================================================
   SEGUIMIENTO DE COMPROMISOS · Mila entrenadora
   1.º aviso amable → 2.º más firme → 3.º insistente (y repite según la frecuencia).
   Nunca da algo por hecho sin tu confirmación. Respeta horas de silencio, descansos
   y el límite diario de avisos. En modo estricto se pone juguetonamente enojada.
   ========================================================= */
const COACH_FRASES = {
  1: [ (t,c)=>`${N()}, ¿cómo vas con «${t}»? Era para ${c}. ¿Ya está o lo movemos?`,
       (t,c)=>`Pasaba a recordarte «${t}» (${c}). ¿Lo marcamos como hecho?`,
       (t,c)=>`Oye, «${t}» quedó para ${c}. ¿Cómo te fue?` ],
  2: [ (t)=>`Sigo sin tu confirmación de «${t}». No lo doy por hecho hasta que me digas. ¿Hecho, más tarde o lo reorganizamos?`,
       (t)=>`${N()}, «${t}» sigue pendiente. Elige: lo hacemos ahora 10 minutos o lo reprogramamos con fecha real.`,
       (t)=>`Vuelvo con «${t}». Prefiero insistir a que se te pase. ¿Qué hacemos?` ],
  3: [ (t)=>`Tercera vez con «${t}». Me importa que lo cumplas. ¿Qué te está frenando? Puedo ayudarte a destrabarlo.`,
       (t)=>`«${t}» lleva rato esperando. Dime la verdad: ¿falta tiempo, ganas o algo te lo impide?`,
       (t)=>`No me voy a olvidar de «${t}», ${N()}. Hagamos un trato: 10 minutos ahora y luego decides.` ]
};
const COACH_ESTRICTA = {
  1: [ (t,c)=>`${N()}, «${t}» era para ${c}. ¿Ya lo hiciste o te lo tengo que recordar con más fuerza? 😏`,
       (t,c)=>`Toc, toc. «${t}» (${c}). Confírmame que está hecho. 🐼` ],
  2: [ (t)=>`${N()}, otra vez tenemos «${t}» pendiente 😤. Dijimos que hoy avanzaríamos. ¿Lo hacemos durante diez minutos o necesitas que reorganicemos el plan?`,
       (t)=>`Ejem. «${t}». Sigue. Ahí. 😤 ¿Hecho o lo reprogramamos ya mismo?` ],
  3: [ (t)=>`¡${N()}! 😤😤 «${t}» no se va a hacer solo. Diez minutos, cronómetro y sin excusas. ¿Arrancamos?`,
       (t)=>`Modo entrenadora activado: «${t}» va ${S.tareas.find(x=>x.titulo===t)?.seg?.posp||0} veces pospuesta. Hoy no se escapa. ¿Empezamos o me dices qué te lo impide?` ]
};
const Coach = {
  cfg(){ return {...DEFAULT_PROFILE.ajustes.coach, ...(S.profile.ajustes.coach||{})}; },
  enSilencio(d=new Date()){ const a=S.profile.ajustes.silencioDesde||"23:00", b=S.profile.ajustes.silencioHasta||"07:00"; const m=d.getHours()*60+d.getMinutes(); const [ah,am]=a.split(":").map(Number), [bh,bm]=b.split(":").map(Number); const A_=ah*60+am, B_=bh*60+bm; return A_<=B_ ? (m>=A_ && m<B_) : (m>=A_ || m<B_); },
  enDescanso(){ const d=S.profile.descanso; return !!(d && d.hasta > Date.now()); },
  vence(t){ if(!t.vence) return null; return t.hora ? new Date(`${t.vence}T${t.hora}:00`) : (()=>{ const d=pymd(t.vence); d.setHours(19,0,0,0); return d; })(); },
  candidatas(){ const ahora=Date.now(), g=this.cfg().gracia*60000; return S.tareas.filter(t=>t.estado!=="hecha" && t.vence && !t.seg?.pausa && this.vence(t) && this.vence(t).getTime()+g<=ahora).sort((a,b)=>this.vence(a)-this.vence(b)); },
  pendientes(){ return this.candidatas().filter(t=>(t.seg?.nivel||0)>=1); },
  cuenta(){ const k="mila-coach-"+todayStr(); try{ return Number(localStorage.getItem(k)||0); }catch{ return 0; } },
  sumar(){ const k="mila-coach-"+todayStr(); try{ localStorage.setItem(k, String(this.cuenta()+1)); }catch{} },
  cuandoTxt(t){ const d=this.vence(t); return (sameDay(d,new Date())?"hoy":relDia(d)) + (t.hora?" a las "+h12(d):""); },
  // ¿qué le pasa? procrastinación, sobrecarga u obstáculo (y su ánimo de hoy) → adapta el tono
  lectura(t){
    const hoy=todayStr(); const venc=S.tareas.filter(x=>x.estado!=="hecha"&&x.vence&&x.vence<hoy).length, hoyN=S.tareas.filter(x=>x.estado!=="hecha"&&x.vence===hoy).length;
    const a=S.animo.find(x=>x.id===hoy); const bajo = a && ["triste","cansada","estresada"].includes(a.estado);
    if(t?.seg?.motivo==="obstaculo") return "obstaculo";
    if(venc>=5 || hoyN>=7) return "sobrecarga";
    if(bajo) return "bajo";
    if((t?.seg?.posp||0)>=2 || (t?.seg?.nivel||0)>=3) return "procrastinacion";
    return "normal";
  },
  texto(t, nivel){
    const c=this.cfg(); const lec=this.lectura(t);
    if(lec==="sobrecarga") return `${N()}, «${t.titulo}» sigue pendiente, pero veo que tienes muchísimo encima. No es flojera: es demasiada carga. ¿Lo pasamos a un día más liviano o lo partimos en un paso chiquito?`;
    if(lec==="bajo") return `Sé que hoy no es tu mejor día, ${N()}. «${t.titulo}» puede esperar un poquito o hacerse en versión mini (5 minutos). Tú decides; aquí estoy.`;
    if(lec==="obstaculo") return `«${t.titulo}» tenía un obstáculo: «${t.seg?.obstaculo||"algo externo"}». ¿Ya se resolvió? Si no, lo reprogramamos sin culpa.`;
    const banco = (c.estricto ? COACH_ESTRICTA : COACH_FRASES)[Math.min(3,nivel)];
    return pick(banco)(t.titulo, this.cuandoTxt(t));
  },
  emo(t, nivel){ const lec=this.lectura(t); if(lec==="bajo"||lec==="sobrecarga") return "empatica"; if(lec==="obstaculo") return "pensativa"; if(this.cfg().estricto && nivel>=2) return "enojada"; return nivel===1?"alegre":nivel===2?"pensativa":"preocupada"; },
  async tick(){
    const c=this.cfg(); if(!c.activo || !S.loaded.tareas) return;
    this.ciclo(); this.calendario().catch(()=>{});
    if(this.enDescanso() || this.enSilencio() || this.cuenta()>=c.maxDia) return;
    const ahora=Date.now();
    for(const t of this.candidatas()){
      const seg=t.seg||{}; const nivel=Math.min(3,(seg.nivel||0)+1);
      if(seg.prox && ahora<seg.prox) continue;
      const espera = (c.intervalos[Math.min(nivel,3)-1]||60)*60000;
      await Store.update("tareas", t.id, {seg:{...seg, nivel, prox:ahora+espera, avisos:(seg.avisos||0)+1, ultimo:ahora}});
      this.sumar(); this.avisar({...t, seg:{...seg, nivel}}, nivel); break;
    }
  },
  avisar(t, nivel){
    const txt=this.texto(t, nivel), emo=this.emo(t, nivel);
    Mila.set(nivel>=3&&this.cfg().estricto?"enojada":"idle", emo);
    this.banner(t, txt, emo, nivel);
    S.chat.push({r:"a", t:txt, ts:Date.now(), emo, chips:[{l:"✓ Ya lo hice", say:`#coach hecho ${t.id}`},{l:"Posponer 1 h", say:`#coach posponer60 ${t.id}`},{l:"Para mañana", say:`#coach manana ${t.id}`},{l:"Necesito ayuda", say:`#coach ayuda ${t.id}`}]}); Store.saveChat(); pintarChat();
    if(S.profile.ajustes.hablar && !document.hidden) Voz.decir(txt).catch?.(()=>{});
    if(this.cfg().sistema && (document.hidden || !document.hasFocus())) notificar(nivel>=2?"Mila insiste 🐼":"Mila 🐼", txt, {tag:"coach-"+t.id, tid:t.id, acciones:true});
    haptic([60,40,60]);
  },
  banner(t, txt, emo, nivel){
    const b=$("#coachBanner"); if(!b) return;
    b.className = `coach-banner niv${nivel} ${this.cfg().estricto?"estricta":""}`;
    b.innerHTML = `<span class="cb-mila mila-host" data-emo="${emo}"></span><div class="cb-t"><small>${nivel===1?"Recordatorio":nivel===2?"Segundo aviso":"Mila insiste"}${this.cfg().estricto?" · modo entrenadora":""}</small><p>${esc(txt)}</p>
      <div class="cb-acc"><button type="button" class="btn sm pri" data-act="coachHecho" data-id="${t.id}">${ICON.check} Hecho</button><button type="button" class="btn sm" data-act="coachPosponer" data-id="${t.id}" data-v="60">${ICON.snooze} 1 h</button><button type="button" class="btn sm" data-act="coachPosponer" data-id="${t.id}" data-v="manana">Mañana</button><button type="button" class="btn sm" data-act="coachReprogramar" data-id="${t.id}">${ICON.cal} Reprogramar</button><button type="button" class="btn sm ghost" data-act="coachAyuda" data-id="${t.id}">${ICON.help} Ayuda</button></div></div>
      <button type="button" class="ib sm cb-x" data-act="coachCerrar" title="Ocultar (seguiré pendiente)">${ICON.x}</button>`;
    b.querySelector(".mila-host").innerHTML = milaSVG({emo, estado:nivel>=3&&this.cfg().estricto?"enojada":"idle"});
    b.hidden=false; requestAnimationFrame(()=>b.classList.add("show"));
  },
  ocultar(){ const b=$("#coachBanner"); if(!b) return; b.classList.remove("show"); setTimeout(()=>b.hidden=true, 300); },
  async hecho(id){
    const t=S.tareas.find(x=>x.id===id); if(!t) return {ok:false, resumen:"Esa tarea ya no existe."};
    await this.quitarCal(t);
    const r = await A.editarTarea(id, {estado:"hecha"}); await Store.update("tareas", id, {seg:null});
    this.ocultar(); Mila.celebrar(); const p=t.seg?.posp||0;
    const txt = p>=2 ? `¡${N()}! Después de ${p} intentos, «${t.titulo}» está HECHA. Eso es retomar después de fallar: vale doble. 🎉` : pick([`¡Eso, ${N()}! «${t.titulo}» lista. Estoy orgullosa de ti. 🎉`, `¡Tachada! «${t.titulo}» ya no te pesa. 🐼💜`, `¡Hecho! Una menos. Así se construye la constancia.`]);
    return {ok:true, log:r.log, resumen:txt};
  },
  async posponer(id, v){
    const t=S.tareas.find(x=>x.id===id); if(!t) return {ok:false, resumen:"Esa tarea ya no existe."};
    const seg={...(t.seg||{})}; seg.posp=(seg.posp||0)+1; seg.nivel=Math.max(0,(seg.nivel||1)-1);
    let txt;
    if(v==="manana"){ const nv=ymd(addDays(new Date(),1)); await A.editarTarea(id, {vence:nv}); seg.prox=0; seg.nivel=0; await this.quitarCal(t); txt=`Listo, «${t.titulo}» pasa a mañana${t.hora?" a las "+t.hora:""}. Te lo recordaré.`; }
    else { const min=Number(v)||60; seg.prox=Date.now()+min*60000; txt=`Ok, te lo vuelvo a recordar en ${min>=60?plural(min/60,"hora","horas"):min+" minutos"}. Ni un minuto más 😉`; }
    await Store.update("tareas", id, {seg}); this.ocultar();
    if(seg.posp>=3) txt += ` Ojo: ya van ${seg.posp} veces. ¿Me cuentas qué pasa con esta?`;
    return {ok:true, resumen:txt, preguntar:seg.posp>=3};
  },
  async motivo(id, tipo, detalle=""){
    const t=S.tareas.find(x=>x.id===id); if(!t) return R("Esa tarea ya no existe.");
    const seg={...(t.seg||{}), motivo:tipo};
    if(tipo==="procrastinacion"){ seg.prox=Date.now()+15*60000; await Store.update("tareas", id, {seg}); Coach.foco(id, 10);
      return R(`Te entiendo: a veces lo que más evitamos es lo que más pesa. Trato: solo 10 minutos con «${t.titulo}». Arranqué el cronómetro; cuando suene decides si sigues. Zombie no decide, decide ${N()}. 💪`, {emo:"animada"}); }
    if(tipo==="sobrecarga"){
      const dias=[...Array(7)].map((_,k)=>{ const d=ymd(addDays(new Date(),k+1)); return {d, n:S.tareas.filter(x=>x.estado!=="hecha"&&x.vence===d).length + eventosEntre(d,d,{tareas:false}).length}; }).sort((a,b)=>a.n-b.n)[0];
      seg.prox=0; seg.nivel=0; await Store.update("tareas", id, {seg}); await A.editarTarea(id, {vence:dias.d, prioridad: t.prioridad==="alta"?"alta":"media"}); await this.quitarCal(t);
      return R(`Tienes razón, es demasiado para un día. Moví «${t.titulo}» para ${relDia(dias.d)}, que es tu día más liviano (${plural(dias.n,"cosa","cosas")}). ¿Quieres que también lo parta en pasos pequeños?`, {emo:"empatica", chips:[{l:"Sí, divídelo", say:`#coach dividir ${id}`},{l:"Así está bien", say:"gracias"}]}); }
    if(tipo==="obstaculo"){ seg.obstaculo=detalle||"algo externo"; seg.prox=Date.now()+24*3600000; await Store.update("tareas", id, {seg, notas:(t.notas?t.notas+"\n":"")+"Obstáculo: "+(detalle||"(sin detalle)")});
      return R(`Gracias por contarme. Anoté el obstáculo en la tarea y no te voy a insistir por 24 horas. ${detalle?`¿Creo una tarea para destrabarlo («Resolver: ${detalle}»)?`:"Si me dices qué te lo impide, te ayudo a destrabarlo."}`, {emo:"empatica", chips: detalle?[{l:"Sí, créala", say:`agrega tarea resolver ${detalle} para mañana`},{l:"No hace falta", say:"gracias"}]:[]}); }
    return R("Entendido.");
  },
  async dividir(id){ const t=S.tareas.find(x=>x.id===id); if(!t) return R("Esa tarea ya no existe.");
    const pasos=[`Primer paso (10 min): abrir y revisar ${t.titulo.toLowerCase()}`, `Avanzar 25 min en ${t.titulo.toLowerCase()}`, `Cerrar y revisar ${t.titulo.toLowerCase()}`];
    for(const [k,p] of pasos.entries()) await A.tarea({titulo:p, vence:t.vence||todayStr(), area:t.area, prioridad:k===0?"alta":"media"});
    return R(`Listo, lo dividí en 3 pasos pequeños para ${relDia(t.vence||todayStr())}. El primero es de solo 10 minutos.`, {emo:"alegre", cards:[{k:"lista", titulo:"Pasos", items:pasos}]}); },
  /* cronómetro de 10 minutos */
  foco(id, min=10){ const t=S.tareas.find(x=>x.id===id); this.focoFin = Date.now()+min*60000; this.focoT && clearInterval(this.focoT);
    const b=$("#coachBanner"); const pinta=()=>{ const s=Math.max(0, Math.round((this.focoFin-Date.now())/1000)); if(!b) return;
      b.className="coach-banner foco show"; b.hidden=false; b.innerHTML=`<span class="cb-mila mila-host"></span><div class="cb-t"><small>Modo foco · ${esc(t?.titulo||"")}</small><p class="foco-t">${Math.floor(s/60)}:${pad(s%60)}</p><div class="cb-acc"><button type="button" class="btn sm pri" data-act="coachHecho" data-id="${id}">${ICON.check} Terminé</button><button type="button" class="btn sm" data-act="focoParar">Parar</button></div></div>`;
      if(!b.querySelector(".mila-host").firstChild) b.querySelector(".mila-host").innerHTML=milaSVG({emo:"escuchando"});
      if(s<=0){ clearInterval(this.focoT); this.focoT=null; Mila.momento("orgullosa"); notificar("Mila 🐼", `¡10 minutos cumplidos con «${t?.titulo||"tu tarea"}»! ¿Seguimos o lo marcamos?`, {tag:"foco"}); b.querySelector(".foco-t").textContent="¡Tiempo!"; Voz.decir(`¡Lo lograste, ${N()}! Diez minutos. ¿Seguimos o lo marcamos como hecho?`).catch?.(()=>{}); } };
    pinta(); this.focoT=setInterval(pinta, 1000); },
  /* avisos al celular aunque Mila esté cerrada: un evento de Google Calendar con 3 recordatorios escalonados */
  async calendario(){
    const c=this.cfg(); if(!c.celular || !Cal.ok() || this._calOcupado) return; this._calOcupado=true;
    try{
      const ahora=new Date(); const lim=addDays(ahora,2);
      for(const t of S.tareas){
        if(t.estado==="hecha" || !t.vence || !t.hora || t.seg?.calId) continue;
        const d=this.vence(t); if(!d || d<addMin(ahora,-30) || d>lim) continue;
        const [i1,i2] = c.intervalos; const total=i1+i2; const ini=addMin(d,total);
        const p = await Cal.call("create_event", { summary:`🔔 Mila: ¿hiciste «${t.titulo}»?`, startTime:isoLocal(ini), endTime:isoLocal(addMin(ini,10)),
          description:`Recordatorio de seguimiento de ${S.profile.asistente}. Confírmalo en la app; si ya lo hiciste, márcalo y este aviso desaparece.`,
          overrideReminders:[{method:"popup", minutes:total},{method:"popup", minutes:total-i1},{method:"popup", minutes:0}], availability:"AVAILABILITY_FREE",
          extendedProperties:{private:{milaSeg:t.id}} });
        const ev=p?.event||p||{}; if(ev.id) await Store.update("tareas", t.id, {seg:{...(t.seg||{}), calId:ev.id, calAt:isoLocal(d)}});
      }
      // si cambió la hora de una tarea, rehace su aviso
      for(const t of S.tareas){ if(t.seg?.calId && (t.estado==="hecha" || !t.vence || !t.hora || t.seg.calAt!==isoLocal(this.vence(t)))) await this.quitarCal(t); }
    } finally { this._calOcupado=false; }
  },
  async quitarCal(t){ const id=t?.seg?.calId; if(!id) return; try{ if(Cal.ok()) await Cal.call("delete_event", {eventId:id}); }catch{} S.cal.events.delete(id); const cur=S.tareas.find(x=>x.id===t.id); if(cur) await Store.update("tareas", t.id, {seg:{...(cur.seg||{}), calId:null, calAt:null}}).catch(()=>{}); },
  /* recordatorio discreto del ciclo (solo si lo activaste) */
  ciclo(){
    const cc=S.profile.ciclo||{}; if(!cc.recordar || typeof cicloStats!=="function") return;
    const st=cicloStats(); if(!st.prox) return; const falta=diffDays(new Date(), st.prox.ini);
    const k="mila-ciclo-av-"+ymd(st.prox.ini); try{ if(localStorage.getItem(k)) return; }catch{}
    if(falta<=(Number(cc.diasAntes)||2) && falta>=0 && !this.enSilencio()){
      try{ localStorage.setItem(k,"1"); }catch{}
      const txt = cc.mostrarTexto ? `Según tus registros, tu periodo podría llegar ${falta?`en unos ${falta} días`:"hoy"} (es una estimación).` : "Tienes un recordatorio privado en Mi ciclo.";
      notificar("Mila 🐼", txt, {tag:"ciclo"}); toast(cc.mostrarTexto?txt:"Tienes un recordatorio privado en Mi ciclo", {icon:ICON.lock, ms:6000});
    }
  },
  /* mensaje personalizado para el inicio, según tus metas y avances reales */
  mensaje(){
    const hoy=todayStr(); const hechas7=S.tareas.filter(x=>x.hecha_en && Date.now()-x.hecha_en<7*86400000).length;
    const metas=S.metas.filter(g=>g.estado==="activa"); const lograda=S.metas.filter(g=>g.estado==="lograda").length;
    const habR = S.habitos.map(h=>[h, racha(h)]).sort((a,b)=>b[1]-a[1])[0];
    const pend=this.pendientes();
    if(this.enDescanso()) return {emo:"carinosa", t:`Estás en modo descanso${S.profile.descanso?.motivo?` (${S.profile.descanso.motivo})`:""}. Hoy no te voy a insistir. Descansar también es avanzar. 💜`};
    if(pend.length) return {emo:this.cfg().estricto?"enojada":"pensativa", t:this.cfg().estricto?`${N()}, tienes ${plural(pend.length,"compromiso","compromisos")} sin confirmar 😤. Empecemos por «${pend[0].titulo}».`:`Tienes ${plural(pend.length,"compromiso","compromisos")} esperando tu confirmación. ¿Empezamos por «${pend[0].titulo}»?`, tid:pend[0].id};
    if(habR && habR[1]>=3) return {emo:"orgullosa", t:`¡${habR[1]} días seguidos con «${habR[0].nombre}»! Eso es exactamente la constancia que buscabas.`};
    if(hechas7>=5) return {emo:"animada", t:`Esta semana completaste ${hechas7} tareas. Mira lo que eres capaz de hacer cuando te organizas. 🐼`};
    if(lograda) return {emo:"orgullosa", t:`Ya lograste ${plural(lograda,"meta","metas")}. Esto también cuenta: va al Expediente.`};
    if(metas[0]) return {emo:"alegre", t:`Tu foco: «${metas[0].titulo}». ${metas[0].proxima_accion?`Próximo paso: ${metas[0].proxima_accion}.`:"¿Cuál sería el siguiente paso chiquito?"}`};
    return null;
  }
};
window.Coach = Coach;
function notificar(titulo, cuerpo, {tag="mila", tid="", acciones=false}={}){
  try{
    if(!("Notification" in window) || Notification.permission!=="granted") return false;
    const op = {body:cuerpo, icon:"icon.svg", badge:"icon.svg", tag, renotify:true, data:{tid, url:location.href.split("#")[0]}, ...(acciones?{actions:[{action:"hecho", title:"✓ Hecho"},{action:"posponer", title:"Posponer 1 h"}], requireInteraction:true}:{})};
    if(navigator.serviceWorker?.controller) navigator.serviceWorker.ready.then(r=>r.showNotification(titulo, op)).catch(()=>{ new Notification(titulo, op); });
    else new Notification(titulo, op);
    return true;
  }catch{ return false; }
}
