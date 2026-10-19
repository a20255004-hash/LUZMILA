/* =========================================================
   DINERO · mes, categorías, presupuestos y movimientos
   ========================================================= */
const CAT_COL = {"Comida":"#F59E3F","Pasajes":"#3A8DDE","Apoyo al hogar":"#1FA97A","Mascotas":"#C2702B","Deudas":"#E0565B","Cuidado personal":"#E06AA8","Recargas":"#14A3B8","Estudios":"#7C5CFF","Salud":"#2BB673","Ocio":"#F2C230","Inversión":"#5B6CF0","Otros":"#9A94B5"};
const colorCat = c => CAT_COL[c] || `hsl(${[...String(c||"")].reduce((s,ch)=>s+ch.charCodeAt(0),0)%360} 55% 58%)`;
const CAT_IC = {"Comida":"🍲","Pasajes":"🚌","Apoyo al hogar":"🏠","Mascotas":"🐱","Deudas":"💳","Cuidado personal":"🧴","Recargas":"📱","Estudios":"📚","Salud":"💊","Ocio":"🎬","Inversión":"📈","Otros":"✨"};
const mesLabel = m => { const [y,mm]=m.split("-").map(Number); return `${capital(MESES[mm-1])} ${y}`; };
const mesMas = (m,n) => { const [y,mm]=m.split("-").map(Number); const d=new Date(y,mm-1+n,1); return ymd(d).slice(0,7); };
function filaMov(m){
  return `<div class="mov ${m.tipo}" data-id="${m.id}">
    <span class="mov-ic" style="--c:${m.tipo==="ingreso"?"#1FA97A":colorCat(m.categoria)}">${m.tipo==="ingreso"?"＋":(CAT_IC[m.categoria]||"•")}</span>
    <button type="button" class="mov-c" data-act="movEditar" data-id="${m.id}"><b>${esc(m.concepto)}</b><small>${m.tipo==="ingreso"?(m.fuente?esc(m.fuente)+" · ":"")+"Ingreso":esc(m.categoria||"Sin categoría")} · ${esc(m.metodo||"")}${m.estado==="pendiente"?` · <em class="pend">por confirmar</em>`:""}${m.hoja?.tab?` · ${ICON.sheet}`:""}</small></button>
    <b class="mov-m">${m.tipo==="ingreso"?"+":"−"}${money(m.monto)}</b>
    <button type="button" class="ib sm" data-act="movBorrar" data-id="${m.id}" title="Borrar">${ICON.trash}</button>
  </div>`;
}
VISTAS.dinero = function(){
  const D=S.dinero, mes=D.mes; const {g,i,ms} = totalesMes(mes); const prev = totalesMes(mesMas(mes,-1));
  const gastos = ms.filter(m=>m.tipo==="gasto");
  const porCat = Object.entries(groupBy(gastos, m=>m.categoria||"Otros")).map(([c,l])=>({l:c, v:round2(sum(l,m=>m.monto)), c:colorCat(c)})).sort((a,b)=>b.v-a.v);
  const [y,mm] = mes.split("-").map(Number); const nd = new Date(y,mm,0).getDate(); const hoy=new Date(); const esActual = mes===ymd(hoy).slice(0,7);
  const diario = [...Array(nd)].map((_,k)=>{ const s=`${mes}-${pad(k+1)}`; return round2(sum(gastos.filter(m=>m.fecha===s),m=>m.monto)); });
  const acum = []; diario.reduce((s,v,k)=>{ const t=round2(s+v); acum.push(esActual && k+1>hoy.getDate() ? null : t); return t; },0);
  const prevG = totalesMes(mesMas(mes,-1)).ms.filter(m=>m.tipo==="gasto"); const acumP=[]; [...Array(nd)].reduce((s,_,k)=>{ const t=round2(s+sum(prevG.filter(m=>Number(m.fecha.slice(8))===k+1),m=>m.monto)); acumP.push(t); return t; },0);
  const meses6 = [...Array(6)].map((_,k)=>mesMas(mes,k-5)); const t6 = meses6.map(m=>totalesMes(m));
  const pres = S.profile.presupuestos||{}; const presCats = Object.keys(pres).filter(c=>pres[c]>0);
  let lista = ms.slice().filter(m=>D.tipo==="todos"||m.tipo===D.tipo).filter(m=>!D.cat || m.categoria===D.cat).filter(m=>!D.q || norm(m.concepto+" "+m.categoria+" "+m.fuente+" "+m.metodo).includes(norm(D.q))).sort((a,b)=>a.fecha<b.fecha?1:a.fecha>b.fecha?-1:(b.creado||0)-(a.creado||0));
  const porDia = groupBy(lista, m=>m.fecha);
  const pendientes = S.movimientos.filter(m=>m.estado==="pendiente");
  const delta = (a,b) => b ? `<span class="delta ${a>b?"up":"down"}">${a>b?"▲":"▼"} ${Math.abs(Math.round((a-b)/b*100))}%</span>` : "";
  const ahorro = i ? Math.round((i-g)/i*100) : null;
  return `
  ${cab(`Dinero`, `<span class="mes-nav"><button type="button" class="ib sm" data-act="dMes" data-v="-1">${ICON.left}</button><b>${mesLabel(mes)}</b><button type="button" class="ib sm" data-act="dMes" data-v="1">${ICON.right}</button></span>`, btn(ICON.plus+"<span>Gasto</span>","sheetOpen",'data-v="mov" data-tipo="gasto"',"pri")+btn(ICON.plus+"<span>Ingreso</span>","sheetOpen",'data-v="mov" data-tipo="ingreso"',""), "dinero")}
  <div class="kpis">
    <div class="kpi"><small>Ingresos</small><b class="pos">${money(i)}</b>${delta(i,prev.i)}</div>
    <div class="kpi"><small>Gastos</small><b class="neg">${money(g)}</b>${delta(g,prev.g)}</div>
    <div class="kpi"><small>Balance</small><b>${money(i-g)}</b><span class="mini">${i-g>=0?"a tu favor":"en rojo"}</span></div>
    <div class="kpi"><small>Ahorro</small><b>${ahorro==null?"—":ahorro+"%"}</b><span class="mini">de lo que entró</span></div>
  </div>
  <div class="din-grid">
    <section class="card d-cat"><div class="card-h"><h3>¿En qué se fue?</h3>${D.cat?`<div class="card-acc"><button type="button" class="link" data-act="dCat" data-v="">Quitar filtro ${ICON.x}</button></div>`:""}</div>
      ${porCat.length ? `<div class="cat-flex">${donut(porCat, {center:money0(g), sub:"gastado", active:D.cat})}<div class="cat-ley">${porCat.map(p=>`<button type="button" class="cl ${D.cat===p.l?"on":""} ${D.cat&&D.cat!==p.l?"dim":""}" data-act="dCat" data-v="${esc(p.l)}"><i style="background:${p.c}"></i><span>${esc(p.l)}</span><b>${money0(p.v)}</b><small>${Math.round(p.v/g*100)}%</small></button>`).join("")}</div></div>`
        : vacio("dinero","Sin gastos este mes","Cuando gastes, díselo a Mila: «gasté 6 soles en pasaje». Aquí verás en qué se va tu dinero.")}
    </section>
    <section class="card d-ritmo"><div class="card-h"><h3>Ritmo de gasto</h3><div class="card-acc"><span class="ley"><i style="background:#7C5CFF"></i>${capital(MESES[mm-1])}</span><span class="ley"><i style="background:#B9AFD8"></i>Mes anterior</span></div></div>
      ${g||prev.g ? lineChart([{name:"Este mes", color:"#7C5CFF", values:acum},{name:"Mes anterior", color:"#B9AFD8", values:acumP, dash:true}], {h:170, labels:[...Array(nd)].map((_,k)=>String(k+1)), fmt:money})
        + barChart(diario.map((v,k)=>({l: (k+1)%5===0||k===0?String(k+1):"", v, tip:`${k+1} ${MESES[mm-1].slice(0,3)}: ${money(v)}`})), {h:90, color:"#F59E3F", highlight: esActual?hoy.getDate()-1:-1})
        : `<p class="mini">Aún no hay datos para comparar.</p>`}
    </section>
    <section class="card d-pres"><div class="card-h"><h3>Presupuestos</h3><div class="card-acc"><button type="button" class="link" data-act="sheetOpen" data-v="presupuestos">${presCats.length?"Editar":"Definir"} ${ICON.right}</button></div></div>
      ${presCats.length ? presCats.map(c=>{ const u=round2(sum(gastos.filter(m=>m.categoria===c),m=>m.monto)); const p=u/pres[c]; return `<div class="pres"><div class="pres-t"><span><i style="background:${colorCat(c)}"></i>${esc(c)}</span><b>${money0(u)} <small>/ ${money0(pres[c])}</small></b></div>${barraProg(p, p>1?"var(--coral)":p>.8?"var(--ambar)":colorCat(c))}<small class="mini">${p>1?`Te pasaste por ${money0(u-pres[c])}`:`Te quedan ${money0(pres[c]-u)}`}</small></div>`; }).join("")
        : `<p class="mini">Ponle un tope mensual a tus categorías (por ejemplo, Comida S/ 300) y Mila te avisará cuando te acerques.</p>${btn("Definir presupuestos","sheetOpen",'data-v="presupuestos"',"sm pri")}`}
    </section>
    <section class="card d-6m"><div class="card-h"><h3>Últimos 6 meses</h3></div>
      ${t6.some(x=>x.g||x.i) ? lineChart([{name:"Ingresos", color:"#1FA97A", values:t6.map(x=>x.i)},{name:"Gastos", color:"#F0646B", values:t6.map(x=>x.g)}], {h:160, labels:meses6.map(m=>MESES[Number(m.slice(5))-1].slice(0,3)), fmt:money, area:false}) : `<p class="mini">Con más meses registrados verás tu tendencia aquí.</p>`}
    </section>
    ${hojaCard()}
  </div>
  ${pendientes.length?`<section class="card"><div class="card-h"><span class="card-ic">${ICON.alert}</span><h3>Por confirmar</h3></div>${pendientes.map(m=>`<div class="pend-row">${filaMov(m)}<button type="button" class="btn sm pri" data-act="movConfirmar" data-id="${m.id}">Confirmar</button></div>`).join("")}</section>`:""}
  <section class="card d-movs"><div class="card-h"><h3>Movimientos</h3><div class="card-acc">${segmentos("dTipo", [["todos","Todos"],["gasto","Gastos"],["ingreso","Ingresos"]], D.tipo)}<label class="buscar">${ICON.search}<input id="dBuscar" placeholder="Buscar" value="${esc(D.q)}"></label></div></div>
    ${lista.length ? Object.entries(porDia).map(([d,l])=>`<div class="mov-dia"><h4>${capital(relDia(d))}<span>${l.some(m=>m.tipo==="gasto")?"−"+money(sum(l.filter(m=>m.tipo==="gasto"),m=>m.monto)):""}</span></h4>${l.map(filaMov).join("")}</div>`).join("") : `<p class="mini">${D.cat||D.q?"Nada coincide con el filtro.":"No hay movimientos en "+mesLabel(mes)+"."}</p>`}
  </section>`;
};
