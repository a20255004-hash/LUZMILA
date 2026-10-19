/* =========================================================
   RECUERDOS · diario de vida, lo que Mila sabe de ti y notas
   ========================================================= */
VISTAS.recuerdos = function(){
  const U=S.recUI; if(U.tab==="memoria") U.tab="diario"; const tabs = segmentos("recTab", [["diario","Diario"],["notas","Notas e ideas"]], U.tab) + `<button type="button" class="btn sm" data-go="memoria">${ICON.brain} Lo que sé de ti</button>`;
  let cuerpo="";
  if(U.tab==="diario"){
    let l = S.recuerdos.filter(r=>r.estado!=="procesando" || r.titulo).slice();
    if(U.emo) l = l.filter(r=>r.emocion===U.emo); if(U.q) l = l.filter(r=>norm(r.titulo+" "+r.texto+" "+(r.personas||[]).join(" ")+" "+(r.lugar||"")).includes(norm(U.q)));
    l.sort((a,b)=>(b.fecha||ymd(new Date(b.creado||0))).localeCompare(a.fecha||ymd(new Date(a.creado||0))) || (b.creado||0)-(a.creado||0));
    const porMes = groupBy(l, r=>(r.fecha||ymd(new Date(r.creado||Date.now()))).slice(0,7));
    const cuenta = Object.fromEntries(EMOS.map(([k])=>[k, S.recuerdos.filter(r=>r.emocion===k).length]));
    const hoyMd = ymd(new Date()).slice(5); const unAno = S.recuerdos.filter(r=>r.fecha && r.fecha.slice(5)===hoyMd && r.fecha.slice(0,4)!==String(new Date().getFullYear()));
    cuerpo = `
      <form class="rec-nuevo card" data-form="recNuevo"><span class="rec-nuevo-ic">${ICON.memory}</span><textarea name="t" rows="2" placeholder="¿Qué pasó hoy que quieras recordar? Escríbelo o dicta con el micrófono…"></textarea><div class="rec-nuevo-acc"><button type="button" class="ib" data-act="micRec" title="Dictar">${ICON.mic}</button><button type="submit" class="btn pri sm">Guardar</button></div></form>
      ${unAno.length?`<section class="card hace-un-ano"><b>Un día como hoy</b>${unAno.map(r=>`<button type="button" class="link" data-act="recAbrir" data-id="${r.id}">${esc(r.titulo)} (${r.fecha.slice(0,4)})</button>`).join("")}</section>`:""}
      <div class="t-barra"><div class="chips">${`<button type="button" class="chip ${!U.emo?"on":""}" data-act="recEmo" data-v="">Todos<span>${S.recuerdos.length}</span></button>`+EMOS.map(([k,l,c])=>cuenta[k]?`<button type="button" class="chip ${U.emo===k?"on":""}" style="--c:${c}" data-act="recEmo" data-v="${k}"><i class="pt" style="background:${c}"></i>${l}<span>${cuenta[k]}</span></button>`:"").join("")}</div>
        <label class="buscar">${ICON.search}<input id="recBuscar" placeholder="Buscar personas, lugares…" value="${esc(U.q)}"></label></div>
      ${l.length ? `<div class="linea-vida">${Object.entries(porMes).map(([m,rs])=>`<div class="lv-mes"><h4>${mesLabel(m)}</h4><div class="lv-g">${rs.map(r=>`<button type="button" class="recuerdo" data-act="recAbrir" data-id="${r.id}" style="--c:${emoColor(r.emocion)}">
          <span class="rc-emo">${emoLabel(r.emocion)}</span><b>${esc(r.titulo)}</b><p>${esc(String(r.texto||r.relato||"").slice(0,180))}${String(r.texto||"").length>180?"…":""}</p>
          <small>${r.fecha?capital(fmtDiaLargo(pymd(r.fecha))):esc(r.fecha_aprox||"")}${(r.personas||[]).length?" · con "+esc(r.personas.join(", ")):""}${r.lugar?" · "+esc(r.lugar):""}</small></button>`).join("")}</div></div>`).join("")}</div>`
        : vacio("recuerdos", U.q||U.emo?"Nada coincide":"Tu diario te espera", U.q||U.emo?"Prueba con otro filtro.":"Cuéntale a Mila algo que te pasó: «guarda en recuerdos que hoy me quedé hasta las 2 a. m. mejorando Mila».")}`;
  } else if(U.tab==="memoria"){
    const grupos = groupBy(S.memorias.filter(m=>!U.q || norm(m.texto).includes(norm(U.q))).sort((a,b)=>(b.actualizado||b.creado||0)-(a.actualizado||a.creado||0)), m=>m.tipo||"hecho");
    const NG = {preferencia:"Gustos", persona:"Personas", hecho:"Datos", objetivo:"Objetivos", rutina:"Rutinas", decision:"Decisiones", proyecto:"Proyectos", suposicion:"Suposiciones"};
    cuerpo = `<p class="intro">Esto es lo que Mila recuerda de ti y usa para ayudarte. Puedes corregir u olvidar cualquier cosa.</p>
      <div class="t-barra"><label class="buscar">${ICON.search}<input id="memBuscar" placeholder="Buscar en lo que sé" value="${esc(U.q)}"></label>${btn(ICON.plus+" Enséñame algo","sheetOpen",'data-v="memoria"',"sm pri")}</div>
      ${S.memorias.length ? `<div class="mem-g">${Object.entries(grupos).map(([k,l])=>`<section class="card"><div class="card-h"><h3>${NG[k]||capital(k)}</h3><span class="cnt">${l.length}</span></div>${l.map(m=>`<div class="mem ${m.confianza==="inferido"?"inf":""}"><p>${esc(m.texto)}</p><span class="mem-acc"><button type="button" class="ib sm" data-act="memEditar" data-id="${m.id}" title="Corregir">${ICON.edit}</button><button type="button" class="ib sm" data-act="memOlvidar" data-id="${m.id}" title="Olvidar">${ICON.trash}</button></span></div>`).join("")}</section>`).join("")}</div>`
        : vacio("memoria","Aún no sé mucho de ti","Dime cosas como «me encanta la lúcuma» o «mi cumpleaños es el 3 de mayo» y las recordaré.")}`;
  } else {
    const ns = S.notas.slice().sort((a,b)=>(b.creado||0)-(a.creado||0)).filter(n=>!U.q || norm(n.texto).includes(norm(U.q)));
    cuerpo = `<form class="quickadd card" data-form="notaNueva"><span class="qa-ic">${ICON.spark}</span><input name="t" placeholder="Anota una idea o nota rápida…" autocomplete="off"><button type="submit" class="btn pri sm">Guardar</button></form>
      ${ns.length ? `<div class="notas-g">${ns.map(n=>`<div class="nota ${n.tipo}"><span class="nota-t">${n.tipo==="idea"?ICON.spark+" Idea":ICON.edit+" Nota"}</span><p>${esc(n.texto)}</p><small>${hace(n.creado||Date.now())}</small><button type="button" class="ib sm" data-act="notaBorrar" data-id="${n.id}">${ICON.trash}</button></div>`).join("")}</div>`
        : vacio("chat","Sin notas todavía","Ideas sueltas, frases, cosas para después: «anota idea: video sobre mi tesis».")}`;
  }
  return `${cab("Diario", "Tu vida, guardada con cariño", tabs, "recuerdos")}${cuerpo}`;
};

/* =========================================================
   PROGRESO · gráficos con tus datos reales
   ========================================================= */
VISTAS.progreso = function(){
  const hoy=new Date(); const sem = [...Array(8)].map((_,k)=>{ const ini=addDays(startWeek(hoy), (k-7)*7); return {ini, fin:addDays(ini,6)}; });
  const hechasPorSem = sem.map(s=>S.tareas.filter(x=>x.hecha_en && new Date(x.hecha_en)>=s.ini && new Date(x.hecha_en)<addDays(s.fin,1)).length);
  const creadasPorSem = sem.map(s=>S.tareas.filter(x=>x.creado && new Date(x.creado)>=s.ini && new Date(x.creado)<addDays(s.fin,1)).length);
  const lbl = sem.map(s=>`${s.ini.getDate()}/${s.ini.getMonth()+1}`);
  // hábitos: % cumplido por semana
  const habSem = sem.map(s=>{ if(!S.habitos.length) return null; let ok=0, tot=0; for(let d=new Date(s.ini); d<=s.fin && d<=hoy; d=addDays(d,1)){ for(const h of S.habitos){ if(h.creado && new Date(h.creado)>addDays(d,1)) continue; tot++; if(h.registros?.[ymd(d)]) ok++; } } return tot?Math.round(ok/tot*100):null; });
  // tiempo agendado por categoría (esta semana)
  const ws=startWeek(hoy); const evs = eventosEntre(ymd(ws), ymd(addDays(ws,6))).filter(e=>!e.allDay && !e.alerta);
  const porCat = Object.entries(groupBy(evs, e=>e.cat)).map(([c,l])=>({l:CATS[c]?.n||c, v:round2(sum(l,e=>(e.fin-e.ini)/3600000)), c:catColor(c)})).sort((a,b)=>b.v-a.v);
  const horas = sum(porCat, x=>x.v);
  // actividad diaria (todo lo que registraste)
  const act = {}; const add = (ts) => { if(!ts) return; const k = typeof ts==="string" ? ts.slice(0,10) : ymd(new Date(ts)); act[k]=(act[k]||0)+1; };
  S.tareas.forEach(x=>add(x.hecha_en)); S.movimientos.forEach(m=>add(m.creado)); S.recuerdos.forEach(r=>add(r.creado)); S.habitos.forEach(h=>Object.keys(h.registros||{}).forEach(add)); S.animo.forEach(a=>add(a.id));
  const diasActivos = Object.keys(act).filter(k=>k>=ymd(addDays(hoy,-30))).length;
  // gastos por categoría en 6 meses
  const meses6 = [...Array(6)].map((_,k)=>mesMas(ymd(hoy).slice(0,7),k-5)); const cats = Object.keys(CAT_COL);
  const gm = meses6.map(m=>totalesMes(m).ms.filter(x=>x.tipo==="gasto"));
  const topCats = cats.map(c=>[c, sum(gm.flat().filter(m=>m.categoria===c),m=>m.monto)]).filter(x=>x[1]).sort((a,b)=>b[1]-a[1]).slice(0,5).map(x=>x[0]);
  const animo30 = [...Array(30)].map((_,k)=>{ const a=S.animo.find(x=>x.id===ymd(addDays(hoy,k-29))); return a?moodDe(a.estado).v:null; });
  const hayTareas = hechasPorSem.some(Boolean) || creadasPorSem.some(Boolean);
  return `${cab("Progreso", "Cómo vas, con tus datos reales")}
  <div class="kpis">
    <div class="kpi"><small>Tareas esta semana</small><b>${hechasPorSem[7]}</b>${hechasPorSem[6]?`<span class="delta ${hechasPorSem[7]>=hechasPorSem[6]?"up":"down"}">${hechasPorSem[7]>=hechasPorSem[6]?"▲":"▼"} vs ${hechasPorSem[6]}</span>`:""}</div>
    <div class="kpi"><small>Hábitos (semana)</small><b>${habSem[7]==null?"—":habSem[7]+"%"}</b></div>
    <div class="kpi"><small>Horas agendadas</small><b>${Math.round(horas*10)/10}h</b></div>
    <div class="kpi"><small>Días activos (30)</small><b>${diasActivos}</b></div>
  </div>
  <div class="prog-grid">
    <section class="card span2"><div class="card-h"><h3>Tu constancia</h3><div class="card-acc"><span class="mini">Cada cuadro es un día en que registraste algo</span></div></div>
      ${Object.keys(act).length ? `<div class="heat-wrap">${heatmap(act, {semanas: innerWidth<700?18:30, color:"#7C5CFF", fmt:(d,v)=>`${fmtDia(d)}: ${v?plural(v,"registro","registros"):"sin actividad"}`})}</div>` : vacio("progreso","Tu mapa de constancia","Cada tarea, hábito, gasto o recuerdo que registres pintará un cuadrito aquí.")}
    </section>
    <section class="card"><div class="card-h"><h3>Tareas por semana</h3><div class="card-acc"><span class="ley"><i style="background:#7C5CFF"></i>Hechas</span><span class="ley"><i style="background:#CFC4FF"></i>Nuevas</span></div></div>
      ${hayTareas ? barChart(hechasPorSem.map((v,k)=>({l:lbl[k], v, tip:`Semana del ${lbl[k]}: ${v} hechas, ${creadasPorSem[k]} nuevas`})), {h:170, highlight:7}) + lineChart([{name:"Nuevas", color:"#CFC4FF", values:creadasPorSem}], {h:60, area:false, labels:[]}) : vacio("tareas","Sin datos aún","Completa tareas y verás tu avance semana a semana.")}
    </section>
    <section class="card"><div class="card-h"><h3>Hábitos cumplidos</h3></div>
      ${habSem.some(v=>v!=null) ? lineChart([{name:"Cumplimiento", color:"#1FA97A", values:habSem}], {h:170, labels:lbl, fmt:v=>v+"%", max:100, min:0}) : vacio("habitos","Sin hábitos aún","Crea un hábito y marca tus días para ver esta curva.")}
    </section>
    <section class="card"><div class="card-h"><h3>Tiempo agendado · semana</h3></div>
      ${porCat.length ? `<div class="cat-flex">${donut(porCat.map(p=>({...p})), {size:150, stroke:20, center:Math.round(horas*10)/10+"h", sub:"agendadas", fmt:v=>v+" h"})}<div class="cat-ley">${porCat.map(p=>`<div class="cl"><i style="background:${p.c}"></i><span>${p.l}</span><b>${p.v}h</b></div>`).join("")}</div></div>` : vacio("agenda","Semana sin eventos","Cuando agendes clases, prácticas o tesis verás cómo repartes tu tiempo.")}
    </section>
    <section class="card"><div class="card-h"><h3>Ánimo · 30 días</h3></div>
      ${animo30.some(v=>v!=null) ? lineChart([{name:"Ánimo", color:"#E06AA8", values:animo30}], {h:170, labels:[...Array(30)].map((_,k)=>k%7===0?String(addDays(hoy,k-29).getDate()):""), fmt:v=>(MOODS.find(m=>m.v===Math.round(v))||{l:v}).l, max:5, min:1}) : vacio("memoria","Registra tu ánimo","Una carita al día basta para ver tus patrones.")}
    </section>
    <section class="card span2"><div class="card-h"><h3>Gastos por categoría · 6 meses</h3></div>
      ${topCats.length ? `<div class="apiladas">${meses6.map((m,k)=>{ const tot=sum(gm[k],x=>x.monto); const mx=Math.max(1,...gm.map(l=>sum(l,x=>x.monto))); return `<div class="ap-col"><div class="ap-bar" style="height:${tot/mx*100}%">${topCats.map(c=>{ const v=sum(gm[k].filter(x=>x.categoria===c),x=>x.monto); return v?`<i style="flex:${v};background:${colorCat(c)}" ${tipAttr(`${mesLabel(m)} · ${c}: ${money(v)}`)}></i>`:""; }).join("")}${(()=>{ const o=tot-sum(topCats,c=>sum(gm[k].filter(x=>x.categoria===c),x=>x.monto)); return o>0?`<i style="flex:${o};background:#CFC9DE" ${tipAttr(`${mesLabel(m)} · otras: ${money(o)}`)}></i>`:""; })()}</div><small>${MESES[Number(m.slice(5))-1].slice(0,3)}</small></div>`; }).join("")}</div><div class="ley-l">${topCats.map(c=>`<span class="ley"><i style="background:${colorCat(c)}"></i>${c}</span>`).join("")}</div>`
        : vacio("dinero","Sin gastos registrados","Tus gastos por mes aparecerán aquí, con colores por categoría.")}
    </section>
  </div>`;
};
