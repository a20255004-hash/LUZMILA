/* =========================================================
   AGENDA · protagonista: día, 3 días, semana, mes y lista.
   Arrastra para mover, estira para cambiar duración,
   toca un hueco para crear.
   ========================================================= */
const Agenda = {
  drag:null,
  rango(){
    const a=S.agenda, d=startDay(a.date);
    if(a.view==="dia") return {dias:[d]};
    if(a.view==="3dias") return {dias:[0,1,2].map(i=>addDays(d,i))};
    if(a.view==="semana"){ const l=startWeek(d); return {dias:[...Array(7)].map((_,i)=>addDays(l,i))}; }
    if(a.view==="mes"){ const p=new Date(d.getFullYear(), d.getMonth(), 1); const ini=startWeek(p); const fin=addDays(startWeek(new Date(d.getFullYear(), d.getMonth()+1, 0)),6); const dias=[]; for(let x=ini; x<=fin; x=addDays(x,1)) dias.push(x); return {dias}; }
    return {dias:[...Array(30)].map((_,i)=>addDays(d,i))};
  },
  titulo(){
    const {dias}=this.rango(); const a=dias[0], b=dias[dias.length-1]; const v=S.agenda.view;
    if(v==="mes") return `${capital(MESES[S.agenda.date.getMonth()])} <span>${S.agenda.date.getFullYear()}</span>`;
    if(v==="dia") return `${capital(DIAS[a.getDay()])} ${a.getDate()} <span>de ${MESES[a.getMonth()]}</span>`;
    return a.getMonth()===b.getMonth() ? `${a.getDate()} – ${b.getDate()} <span>de ${MESES[a.getMonth()]}</span>` : `${a.getDate()} ${MESES[a.getMonth()].slice(0,3)} – ${b.getDate()} ${MESES[b.getMonth()].slice(0,3)}`;
  },
  mover(dir){ const a=S.agenda; const n = a.view==="dia"?1 : a.view==="3dias"?3 : a.view==="semana"?7 : a.view==="lista"?30 : 0;
    if(a.view==="mes") a.date = new Date(a.date.getFullYear(), a.date.getMonth()+dir, 1); else a.date = addDays(a.date, dir*n); render(); },
  montar(){
    const {dias}=this.rango(); const desde=ymd(dias[0]), hasta=ymd(dias[dias.length-1]);
    if(Cal.ok()) Cal.cargar(desde, hasta).catch(()=>{});
    const g = $(".ag-scroll"); if(g && !g.dataset.pos){ g.dataset.pos="1"; const h = dias.some(d=>sameDay(d,new Date())) ? Math.max(0,new Date().getHours()-2) : 7; g.scrollTop = h*S.agenda.hourH; }
    clearInterval(this.tick); this.tick = setInterval(()=>{ const l=$(".ahora-l"); if(!l){ clearInterval(this.tick); return; } const n=new Date(); l.style.top = ((n.getHours()*60+n.getMinutes())/60*S.agenda.hourH)+"px"; }, 60000);
  }
};
function layoutCols(evs){
  // reparte eventos superpuestos en columnas
  const res = new Map(); const ord = evs.slice().sort((a,b)=>a.ini-b.ini || (b.fin-b.ini)-(a.fin-a.ini));
  let grupo=[], finG=0;
  const cerrar = () => { const cols=[]; for(const e of grupo){ let c=cols.findIndex(f=>f<=e.ini); if(c<0){ c=cols.length; cols.push(0); } cols[c]=e.fin; res.set(e.id, {c}); } for(const e of grupo) res.get(e.id).n = cols.length; grupo=[]; };
  for(const e of ord){ if(grupo.length && e.ini>=finG){ cerrar(); finG=0; } grupo.push(e); finG = Math.max(finG, +e.fin); }
  if(grupo.length) cerrar(); return res;
}
function bloqueEv(e, col){
  const H=S.agenda.hourH; const top=(e.ini.getHours()*60+e.ini.getMinutes())/60*H; const dur=Math.max(15,(e.fin-e.ini)/60000); const h=Math.max(20, dur/60*H-2);
  const w = 100/col.n; const corto = h<38;
  return `<div class="ev ${e.tarea?"ev-tarea":""} ${corto?"corto":""} ${e.src==="g"?"g":""}" style="top:${top}px;height:${h}px;left:calc(${col.c*w}% + 2px);width:calc(${w}% - 4px);--c:${catColor(e.cat)}" data-ev="${esc(e.id)}" tabindex="0">
    <div class="ev-in"><b>${e.tarea?`<span class="ev-chk">${ICON.task}</span>`:""}${esc(e.titulo)}</b>${corto?"":`<small>${hhmm(e.ini)} – ${hhmm(e.fin)}${e.lugar?" · "+esc(e.lugar):""}</small>`}</div>
    ${e.propio!==false?`<i class="ev-resize" data-resize="1"></i>`:""}</div>`;
}
VISTAS.agenda = function(){
  const a=S.agenda, {dias}=Agenda.rango(); const hoy=new Date(); const H=a.hourH;
  const desde=ymd(dias[0]), hasta=ymd(dias[dias.length-1]);
  const conexion = !Cal.disponible() || !Cal.ok() ? `<button type="button" class="chip-g" data-act="gConectar">${ICON.google}<span>${Cal.disponible()?"Conectar Google Calendar":"Conecta Google en Ajustes"}</span></button>` : `<span class="chip-g ok">${ICON.google}<span>${S.cal.status==="error"?"Error: "+esc(S.cal.msg):"Sincronizado"}</span></span>`;
  const head = `<header class="ag-head">
      <div class="ag-tit"><h1>${Agenda.titulo()}</h1>${conexion}</div>
      <div class="ag-ctrl">
        <div class="ag-nav"><button type="button" class="ib" data-act="agPrev" aria-label="Anterior">${ICON.left}</button><button type="button" class="btn sm" data-act="agHoy">Hoy</button><button type="button" class="ib" data-act="agNext" aria-label="Siguiente">${ICON.right}</button></div>
        ${segmentos("agView", [["dia","Día"],["3dias","3 días"],["semana","Semana"],["mes","Mes"],["lista","Lista"]], a.view)}
        ${["dia","3dias","semana"].includes(a.view)?`<div class="ag-zoom"><button type="button" class="ib sm" data-act="agZoom" data-v="-1" aria-label="Alejar">${ICON.zoomout}</button><button type="button" class="ib sm" data-act="agZoom" data-v="1" aria-label="Acercar">${ICON.zoomin}</button></div>`:""}
        <button type="button" class="btn pri" data-act="sheetOpen" data-v="evento">${ICON.plus}<span>Nuevo</span></button>
      </div></header>`;
  let cuerpo="";
  if(a.view==="mes"){
    const evs = eventosEntre(desde, hasta); const mesAct = a.date.getMonth();
    cuerpo = `<div class="mes"><div class="mes-h">${["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"].map(x=>`<span>${x}</span>`).join("")}</div><div class="mes-g">${dias.map(d=>{ const s=ymd(d); const del=evs.filter(e=>ymd(e.ini)<=s && ymd(e.allDay?addDays(e.fin,-1):e.fin)>=s); const tsS=S.tareas.filter(x=>x.estado!=="hecha"&&x.vence===s&&!x.hora);
      return `<div class="mes-d ${d.getMonth()!==mesAct?"fuera":""} ${sameDay(d,hoy)?"hoy":""}" data-act="agendaDia" data-v="${s}"><span class="mes-n">${d.getDate()}</span>
        ${del.slice(0,3).map(e=>`<span class="pill" style="--c:${catColor(e.cat)}" data-act="evAbrir" data-id="${esc(e.id)}">${e.allDay?"":`<i>${hhmm(e.ini)}</i>`}${esc(e.titulo)}</span>`).join("")}
        ${tsS.length && del.length<3?`<span class="pill tarea">${ICON.task}${plural(tsS.length,"tarea","tareas")}</span>`:""}${del.length>3?`<span class="mas">+${del.length-3}</span>`:""}</div>`; }).join("")}</div></div>`;
  } else if(a.view==="lista"){
    const evs = eventosEntre(desde, hasta).filter(e=>!e.alerta);
    const grupos = dias.map(d=>{ const s=ymd(d); return [d, evs.filter(e=>ymd(e.ini)===s || (e.allDay && ymd(e.ini)<=s && ymd(addDays(e.fin,-1))>=s))]; }).filter(([,l])=>l.length);
    cuerpo = grupos.length ? `<div class="ag-lista">${grupos.map(([d,l])=>`<div class="al-dia ${sameDay(d,hoy)?"hoy":""}"><div class="al-f"><b>${d.getDate()}</b><small>${DIAS_C[d.getDay()]} · ${MESES[d.getMonth()].slice(0,3)}</small></div><div class="al-evs">${l.map(e=>`<button type="button" class="al-ev" data-act="evAbrir" data-id="${esc(e.id)}" style="--c:${catColor(e.cat)}"><span class="al-h">${e.allDay?"Todo el día":hhmm(e.ini)+" – "+hhmm(e.fin)}</span><b>${esc(e.titulo)}</b><small>${e.tarea?"Tarea":CATS[e.cat]?.n||""}${e.lugar?" · "+esc(e.lugar):""}</small></button>`).join("")}</div></div>`).join("")}</div>`
      : vacio("agenda","Treinta días libres","No hay nada agendado. Dile a Mila «agenda clase de tesis el martes a las 7» o toca «Nuevo».", btn("Nuevo evento","sheetOpen",'data-v="evento"',"pri sm"));
  } else {
    const todos = eventosEntre(desde, hasta);
    const cols = dias.map(d=>{ const s=ymd(d); const del = todos.filter(e=>!e.allDay && ymd(e.ini)===s && !e.alerta); const lay = layoutCols(del);
      return `<div class="ag-col ${sameDay(d,hoy)?"hoy":""} ${d.getDay()===0||d.getDay()===6?"finde":""}" data-dia="${s}">${del.map(e=>bloqueEv(e, lay.get(e.id))).join("")}${sameDay(d,hoy)?`<div class="ahora-l" style="top:${(hoy.getHours()*60+hoy.getMinutes())/60*H}px"><i></i></div>`:""}</div>`; }).join("");
    const allday = dias.map(d=>{ const s=ymd(d); const del = todos.filter(e=>(e.allDay && ymd(e.ini)<=s && ymd(addDays(e.fin,-1))>=s) || e.alerta && ymd(e.ini)===s); const tsS = S.tareas.filter(x=>x.estado!=="hecha" && x.vence===s && !x.hora);
      return `<div class="ad-c">${del.map(e=>`<span class="pill" style="--c:${catColor(e.cat)}" data-act="evAbrir" data-id="${esc(e.id)}">${esc(e.titulo)}</span>`).join("")}${tsS.slice(0,3).map(x=>`<span class="pill tarea" data-act="tareaEditar" data-id="${x.id}" draggable="false">${ICON.task}${esc(x.titulo)}</span>`).join("")}${tsS.length>3?`<span class="mas">+${tsS.length-3}</span>`:""}</div>`; }).join("");
    const horas = [...Array(24)].map((_,h)=>`<div class="ag-hora" style="height:${H}px"><span>${h===0?"":pad(h)+":00"}</span></div>`).join("");
    cuerpo = `<div class="ag-grid" style="--n:${dias.length};--H:${H}px">
      <div class="ag-dias"><div class="ag-gut"></div>${dias.map(d=>`<button type="button" class="ag-dia ${sameDay(d,hoy)?"hoy":""}" data-act="agendaDia" data-v="${ymd(d)}"><small>${DIAS_C[d.getDay()]}</small><b>${d.getDate()}</b></button>`).join("")}</div>
      <div class="ag-allday"><div class="ag-gut"><small>todo el día</small></div>${allday}</div>
      <div class="ag-scroll"><div class="ag-body" style="height:${24*H}px"><div class="ag-gut horas">${horas}</div><div class="ag-cols">${cols}<div class="ag-lineas">${[...Array(24)].map(()=>`<i style="height:${H}px"></i>`).join("")}</div></div></div></div>
    </div>`;
  }
  // panel lateral: mini mes y resumen del día seleccionado
  const sel = startDay(a.date); const selS = ymd(sel);
  const delDia = eventosEntre(selS, selS).filter(e=>!e.alerta); const tsDia = S.tareas.filter(x=>x.estado!=="hecha" && x.vence===selS);
  const libres = huecosLibres(selS).reduce((s,[x,y])=>s+(y-x)/60000,0);
  const lateral = `<aside class="ag-side">
    ${miniMes(a.date)}
    <section class="card ag-resumen"><div class="card-h"><h3>${capital(relDia(sel))}</h3></div>
      <div class="ag-stats"><div><b>${delDia.filter(e=>!e.tarea).length}</b><small>eventos</small></div><div><b>${tsDia.length}</b><small>tareas</small></div><div><b>${Math.round(libres/60*10)/10}h</b><small>libres</small></div></div>
      ${tsDia.filter(x=>!x.hora).length?`<p class="mini">Sin hora: arrástralas a un hueco o pide «organiza mi día».</p><div class="lista-tareas">${tsDia.filter(x=>!x.hora).slice(0,5).map(x=>itemTarea(x,{compacto:true})).join("")}</div>`:""}
      <button type="button" class="btn sm full" data-act="decir" data-v="organiza mi ${sameDay(sel,new Date())?"día":"día "+relDia(sel)}">${ICON.spark} Organiza mi día</button>
    </section>
    <section class="card ag-leyenda"><div class="card-h"><h3>Categorías</h3></div>${Object.entries(CATS).filter(([k])=>k!=="otros").map(([k,c])=>`<span class="ley"><i style="background:${c.c}"></i>${c.n}</span>`).join("")}</section>
  </aside>`;
  return `<div class="ag ag-v-${a.view}">${head}<div class="ag-wrap">${lateral}<div class="ag-main card">${cuerpo}</div></div></div>`;
};
function miniMes(fecha){
  const d=startDay(fecha); const p=new Date(d.getFullYear(), d.getMonth(), 1); const ini=startWeek(p); const hoy=new Date();
  const conEv = new Set(eventosEntre(ymd(ini), ymd(addDays(ini,41))).map(e=>ymd(e.ini)));
  let cel=""; for(let i=0;i<42;i++){ const x=addDays(ini,i); const s=ymd(x); cel += `<button type="button" class="mm-d ${x.getMonth()!==p.getMonth()?"fuera":""} ${sameDay(x,hoy)?"hoy":""} ${sameDay(x,d)?"sel":""}" data-act="agendaDia" data-v="${s}">${x.getDate()}${conEv.has(s)?"<i></i>":""}</button>`; }
  return `<section class="card minimes"><div class="mm-h"><b>${capital(MESES[p.getMonth()])} ${p.getFullYear()}</b><span><button type="button" class="ib sm" data-act="mmPrev">${ICON.left}</button><button type="button" class="ib sm" data-act="mmNext">${ICON.right}</button></span></div><div class="mm-s">${DIAS_L.slice(1).concat(DIAS_L[0]).map(x=>`<span>${x}</span>`).join("")}</div><div class="mm-g">${cel}</div></section>`;
}

/* ---------- arrastrar, estirar y crear con el puntero ---------- */
(function(){
  let st=null;
  const snap = m => Math.round(m/15)*15;
  const colEn = x => $$(".ag-col").find(c=>{ const r=c.getBoundingClientRect(); return x>=r.left && x<=r.right; });
  const minEn = (col, y) => { const r=col.getBoundingClientRect(); return clamp(snap((y-r.top)/S.agenda.hourH*60), 0, 24*60-15); };
  document.addEventListener("pointerdown", e=>{
    if(S.route!=="agenda" || e.button>0) return;
    const ev = e.target.closest(".ev"); const col = e.target.closest(".ag-col");
    if(ev){ const id=ev.dataset.ev; const obj=buscarEvento(id); if(!obj) return;
      st = {tipo: e.target.dataset.resize ? "resize" : "mover", id, obj, el:ev, x0:e.clientX, y0:e.clientY, activo:false, dur:(obj.fin-obj.ini)/60000, off: minEn(ev.closest(".ag-col"), e.clientY) - (obj.ini.getHours()*60+obj.ini.getMinutes())};
      ev.setPointerCapture?.(e.pointerId); return; }
    if(col && !e.target.closest(".pill")){ st = {tipo:"crear", col, x0:e.clientX, y0:e.clientY, m0:minEn(col, e.clientY), activo:false}; }
  });
  document.addEventListener("pointermove", e=>{
    if(!st) return; const dx=e.clientX-st.x0, dy=e.clientY-st.y0;
    if(!st.activo){ if(Math.hypot(dx,dy)<6) return; if(st.tipo==="crear" && e.pointerType!=="mouse"){ st=null; return; } st.activo=true; Agenda.drag=true; document.body.classList.add("arrastrando"); if(st.el) st.el.classList.add("drag"); }
    e.preventDefault();
    const H=S.agenda.hourH;
    if(st.tipo==="mover"){ const col = colEn(e.clientX) || st.el.parentElement; if(col!==st.el.parentElement) col.appendChild(st.el);
      const m = clamp(minEn(col, e.clientY) - snap(st.off), 0, 24*60-st.dur); st.el.style.top = (m/60*H)+"px"; st.el.style.left="2px"; st.el.style.width="calc(100% - 4px)"; st.nuevo={dia:col.dataset.dia, m};
      st.el.querySelector("small") && (st.el.querySelector("small").textContent = `${pad(Math.floor(m/60))}:${pad(m%60)} – ${pad(Math.floor((m+st.dur)/60)%24)}:${pad((m+st.dur)%60)}`); }
    else if(st.tipo==="resize"){ const col=st.el.parentElement; const ini=st.obj.ini.getHours()*60+st.obj.ini.getMinutes(); const m = Math.max(ini+15, minEn(col, e.clientY)); st.el.style.height=((m-ini)/60*H-2)+"px"; st.nuevo={fin:m}; }
    else if(st.tipo==="crear"){ const m=minEn(st.col, e.clientY); const a=Math.min(st.m0,m), b=Math.max(st.m0+15,m+15); let g=st.col.querySelector(".ev-nuevo"); if(!g){ g=document.createElement("div"); g.className="ev ev-nuevo"; st.col.appendChild(g); } g.style.top=(a/60*H)+"px"; g.style.height=((b-a)/60*H)+"px"; g.innerHTML=`<div class="ev-in"><b>Nuevo</b><small>${pad(Math.floor(a/60))}:${pad(a%60)} – ${pad(Math.floor(b/60))}:${pad(b%60)}</small></div>`; st.nuevo={a,b}; }
  }, {passive:false});
  document.addEventListener("pointerup", async e=>{
    if(!st) return; const s=st; st=null; document.body.classList.remove("arrastrando");
    if(!s.activo){ Agenda.drag=null;
      if(s.tipo==="mover"||s.tipo==="resize"){ abrirSheet("evDetalle", {id:s.id}); }
      else if(s.tipo==="crear"){ const m=s.m0; const f=s.col.dataset.dia; abrirSheet("evento", {fecha:f, hora:`${pad(Math.floor(m/60))}:${pad(Math.floor((m%60)/30)*30)}`}); }
      return; }
    Agenda.drag=null;
    try{
      if(s.tipo==="mover" && s.nuevo){ const ini = pymd(s.nuevo.dia); ini.setHours(Math.floor(s.nuevo.m/60), s.nuevo.m%60, 0, 0); if(+ini!==+s.obj.ini){ const r=await A.editarEvento(s.id, {ini:ini.toISOString()}); toast(`«${s.obj.titulo}» → ${relDia(ini)} ${hhmm(ini)}`, {undo:r.log, icon:ICON.cal}); } }
      else if(s.tipo==="resize" && s.nuevo){ const fin = new Date(s.obj.ini); fin.setHours(0,0,0,0); fin.setMinutes(s.nuevo.fin); const r=await A.editarEvento(s.id, {ini:s.obj.ini.toISOString(), fin:fin.toISOString()}); toast(`«${s.obj.titulo}» hasta las ${hhmm(fin)}`, {undo:r.log, icon:ICON.clock}); }
      else if(s.tipo==="crear" && s.nuevo){ const f=s.col.dataset.dia; abrirSheet("evento", {fecha:f, hora:`${pad(Math.floor(s.nuevo.a/60))}:${pad(s.nuevo.a%60)}`, fin:`${pad(Math.floor(s.nuevo.b/60)%24)}:${pad(s.nuevo.b%60)}`}); }
    }catch(err){ toast("No pude moverlo: "+errMsg(err)); }
    render(true);
  });
  document.addEventListener("keydown", e=>{ if(S.route!=="agenda" || /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName) || !$("#sheetWrap").hidden) return; if(e.key==="ArrowLeft") Agenda.mover(-1); if(e.key==="ArrowRight") Agenda.mover(1); if(e.key==="t") { S.agenda.date=new Date(); render(); } });
})();
