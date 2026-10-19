/* =========================================================
   CRECER · hábitos, metas y ánimo
   ========================================================= */
VISTAS.crecer = function(){
  const tab = S.crecerUI.tab; const hoy=todayStr();
  const tabs = segmentos("crecerTab", [["habitos","Hábitos"],["metas","Metas"],["animo","Ánimo"]], tab);
  let cuerpo="";
  if(tab==="habitos"){
    const hechos = S.habitos.filter(h=>h.registros?.[hoy]).length; const mejor = S.habitos.map(h=>[h,racha(h)]).sort((a,b)=>b[1]-a[1])[0];
    const sem = startWeek(new Date());
    cuerpo = S.habitos.length ? `
      <div class="cr-resumen card">${ring(S.habitos.length?hechos/S.habitos.length:0,{size:92,label:`${hechos}/${S.habitos.length}`,sub:"hoy",color:"var(--menta)"})}
        <div><h3>${hechos===S.habitos.length?"¡Día completo!":`Te ${S.habitos.length-hechos===1?"falta 1 hábito":"faltan "+(S.habitos.length-hechos)+" hábitos"} hoy`}</h3><p class="mini">${mejor&&mejor[1]?`Tu racha más larga activa: «${esc(mejor[0].nombre)}», ${plural(mejor[1],"día","días")}.`:"Cada día que marcas suma a tu racha."}</p></div></div>
      <div class="habitos-g">${S.habitos.map(h=>{ const r=racha(h); const reg=h.registros||{}; const c=h.color||"#1FA97A";
        const ult30 = [...Array(30)].filter((_,k)=>reg[ymd(addDays(new Date(),-k))]).length;
        return `<section class="card habito" style="--c:${c}">
          <div class="hb-top"><span class="hb-ic">${HAB_IC[h.icono]||ICON.leaf}</span><div class="grow"><h3>${esc(h.nombre)}</h3><small>${r?`${ICON.flame} ${plural(r,"día","días")} seguidos`:"Empieza hoy tu racha"} · ${Math.round(ult30/30*100)}% en 30 días</small></div>
            <button type="button" class="hb-check ${reg[hoy]?"on":""}" data-act="habToggle" data-id="${h.id}" aria-label="Marcar hoy">${ICON.check}</button><button type="button" class="ib sm" data-act="habMenu" data-id="${h.id}">${ICON.more}</button></div>
          <div class="hb-semana">${[...Array(7)].map((_,k)=>{ const d=addDays(sem,k); const s=ymd(d); const fut=d>new Date(); return `<button type="button" class="hb-d ${reg[s]?"on":""} ${s===hoy?"hoy":""}" ${fut?"disabled":""} data-act="habDia" data-id="${h.id}" data-v="${s}"><small>${DIAS_L[d.getDay()]}</small><i>${reg[s]?ICON.check:""}</i></button>`; }).join("")}</div>
          <div class="hb-heat">${heatmap(Object.fromEntries(Object.keys(reg).map(k=>[k,1])), {semanas:16, color:c, fmt:(d,v)=>`${fmtDia(d)}: ${v?"cumplido":"—"}`})}</div>
        </section>`; }).join("")}
        <button type="button" class="card hb-nuevo" data-act="sheetOpen" data-v="habito">${ICON.plus}<b>Nuevo hábito</b><small>Pequeño, concreto y diario</small></button></div>`
      : vacio("habitos","Tu jardín de hábitos está por sembrar","Los hábitos pequeños cambian todo. Empieza con uno: leer 10 minutos, tomar agua o caminar.", btn("Crear mi primer hábito","sheetOpen",'data-v="habito"',"pri"));
  } else if(tab==="metas"){
    const act = S.metas.filter(g=>g.estado==="activa"), otras = S.metas.filter(g=>g.estado!=="activa");
    cuerpo = `${act.length>3?`<div class="aviso">${ICON.alert}<span>Tienes ${act.length} metas activas. Tu regla es máximo 3: ¿pausamos alguna?</span></div>`:""}
      <div class="metas-g">${act.map(g=>tarjetaMeta(g)).join("")}<button type="button" class="card hb-nuevo" data-act="sheetOpen" data-v="meta">${ICON.plus}<b>Nueva meta</b><small>Máximo 2–3 a la vez</small></button></div>
      ${otras.length?`<h4 class="sub-h">Logradas y en pausa</h4><div class="metas-g peque">${otras.map(g=>tarjetaMeta(g)).join("")}</div>`:""}
      ${!S.metas.length?vacio("progreso","¿Qué quieres lograr?","Una meta con su próximo paso concreto. Mila te recordará avanzar.", btn("Crear meta","sheetOpen",'data-v="meta"',"pri")):""}`;
  } else {
    const d=new Date(); const m0=new Date(d.getFullYear(), d.getMonth(), 1); const ini=startWeek(m0); const reg = Object.fromEntries(S.animo.map(a=>[a.id,a]));
    const ult30 = [...Array(30)].map((_,k)=>{ const x=addDays(d,k-29); const a=reg[ymd(x)]; return a?moodDe(a.estado).v:null; });
    const dist = MOODS.map(m=>[m, S.animo.filter(a=>a.estado===m.k && a.id>=ymd(addDays(d,-30))).length]);
    const totD = sum(dist, x=>x[1]);
    let cel=""; for(let i=0;i<42;i++){ const x=addDays(ini,i); if(i>=35 && x.getMonth()!==m0.getMonth()) break; const a=reg[ymd(x)]; cel += `<div class="am-d ${x.getMonth()!==m0.getMonth()?"fuera":""} ${sameDay(x,d)?"hoy":""}" ${a?tipAttr(`${fmtDia(x)}: ${moodDe(a.estado).l}${a.nota?" · "+a.nota.slice(0,60):""}`):""}>${a?`<span class="cara" style="--c:${moodDe(a.estado).c}">${caraSVG(a.estado)}</span>`:`<small>${x.getDate()}</small>`}</div>`; }
    cuerpo = `<div class="animo-l">
      <section class="card"><div class="card-h"><h3>${capital(MESES[d.getMonth()])}</h3><div class="card-acc">${btn("Registrar hoy","sheetOpen",'data-v="animo"',"sm pri")}</div></div><div class="am-s">${["L","M","M","J","V","S","D"].map(x=>`<span>${x}</span>`).join("")}</div><div class="am-g">${cel}</div></section>
      <section class="card"><div class="card-h"><h3>Últimos 30 días</h3></div>${ult30.some(v=>v!=null) ? lineChart([{name:"Ánimo", color:"#8E6CFF", values:ult30}], {h:150, labels:[...Array(30)].map((_,k)=>{ const x=addDays(d,k-29); return x.getDate()===1||k===0||k===29?`${x.getDate()}/${x.getMonth()+1}`:""; }), fmt:v=>(MOODS.find(m=>m.v===Math.round(v))||{l:v}).l, max:5, min:1})
        + `<div class="dist">${dist.filter(x=>x[1]).map(([m,n])=>`<span style="flex:${n};background:${m.c}" ${tipAttr(`${m.l}: ${n} ${n===1?"día":"días"}`)}></span>`).join("")}</div><div class="ley-l">${dist.filter(x=>x[1]).map(([m,n])=>`<span class="ley"><i style="background:${m.c}"></i>${m.l} ${Math.round(n/totD*100)}%</span>`).join("")}</div>`
        : vacio("memoria","Tu mapa de ánimo empieza hoy","Registra cómo te sientes cada día; con el tiempo verás patrones (¿los lunes pesan más?).", btn("Registrar hoy","sheetOpen",'data-v="animo"',"pri sm"))}</section></div>`;
  }
  return `${cab("Hábitos y metas", "Lo que haces cada día construye lo que logras", tabs, "crecer")}${cuerpo}`;
};
function tarjetaMeta(g){
  const p = Number(g.progreso)||0; const dias = g.ultima_vez ? diffDays(pymd(g.ultima_vez), new Date()) : null; const c=catColor(areaCat(g.area||g.titulo));
  const lim = g.fecha_limite ? diffDays(new Date(), pymd(g.fecha_limite)) : null;
  return `<section class="card meta ${g.estado}" style="--c:${c}">
    <div class="mt-top">${ring(p/100,{size:64,label:p+"%",color:c})}<div class="grow"><h3>${esc(g.titulo)}</h3><small>${g.estado==="lograda"?"¡Lograda!":g.estado==="pausada"?"En pausa":(dias===0?"Avanzaste hoy":dias!=null?`Último avance ${hace(pymd(g.ultima_vez).getTime()).replace("hace ","hace ")}`:"Sin avances aún")}${lim!=null&&g.estado==="activa"?` · ${lim>=0?`quedan ${lim} días`:"fecha pasada"}`:""}</small></div><button type="button" class="ib sm" data-act="metaMenu" data-id="${g.id}">${ICON.more}</button></div>
    ${g.proxima_accion?`<div class="mt-paso"><small>Próximo paso</small><b>${esc(g.proxima_accion)}</b></div>`:`<button type="button" class="mt-paso vacio" data-act="metaEditar" data-id="${g.id}"><small>Próximo paso</small><b>Definir el siguiente paso pequeño</b></button>`}
    <input type="range" min="0" max="100" step="5" value="${p}" class="rango" data-act="metaProg" data-id="${g.id}" aria-label="Progreso" style="--p:${p}%">
    ${g.estado==="activa"?`<div class="mt-acc">${btn(ICON.plus+" Avance","metaAvance",`data-id="${g.id}"`,"sm")}${btn(ICON.star+" ¡Lograda!","metaLograda",`data-id="${g.id}"`,"sm")}</div>`:""}
    ${(g.avances||[]).length?`<div class="mt-hist">${(g.avances||[]).slice(-3).reverse().map(a=>`<span><i></i>${capital(relDia(a.fecha))}${a.texto?" · "+esc(a.texto.slice(0,60)):""}</span>`).join("")}</div>`:""}
  </section>`;
}
