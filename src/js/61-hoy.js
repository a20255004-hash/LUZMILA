/* =========================================================
   INICIO · centro de mando del día
   ========================================================= */
function avisosMila(){
  const out=[]; const hoy=todayStr(); const ahora=new Date(); const h=ahora.getHours();
  const venc = S.tareas.filter(x=>x.estado!=="hecha" && x.vence && x.vence<hoy);
  if(venc.length) out.push({p:9, emo:"preocupada", t:`Tienes ${plural(venc.length,"tarea atrasada","tareas atrasadas")}. No pasa nada; reubiquémosla${venc.length>1?"s":""} para que no te pesen.`, acc:[["Pasarlas a hoy","say","pasa mis tareas vencidas para hoy"],["A mañana","say","pasa mis tareas vencidas para mañana"]]});
  const prox = eventosEntre(hoy, hoy, {tareas:false}).find(e=>!e.allDay && e.ini>ahora && (e.ini-ahora)<75*60000);
  if(prox) out.push({p:10, emo:"animada", t:`En ${cuentaAtras(prox.ini).replace("en ","")} empieza «${prox.titulo}». ${prox.lugar?"Es en "+prox.lugar+". ":""}¡Tú puedes!`, acc:[["Ver en agenda","go","agenda"]]});
  const ts = tareasDeHoy(); const hechasHoy = S.tareas.filter(x=>x.hecha_en && ymd(new Date(x.hecha_en))===hoy).length;
  if(!venc.length && ts.length>=5) out.push({p:6, emo:"pensativa", t:`Hoy tienes ${ts.length} tareas: es bastante. ¿Armamos un plan en bloques para que fluya?`, acc:[["Organiza mi día","say","organiza mi día"]]});
  if(hechasHoy>=3) out.push({p:5, emo:"animada", t:`¡Ya completaste ${hechasHoy} tareas hoy! Eso es constancia, ${N()}.`});
  const habP = S.habitos.filter(x=>!x.registros?.[hoy]); if(h>=19 && habP.length && S.habitos.length) out.push({p:6, emo:"alegre", t:`Te ${habP.length===1?"falta":"faltan"} ${habP.map(x=>"«"+x.nombre+"»").slice(0,2).join(" y ")} hoy. Aún estás a tiempo de mantener la racha.`});
  if(h>=18 && !S.animo.some(a=>a.id===hoy)) out.push({p:4, emo:"escuchando", t:"¿Cómo te sentiste hoy? Tócame una carita y lo guardo.", acc:[["Registrar ánimo","sheet","animo"]]});
  const mes=hoy.slice(0,7); const {g,i}=totalesMes(mes); if(i && g>i) out.push({p:7, emo:"preocupada", t:`Este mes gastaste ${money0(g)} y entraron ${money0(i)}. ¿Revisamos en qué se fue?`, acc:[["Ver mis finanzas","go","dinero"]]});
  for(const [c,lim] of Object.entries(S.profile.presupuestos||{})){ const u = sum(S.movimientos.filter(m=>m.tipo==="gasto"&&m.categoria===c&&m.fecha?.startsWith(mes)),m=>m.monto); if(lim && u>lim){ out.push({p:6, emo:"preocupada", t:`Pasaste tu presupuesto de ${c}: ${money0(u)} de ${money0(lim)}.`, acc:[["Ver Dinero","go","dinero"]]}); break; } }
  const meta = S.metas.filter(x=>x.estado==="activa" && x.ultima_vez && diffDays(pymd(x.ultima_vez), new Date())>=7)[0];
  if(meta) out.push({p:5, emo:"pensativa", t:`Hace ${diffDays(pymd(meta.ultima_vez), new Date())} días que no avanzas en «${meta.titulo}». ¿Un paso chiquito hoy?${meta.proxima_accion?` Por ejemplo: ${meta.proxima_accion}.`:""}`, acc:[["Agregarlo a hoy","say",`agrega tarea ${meta.proxima_accion||meta.titulo} para hoy`]]});
  if(Coach.cfg().estricto){ for(const o of out) if(o.emo==="preocupada") o.emo="enojada"; }
  if(!out.length){ out.push({p:1, emo:"alegre", t: ts.length ? `Lo más importante hoy: «${priorizar(ts)[0].titulo}». Empecemos por ahí.` : pick([`Día despejado, ${N()}. Buen momento para avanzar tu tesis o descansar sin culpa.`, "Todo en orden. ¿Quieres que planifiquemos algo bonito para hoy?"]) }); }
  return out.sort((a,b)=>b.p-a.p);
}
function lineaDia(fecha=todayStr(), {desde=6, hasta=24}={}){
  const evs = eventosEntre(fecha, fecha).filter(e=>!e.allDay && !e.alerta); const span=(hasta-desde)*60;
  const pos = d => clamp(((d.getHours()*60+d.getMinutes()) - desde*60)/span*100, 0, 100);
  const ahora = new Date(); const ahoraP = sameDay(pymd(fecha), ahora) ? pos(ahora) : null;
  const bloques = evs.map(e=>{ const a=pos(e.ini), b=pos(e.fin); return `<div class="ld-b ${e.tarea?"tarea":""}" style="left:${a}%;width:${Math.max(1.4,b-a)}%;--c:${catColor(e.cat)}" ${tipAttr(`${hhmm(e.ini)}–${hhmm(e.fin)} · ${e.titulo}`)} data-act="evAbrir" data-id="${esc(e.id)}"></div>`; }).join("");
  const marcas = [6,9,12,15,18,21,24].filter(x=>x>=desde&&x<=hasta).map(x=>`<span style="left:${(x-desde)/(hasta-desde)*100}%">${x===24?"0":x}h</span>`).join("");
  return `<div class="linea-dia"><div class="ld-track">${bloques}${ahoraP!=null?`<i class="ld-ahora" style="left:${ahoraP}%"></i>`:""}</div><div class="ld-marcas">${marcas}</div></div>`;
}
function itemTarea(x, {compacto=false}={}){
  const hoy=todayStr(); const venc = x.vence && x.vence<hoy && x.estado!=="hecha";
  return `<div class="tarea ${x.estado==="hecha"?"hecha":""} pr-${x.prioridad||"media"}" data-id="${x.id}">
    <button type="button" class="check" data-act="tareaToggle" data-id="${x.id}" aria-label="Completar">${ICON.check}</button>
    <div class="tarea-c" data-act="tareaEditar" data-id="${x.id}"><b>${esc(x.titulo)}</b>
      <div class="meta">${x.vence?`<span class="when ${venc?"venc":""}">${ICON.clock}${venc?"Atrasada · ":""}${capital(relDia(x.vence))}${x.hora?" · "+x.hora:""}</span>`:""}${chipArea(x.area)}${x.prioridad==="alta"?`<span class="tag alta">Prioridad</span>`:""}</div></div>
    ${compacto?"":`<button type="button" class="ib sm" data-act="tareaMenu" data-id="${x.id}" aria-label="Opciones">${ICON.more}</button>`}
  </div>`;
}
const Hoy = { montar(){} };
VISTAS.hoy = function(){
  const ahora=new Date(), hoy=todayStr(), h=ahora.getHours();
  const av = avisosMila(); const cm = Coach.mensaje(); const a0 = cm || av[0];
  if(!S.busy && !Coach.focoT) Mila.emo = a0.emo==="preocupada" ? "pensativa" : a0.emo;
  const tsHoy = priorizar(tareasDeHoy()); const sinFecha = priorizar(S.tareas.filter(x=>x.estado!=="hecha" && !x.vence && x.prioridad==="alta"));
  const top = [...tsHoy, ...sinFecha].slice(0,5);
  const hechasHoy = S.tareas.filter(x=>x.hecha_en && ymd(new Date(x.hecha_en))===hoy).length;
  const totHoy = hechasHoy + tsHoy.length;
  const habHechos = S.habitos.filter(x=>x.registros?.[hoy]).length;
  const evHoy = eventosEntre(hoy, hoy).filter(e=>!e.allDay && !e.alerta); const minAg = sum(evHoy, e=>(e.fin-e.ini)/60000);
  const prox = eventosEntre(hoy, ymd(addDays(ahora,7)), {tareas:true}).filter(e=>e.fin>ahora && !e.alerta).slice(0,4);
  const mes = hoy.slice(0,7); const {g,i} = totalesMes(mes); const ult = S.movimientos.slice().sort((a,b)=>(b.creado||0)-(a.creado||0)).slice(0,3);
  const animoHoy = S.animo.find(x=>x.id===hoy);
  const rec = (()=>{ const l=S.recuerdos.filter(r=>r.estado!=="procesando"); if(!l.length) return null; const d=new Date(); const idx = (d.getDate()+d.getMonth()*31)%l.length; return l.sort((a,b)=>(a.creado||0)-(b.creado||0))[idx]; })();
  const semana = [...Array(7)].map((_,k)=>{ const d=addDays(startDay(ahora),k); const s=ymd(d); return {d, n: eventosEntre(s,s,{tareas:false}).filter(e=>!e.alerta).length, t: S.tareas.filter(x=>x.estado!=="hecha"&&x.vence===s).length}; });
  const maxCarga = Math.max(1, ...semana.map(x=>x.n+x.t));
  const pct = totHoy ? hechasHoy/totHoy : 0;
  const pend = Coach.pendientes(); const fr = fraseDelDia(); const desc = Coach.enDescanso();
  const zor = Fuentes.data.zorro ? Fuentes.zorro() : null, lz = Fuentes.data.luzmila ? Fuentes.luzmila() : null, cu = Fuentes.data.culta ? Fuentes.culta() : null;
  const cc = S.profile.ciclo||{}; const cst = cc.enInicio && !cc.pin ? cicloStats() : null;
  const quick = [["Gasto","coin","sheet","mov"],["Tarea","task","sheet","tarea"],["Evento","cal","sheet","evento"],["Recuerdo","memory","sheet","recuerdo"],["Frase","quote","go","frases"],["Hábito","sprout","go","crecer"]];
  const accA = a0.tid ? `<div class="burbuja-acc"><button type="button" class="btn sm pri" data-act="coachHecho" data-id="${a0.tid}">${ICON.check} Ya lo hice</button><button type="button" class="btn sm" data-act="coachPosponer" data-id="${a0.tid}" data-v="60">${ICON.snooze} 1 h</button><button type="button" class="btn sm" data-act="coachAyuda" data-id="${a0.tid}">${ICON.help} Ayuda</button></div>`
    : a0.acc?`<div class="burbuja-acc">${a0.acc.map(([l,k,v])=>`<button type="button" class="btn sm ${k==="say"?"pri":""}" data-act="${k==="say"?"decir":k==="go"?"ir":"sheetOpen"}" data-v="${esc(v)}">${esc(l)}</button>`).join("")}</div>`:"";
  return `
  <section class="hero">
    <div class="hero-escena">${escenaSVG(h)}</div>
    <div class="hero-in">
      <div class="hero-txt">
        <p class="hero-fecha">${capital(fmtDiaLargo(ahora))} · ${capital(momentoDia(h))}${desc?" · modo descanso":""}${Coach.cfg().estricto?" · entrenadora estricta":""}</p>
        <h1 class="hero-h">${saludoHora(h)},<br><em>${esc(N())}</em></h1>
        <div class="burbuja" data-emo="${a0.emo}"><span class="burbuja-mila mila-host" data-emo="${a0.emo}"></span><p>${esc(a0.t)}</p>${accA}
          ${av.length>1?`<button type="button" class="burbuja-mas" data-act="avisos">+${av.length-1} ${av.length-1===1?"aviso":"avisos"}</button>`:""}
        </div>
      </div>
      <div class="hero-duo" aria-hidden="true">
        <div class="duo-yo">${ring(pct,{size:196,label:"", color:"#FFD36B", stroke:7})}<span class="duo-foto">${yoAvatar({})}</span>${!fotoYo()?`<button type="button" class="duo-subir" data-act="fotoSubir">${ICON.camera} Tu foto</button>`:""}<span class="duo-pct">${totHoy?Math.round(pct*100)+"% de hoy":"Día libre"}</span></div>
        <div class="duo-mila mila-host" data-emo="${a0.emo}"></div>
      </div>
    </div>
    <div class="quick">${quick.map(([l,ic,k,v])=>`<button type="button" class="q-btn" data-act="${k==="go"?"ir":"sheetOpen"}" data-v="${v}"><span>${ICON[ic]}</span>${l}</button>`).join("")}</div>
  </section>

  <div class="grid-hoy">
    <section class="card c-ahora span2">
      <div class="card-h"><span class="card-ic">${ICON.clock}</span><h3>Tu día</h3><div class="card-acc"><button type="button" class="link" data-act="ir" data-v="agenda">Abrir agenda ${ICON.right}</button></div></div>
      ${lineaDia(hoy)}
      ${prox.length ? `<div class="proximos">${prox.map((e,k)=>`<button type="button" class="prox ${k===0?"uno":""}" data-act="evAbrir" data-id="${esc(e.id)}" style="--c:${catColor(e.cat)}">
          <span class="prox-h"><b>${e.allDay?"Todo el día":hhmm(e.ini)}</b><small>${sameDay(e.ini,ahora)?(e.ini<=ahora?"ahora":cuentaAtras(e.ini)):capital(relDia(e.ini))}</small></span>
          <span class="prox-t"><b>${esc(e.titulo)}</b><small>${e.tarea?"Tarea":CATS[e.cat]?.n||""}${e.lugar?" · "+esc(e.lugar):""}</small></span></button>`).join("")}</div>`
        : vacio("agenda","Nada agendado por ahora","Tu semana está libre. Agrega un evento o dile a Mila «tengo clase el lunes a las 7».", btn("Nuevo evento","sheetOpen",'data-v="evento"',"pri sm"))}
    </section>

    <section class="card c-comp ${pend.length?"alerta":""} ${Coach.cfg().estricto?"estricta":""}">
      <div class="card-h"><span class="card-ic">${ICON.whistle}</span><h3>Compromisos</h3><div class="card-acc"><button type="button" class="link" data-act="sheetOpen" data-v="coachAjustes">${ICON.sliders}</button></div></div>
      ${desc ? `<div class="comp-ok"><span class="mila-host" data-emo="carinosa"></span><p>Modo descanso hasta ${relDia(new Date(S.profile.descanso.hasta))} ${h12(new Date(S.profile.descanso.hasta))}. Sin insistencias.</p>${btn("Terminar descanso","finDescanso","","sm")}</div>`
        : pend.length ? `<div class="comp-l">${pend.slice(0,3).map(t=>`<div class="comp-i niv${t.seg?.nivel||1}"><div class="grow"><b>${esc(t.titulo)}</b><small>${capital(Coach.cuandoTxt(t))} · ${t.seg?.nivel>=3?"aviso insistente":t.seg?.nivel===2?"segundo aviso":"primer aviso"}${t.seg?.posp?` · pospuesta ${t.seg.posp}×`:""}</small></div><button type="button" class="ib sm ok" data-act="coachHecho" data-id="${t.id}" title="Hecho">${ICON.check}</button><button type="button" class="ib sm" data-act="coachPosponer" data-id="${t.id}" data-v="60" title="Posponer 1 h">${ICON.snooze}</button><button type="button" class="ib sm" data-act="coachAyuda" data-id="${t.id}" title="Pedir ayuda">${ICON.help}</button></div>`).join("")}</div>`
        : `<div class="comp-ok"><span class="mila-host" data-emo="orgullosa"></span><p>${S.tareas.some(x=>x.estado!=="hecha"&&x.vence)?"Todo confirmado por ahora. Te aviso si algo se queda sin cumplir.":"Sin compromisos con fecha. Ponle fecha a una tarea y te acompaño hasta que esté hecha."}</p></div>`}
    </section>

    <section class="card c-prior span2">
      <div class="card-h"><span class="card-ic">${ICON.flag}</span><h3>Prioridades</h3><div class="card-acc"><button type="button" class="ib sm" data-act="sheetOpen" data-v="tarea" title="Nueva tarea">${ICON.plus}</button><button type="button" class="link" data-act="ir" data-v="tareas">Todas ${ICON.right}</button></div></div>
      ${top.length ? `<div class="lista-tareas">${top.map(x=>itemTarea(x,{compacto:true})).join("")}</div>` : vacio("tareas","Sin pendientes urgentes","Respira. Si algo te ronda la cabeza, anótalo y lo ordenamos juntas.", btn("Agregar tarea","sheetOpen",'data-v="tarea"',"pri sm"))}
    </section>

    <section class="card c-prog">
      <div class="card-h"><span class="card-ic">${ICON.target}</span><h3>Progreso de hoy</h3></div>
      <div class="rings">
        <div>${ring(totHoy?hechasHoy/totHoy:0,{size:78,label:`${hechasHoy}/${totHoy||0}`, color:"var(--violeta)"})}<small>Tareas</small></div>
        <div>${ring(S.habitos.length?habHechos/S.habitos.length:0,{size:78,label:`${habHechos}/${S.habitos.length}`, color:"var(--menta)"})}<small>Hábitos</small></div>
        <div>${ring(Math.min(1,minAg/480),{size:78,label:`${Math.round(minAg/60*10)/10}h`, color:"var(--ambar)"})}<small>Agendado</small></div>
      </div>
    </section>

    <section class="card c-frase" style="--c:${FRASE_CATS[fr.cat]||"var(--violeta)"}">
      <div class="card-h"><span class="card-ic">${ICON.quote}</span><h3>Frase del día</h3><div class="card-acc"><button type="button" class="link" data-act="ir" data-v="frases">Más ${ICON.right}</button></div></div>
      <blockquote>${esc(fr.texto)}</blockquote><div class="fr-pie"><small>${esc(fr.cat)}${fr.autor&&fr.autor!=="Mila"?" · "+esc(fr.autor):""}</small><button type="button" class="ib sm ${esFav(fr)?"on":""}" data-act="fraseFav" ${fr.banco?`data-clave="${fr.clave}"`:`data-id="${fr.id}"`}>${ICON.heart}</button><button type="button" class="ib sm" data-act="leer" data-v="${esc(fr.texto)}">${ICON.volume}</button></div>
    </section>

    ${zor||lz||cu ? `<section class="card c-proy span2"><div class="card-h"><span class="card-ic">${ICON.sheet}</span><h3>Hoy en tus proyectos</h3><div class="card-acc"><button type="button" class="link" data-act="ir" data-v="fuentes">Mis hojas ${ICON.right}</button></div></div>
      <div class="proy-g">
        ${zor?.hoy?`<div class="proy" style="--c:#E8912D"><small>Taller del Zorro · ${esc(zor.hoy.enfoque)}</small><b>${esc(zor.hoy.ic||"")} ${esc(zor.hoy.accion)}</b>${btn(ICON.plus+" Agendar","decir",`data-v="${esc("agrega tarea "+zor.hoy.accion+" para hoy")}"`,"sm")}</div>`:""}
        ${lz?`<div class="proy" style="--c:#1FA97A"><small>PROYECTO_LUZMILA · día ${esc(lz.dia||"—")}</small><b>${esc(lz.nivel||"")} · ${esc(lz.puntos||"0")} pts</b><span class="mini">${lz.frase?esc(lz.frase):""}</span></div>`:""}
        ${cu?`<div class="proy" style="--c:#7C5CFF"><small>Proyecto Culta</small><b>${cu.prom?`Promedio ${cu.prom}/20`:"Sin notas aún"}</b><span class="mini">${cu.ses.length?`Última: ${esc(cu.ses[cu.ses.length-1].tema)}`:""}</span></div>`:""}
      </div></section>` : ""}

    <section class="card c-hab">
      <div class="card-h"><span class="card-ic">${ICON.sprout}</span><h3>Hábitos</h3><div class="card-acc"><button type="button" class="link" data-act="ir" data-v="crecer">Ver ${ICON.right}</button></div></div>
      ${S.habitos.length ? `<div class="habs">${S.habitos.map(x=>{ const on=!!x.registros?.[hoy]; const r=racha(x); return `<button type="button" class="hab ${on?"on":""}" data-act="habToggle" data-id="${x.id}" style="--c:${x.color||"var(--menta)"}"><span class="hab-ic">${HAB_IC[x.icono]||ICON.leaf}</span><span class="hab-n">${esc(x.nombre)}</span>${r?`<span class="racha">${ICON.flame}${r}</span>`:""}</button>`; }).join("")}</div>`
        : vacio("habitos","Siembra tu primer hábito","Pequeño y diario: ritual de mañana, comida ancla, ritual de noche.", btn("Crear hábito","sheetOpen",'data-v="habito"',"pri sm"))}
    </section>

    <section class="card c-dinero">
      <div class="card-h"><span class="card-ic">${ICON.wallet}</span><h3>Dinero · ${MESES[ahora.getMonth()]}</h3><div class="card-acc"><button type="button" class="ib sm" data-act="sheetOpen" data-v="mov" title="Registrar">${ICON.plus}</button></div></div>
      <div class="din-kpis"><div><small>Gastaste</small><b class="neg">${money0(g)}</b></div><div><small>Entró</small><b class="pos">${money0(i)}</b></div><div><small>Balance</small><b>${money0(i-g)}</b></div></div>
      ${i||g ? barraProg(i? g/i : 1, g>i&&i?"var(--coral)":"var(--violeta)") + `<p class="mini">${i?`Usaste el ${Math.round(g/i*100)}% de lo que entró.`:"Aún no registras ingresos este mes."}</p>` : ""}
      ${ult.length ? `<div class="movs-mini">${ult.map(m=>`<button type="button" class="mov-mini" data-act="movEditar" data-id="${m.id}"><span class="dot" style="background:${m.tipo==="ingreso"?"var(--menta)":colorCat(m.categoria)}"></span><span class="grow">${esc(m.concepto)}</span><b class="${m.tipo==="ingreso"?"pos":""}">${m.tipo==="ingreso"?"+":"−"}${money(m.monto)}</b></button>`).join("")}</div>` : `<p class="mini">Dile a Mila «gasté 8 soles en pasaje» y aparecerá aquí.</p>`}
    </section>

    <section class="card c-animo">
      <div class="card-h"><span class="card-ic">${ICON.heart}</span><h3>¿Cómo estás?</h3></div>
      ${animoHoy ? `<div class="animo-hoy"><span class="cara grande" style="--c:${moodDe(animoHoy.estado).c}">${caraSVG(animoHoy.estado)}</span><div><b>${moodDe(animoHoy.estado).l}</b><small>Registrado hoy</small></div><button type="button" class="link" data-act="sheetOpen" data-v="animo">Cambiar</button></div>` :
        `<div class="caras">${MOODS.filter(m=>m.k!=="estresada").map(m=>`<button type="button" class="cara" style="--c:${m.c}" data-act="animo" data-v="${m.k}" title="${m.l}">${caraSVG(m.k)}<small>${m.l}</small></button>`).join("")}</div>`}
      <div class="animo-sem">${[...Array(7)].map((_,k)=>{ const d=addDays(ahora,k-6); const a=S.animo.find(x=>x.id===ymd(d)); return `<span ${tipAttr(fmtDia(d)+": "+(a?moodDe(a.estado).l:"sin registro"))} style="--c:${a?moodDe(a.estado).c:"var(--hm-empty)"}"><i></i>${DIAS_L[d.getDay()]}</span>`; }).join("")}</div>
    </section>

    <section class="card c-semana ${cst?"":"span2"}">
      <div class="card-h"><span class="card-ic">${ICON.cal}</span><h3>Tu semana</h3></div>
      <div class="semana">${semana.map(x=>`<button type="button" class="sem-d ${sameDay(x.d,ahora)?"hoy":""}" data-act="agendaDia" data-v="${ymd(x.d)}"><small>${DIAS_C[x.d.getDay()]}</small><b>${x.d.getDate()}</b><span class="carga"><i style="height:${(x.n+x.t)/maxCarga*100}%"></i></span><small>${x.n+x.t?plural(x.n+x.t,"cosa","cosas"):"libre"}</small></button>`).join("")}</div>
    </section>
    ${cst ? `<section class="card c-ciclo"><div class="card-h"><span class="card-ic">${ICON.drop}</span><h3>Mi ciclo</h3><div class="card-acc"><button type="button" class="link" data-act="ir" data-v="ciclo">Abrir ${ICON.right}</button></div></div><p class="mini">${cst.enCurso?`Día ${cst.diaCiclo} de tu periodo.`:cst.prox?`Próximo estimado: ${relDia(cst.prox.ini)}.`:"Registra tus periodos para ver estimaciones."}</p></section>`:""}

    ${rec ? `<section class="card c-rec" style="--c:${emoColor(rec.emocion)}">
      <div class="card-h"><span class="card-ic">${ICON.memory}</span><h3>Un recuerdo para ti</h3></div>
      <button type="button" class="rec-hoy" data-act="recAbrir" data-id="${rec.id}"><span class="rec-emo">${emoLabel(rec.emocion)}</span><b>${esc(rec.titulo)}</b><p>${esc(String(rec.texto||rec.relato||"").slice(0,140))}${String(rec.texto||"").length>140?"…":""}</p><small>${rec.fecha?capital(relDia(rec.fecha)):""}</small></button>
    </section>` : ""}
  </div>`;
};
function caraSVG(k){
  const bocas = {genial:"M8 14.5 Q12 19 16 14.5", bien:"M8.5 15 Q12 17.5 15.5 15", normal:"M9 15.5 H15", cansada:"M9 16 Q12 15 15 16", estresada:"M8.5 16 Q10 14.5 12 16 Q14 17.5 15.5 16", triste:"M8.5 16.5 Q12 13.5 15.5 16.5"};
  const ojos = k==="cansada" ? `<path d="M7.5 10.5h3M13.5 10.5h3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>` : k==="genial" ? `<path d="M7.5 11 Q9 9 10.5 11M13.5 11 Q15 9 16.5 11" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/>` : `<circle cx="9" cy="10.5" r="1.3" fill="currentColor"/><circle cx="15" cy="10.5" r="1.3" fill="currentColor"/>`;
  return `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="var(--c)" opacity=".9"/>${ojos}<path d="${bocas[k]||bocas.normal}" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>`;
}
