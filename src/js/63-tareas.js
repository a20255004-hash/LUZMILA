/* =========================================================
   TAREAS · lista inteligente y tablero
   ========================================================= */
function gruposTareas(lista){
  const hoy=todayStr(), man=ymd(addDays(new Date(),1)), sem=ymd(addDays(new Date(),7));
  const g = {atrasadas:[], hoy:[], manana:[], semana:[], luego:[], sinfecha:[]};
  for(const x of lista){ if(!x.vence) g.sinfecha.push(x); else if(x.vence<hoy) g.atrasadas.push(x); else if(x.vence===hoy) g.hoy.push(x); else if(x.vence===man) g.manana.push(x); else if(x.vence<=sem) g.semana.push(x); else g.luego.push(x); }
  for(const k in g) g[k] = priorizar(g[k]);
  return g;
}
const GRUPO_N = {atrasadas:"Atrasadas", hoy:"Hoy", manana:"Mañana", semana:"Esta semana", luego:"Más adelante", sinfecha:"Sin fecha"};
VISTAS.tareas = function(){
  const U=S.tareasUI; const hoy=todayStr();
  const areas = [...new Set([...S.profile.areas, ...S.tareas.map(x=>x.area).filter(Boolean)])];
  let pend = S.tareas.filter(x=>x.estado!=="hecha"); const hechas = S.tareas.filter(x=>x.estado==="hecha").sort((a,b)=>(b.hecha_en||0)-(a.hecha_en||0));
  if(U.area) pend = pend.filter(x=>norm(x.area)===norm(U.area));
  if(U.q) pend = pend.filter(x=>norm(x.titulo+" "+x.notas).includes(norm(U.q)));
  const g = gruposTareas(pend);
  const semana = [...Array(7)].map((_,k)=>{ const d=addDays(new Date(),k-6); return {d, n:hechas.filter(x=>x.hecha_en && ymd(new Date(x.hecha_en))===ymd(d)).length}; });
  const totSem = sum(semana, x=>x.n);
  let lista = "";
  const filtros = {hoy:["atrasadas","hoy"], proximas:["manana","semana","luego"], todas:["atrasadas","hoy","manana","semana","luego","sinfecha"], sinfecha:["sinfecha"]};
  if(U.filtro==="hechas"){
    const porDia = groupBy(hechas.slice(0,60), x=>ymd(new Date(x.hecha_en||x.creado||Date.now())));
    lista = Object.keys(porDia).length ? Object.entries(porDia).map(([d,l])=>`<div class="t-grupo"><h4>${capital(relDia(d))} <span>${l.length}</span></h4><div class="lista-tareas">${l.map(x=>itemTarea(x)).join("")}</div></div>`).join("")
      : vacio("tareas","Aún no completas tareas","Cuando taches una, aparecerá aquí con su fecha. ¡La primera es la más difícil!");
  } else if(U.vista==="tablero"){
    const cols = [["sinfecha","Bandeja"],["atrasadas","Atrasadas"],["hoy","Hoy"],["manana","Mañana"],["semana","Esta semana"],["luego","Más adelante"]].filter(([k])=>k!=="atrasadas"||g.atrasadas.length);
    lista = `<div class="tablero">${cols.map(([k,n])=>`<div class="tb-col" data-drop="${k}"><div class="tb-h"><b>${n}</b><span>${g[k].length}</span></div><div class="tb-l">${g[k].map(x=>`<div class="tb-card pr-${x.prioridad}" draggable="true" data-drag="${x.id}">${itemTarea(x,{compacto:true})}</div>`).join("")||`<p class="tb-vacio">Suelta aquí</p>`}</div></div>`).join("")}</div>`;
  } else {
    const ks = filtros[U.filtro] || filtros.hoy; const total = sum(ks, k=>g[k].length);
    lista = total ? ks.filter(k=>g[k].length).map(k=>`<div class="t-grupo ${k}"><h4>${GRUPO_N[k]} <span>${g[k].length}</span>${k==="atrasadas"?`<button type="button" class="link" data-act="decir" data-v="pasa mis tareas vencidas para hoy">Pasar a hoy</button>`:""}</h4><div class="lista-tareas">${g[k].map(x=>itemTarea(x)).join("")}</div></div>`).join("")
      : vacio("tareas", U.filtro==="hoy"?"Nada para hoy":"Sin tareas aquí", U.filtro==="hoy"?"Tienes el día libre de pendientes. ¿Adelantamos algo de la semana?":"Escribe arriba o dile a Mila «tengo que entregar el informe el viernes».");
  }
  return `
  ${cab("Tareas", `${plural(pend.length,"pendiente","pendientes")} · ${plural(totSem,"completada","completadas")} esta semana`, segmentos("tVista", [["lista",ICON.list+"<span>Lista</span>"],["tablero",ICON.board+"<span>Tablero</span>"]], U.vista) + btn(ICON.plus+"<span>Nueva</span>","sheetOpen",'data-v="tarea"',"pri"), "tareas")}
  <form class="quickadd card" data-form="quickTarea"><span class="qa-ic">${ICON.plus}</span><input name="t" placeholder="Agrega una tarea: «leer capítulo 2 mañana a las 8 #Tesis urgente»" autocomplete="off"><button type="submit" class="btn pri sm">Agregar</button></form>
  <div class="t-barra">
    <div class="chips">${[["hoy","Hoy",g.atrasadas.length+g.hoy.length],["proximas","Próximas",g.manana.length+g.semana.length+g.luego.length],["sinfecha","Sin fecha",g.sinfecha.length],["todas","Todas",pend.length],["hechas","Hechas",hechas.length]].map(([v,l,n])=>`<button type="button" class="chip ${U.filtro===v?"on":""}" data-act="tFiltro" data-v="${v}">${l}<span>${n}</span></button>`).join("")}</div>
    <div class="chips areas">${areas.map(a=>`<button type="button" class="chip area ${norm(U.area)===norm(a)?"on":""}" style="--c:${catColor(areaCat(a))}" data-act="tArea" data-v="${esc(a)}">${esc(a)}</button>`).join("")}</div>
    <label class="buscar">${ICON.search}<input id="tBuscar" placeholder="Buscar" value="${esc(U.q)}"></label>
  </div>
  <div class="t-layout">
    <div class="t-lista">${lista}</div>
    <aside class="t-side">
      <section class="card"><div class="card-h"><h3>Tu ritmo</h3></div><div class="ritmo">${semana.map(x=>`<div ${tipAttr(fmtDia(x.d)+": "+plural(x.n,"tarea","tareas"))}><span class="r-b"><i style="height:${x.n/Math.max(1,...semana.map(y=>y.n))*100}%"></i></span><small>${DIAS_L[x.d.getDay()]}</small></div>`).join("")}</div>
        <p class="mini">${totSem ? `Completaste ${plural(totSem,"tarea","tareas")} en 7 días.${totSem>=10?" ¡Imparable!":""}` : "Esta semana aún no tachas tareas. Empieza por la más pequeña."}</p></section>
      <section class="card"><div class="card-h"><h3>Por área</h3></div>${areas.map(a=>{ const n=S.tareas.filter(x=>x.estado!=="hecha" && norm(x.area)===norm(a)).length; return n?`<div class="barra-area"><span>${esc(a)}</span>${barraProg(n/Math.max(1,pend.length), catColor(areaCat(a)))}<b>${n}</b></div>`:""; }).join("") || `<p class="mini">Agrega #Tesis, #Prácticas… al escribir una tarea para agruparlas.</p>`}</section>
    </aside>
  </div>`;
};
// arrastrar tarjetas en el tablero (escritorio)
document.addEventListener("dragstart", e=>{ const c=e.target.closest?.("[data-drag]"); if(c){ e.dataTransfer.setData("text/plain", c.dataset.drag); c.classList.add("drag"); } });
document.addEventListener("dragover", e=>{ const col=e.target.closest?.("[data-drop]"); if(col){ e.preventDefault(); $$(".tb-col.over").forEach(x=>x!==col&&x.classList.remove("over")); col.classList.add("over"); } });
document.addEventListener("drop", async e=>{ const col=e.target.closest?.("[data-drop]"); if(!col) return; e.preventDefault(); col.classList.remove("over"); const id=e.dataTransfer.getData("text/plain");
  const k=col.dataset.drop; const v = {sinfecha:"", hoy:todayStr(), manana:ymd(addDays(new Date(),1)), semana:ymd(addDays(new Date(),3)), luego:ymd(addDays(new Date(),8)), atrasadas:null}[k]; if(v===null || v===undefined) return;
  const r = await A.editarTarea(id, {vence:v}); toast(v?`Movida a ${relDia(v)}`:"Movida a la bandeja", {undo:r.log}); });
