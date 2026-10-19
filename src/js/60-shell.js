/* =========================================================
   Estructura de la app: navegación superior (computadora),
   barra inferior (celular), panel de Mila, hojas y tema
   ========================================================= */
const RUTAS = [
  {id:"hoy", n:"Inicio", ic:"home"}, {id:"agenda", n:"Agenda", ic:"cal"}, {id:"tareas", n:"Tareas", ic:"task"},
  {id:"crecer", n:"Hábitos y metas", corto:"Hábitos", ic:"sprout"}, {id:"dinero", n:"Dinero", ic:"wallet"},
  {id:"recuerdos", n:"Diario", ic:"memory"}, {id:"frases", n:"Frases", ic:"quote"}, {id:"ciclo", n:"Mi ciclo", ic:"drop"},
  {id:"memoria", n:"Lo que sé de ti", corto:"Memoria", ic:"brain", mas:true}, {id:"fuentes", n:"Mis hojas", ic:"sheet", mas:true},
  {id:"progreso", n:"Progreso", ic:"chart", mas:true}
];
const VISTAS = {};
function go(ruta){
  if(ruta==="mila"){ abrirChat(true); return; }
  if(!VISTAS[ruta]) ruta="hoy";
  S.route = ruta; try{ history.replaceState(null,"","#"+ruta); }catch{}
  if(innerWidth<1400) abrirChat(false);
  cerrarMenuMas();
  $("#main")?.scrollTo?.({top:0}); render(true); haptic(6);
}
function abrirChat(on){ S.ui.chatOpen = on ?? !S.ui.chatOpen; document.body.classList.toggle("chat-open", S.ui.chatOpen); if(S.ui.chatOpen){ pintarChat(); setTimeout(()=>{ const l=$("#chatlog"); if(l) l.scrollTop=l.scrollHeight; if(innerWidth>=760) $("#q")?.focus(); }, 60); } }
function cerrarMenuMas(){ const m=$("#menuMas"); if(m) m.hidden=true; $("#btnMas")?.setAttribute("aria-expanded","false"); }

let renderQ=false, renderFull=false;
function render(full){ if(full) renderFull=true; if(renderQ) return; renderQ=true; requestAnimationFrame(()=>{ renderQ=false; const f=renderFull; renderFull=false; try{ pintar(f); }catch(e){ console.error("render", e); } }); }
function pintar(full){
  if(!$("#main")) return;
  pintarNav();
  if(Agenda.drag) return;
  const ae = document.activeElement; const main=$("#main");
  if(!full && ae && main.contains(ae) && /INPUT|TEXTAREA|SELECT/.test(ae.tagName)){ S.pendRender=true; return; }
  const v = VISTAS[S.route] || VISTAS.hoy; const sc = main.scrollTop;
  main.innerHTML = `<div class="vista v-${S.route}">${v()}</div>`;
  if(!full) main.scrollTop = sc;
  despuesDePintar();
  pintarChat(true);
}
function despuesDePintar(){ if(S.route==="agenda") Agenda.montar(); if(S.route==="hoy") Hoy.montar?.(); for(const s of $$(".mila-host")) if(!s.firstChild) s.innerHTML = milaSVG({emo:s.dataset.emo||Mila.emo, estado:Mila.estado}); }
document.addEventListener("focusout", e=>{ if(S.pendRender && $("#main")?.contains(e.target)){ setTimeout(()=>{ if(!$("#main").contains(document.activeElement) || !/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName)){ S.pendRender=false; render(); } }, 120); } });

function pintarNav(){
  for(const a of $$("[data-go]")) a.classList.toggle("on", a.dataset.go===S.route);
  const enMas = RUTAS.find(r=>r.id===S.route)?.mas || S.route==="ajustes"; $("#btnMas")?.classList.toggle("on", !!enMas);
  const g = window.MilaApp?.Google; const sy = window.MilaApp?.Sync;
  const st = $("#syncState"); if(st){ const ok = g?.valido(); const conocido = (()=>{ try{ return localStorage.getItem("mila-gok")==="1"; }catch{ return false; } })();
    st.className = "sync-pill " + (sy?.estado==="error"?"err": sy?.estado==="sync"?"sync": ok?"ok": conocido?"pausa":"off");
    st.title = sy?.msg || (ok?"Sincronizado con tu Drive privado":"Toca para sincronizar tus dispositivos");
    st.innerHTML = `${ICON.cloud}<span>${sy?.estado==="sync"?"Sincronizando…": sy?.estado==="error"?"Revisar": ok?(sy?.ultima?"Al día":"Conectado"): conocido?"Toca para sincronizar":"Sin sincronizar"}</span>`; }
  const n = (window.Coach?.pendientes?.()||[]).length; const b=$("#bellN"); if(b){ b.textContent = n||""; b.hidden=!n; }
  const yo=$("#yoTop"); if(yo && yo.dataset.f!==(fotoYo()?"1":"0")){ yo.innerHTML = yoAvatar({}); yo.dataset.f = fotoYo()?"1":"0"; }
}
function shell(){
  const principales = RUTAS.filter(r=>!r.mas);
  const navTop = principales.map(r=>`<button type="button" class="tn" data-go="${r.id}" title="${r.n}">${ICON[r.ic]}<span>${r.corto||r.n}</span></button>`).join("");
  const mas = [...RUTAS.filter(r=>r.mas), {id:"ajustes", n:"Ajustes", ic:"gear"}].map(r=>`<button type="button" class="mm-i" data-go="${r.id}">${ICON[r.ic]}<span>${r.n}</span></button>`).join("");
  return `
  <div class="fondo" id="fondo"></div>
  <header class="topbar" aria-label="Navegación principal">
    <button type="button" class="marca" data-go="hoy" aria-label="Inicio"><span class="marca-ic mila-fija">${milaSVG({emo:"alegre"})}</span><span class="marca-t"><b>${esc(S.profile.asistente)}</b><small>tu panda personal</small></span></button>
    <nav class="topnav" id="topnav">${navTop}
      <div class="mas-wrap"><button type="button" class="tn" id="btnMas" data-act="menuMas" aria-haspopup="true" aria-expanded="false">${ICON.grid}<span>Más</span></button>
        <div class="menu-mas" id="menuMas" hidden>${mas}</div></div>
    </nav>
    <div class="top-der">
      <button type="button" id="syncState" class="sync-pill off" data-act="syncTocar"></button>
      <button type="button" class="ib campana" data-act="avisos" title="Lo que Mila nota">${ICON.bell}<i id="bellN" hidden></i></button>
      <button type="button" class="hablar-btn" data-act="chatOpen"><span class="mila-host" data-emo="alegre"></span><b>Hablar con Mila</b></button>
      <button type="button" class="yo-top" id="yoTop" data-go="ajustes" aria-label="Tu perfil y ajustes" data-f="${fotoYo()?"1":"0"}">${yoAvatar({})}</button>
    </div>
  </header>
  <main id="main" class="main" tabindex="-1"></main>
  <aside class="chat" id="chat" aria-label="Conversación con Mila">
    <header class="chat-top">
      <div class="chat-mila mila-host" data-size="56"></div>
      <div class="grow"><b>${esc(S.profile.asistente)}</b><small id="chatEstado">${IA.lista()?"Inteligencia completa":"Cerebro local · gratis"}</small></div>
      <button type="button" class="ib" data-act="vozToggle" title="Voz de Mila">${ICON.volume}</button>
      <button type="button" class="ib" data-act="chatClose" title="Cerrar">${ICON.x}</button>
    </header>
    <div class="chatlog" id="chatlog"></div>
    <form class="compose" id="compose" autocomplete="off">
      <div class="sug" id="sug"></div>
      <div class="compose-row">
        <textarea id="q" rows="1" placeholder="Escríbele o háblale a Mila…" aria-label="Mensaje"></textarea>
        <button type="button" class="mic-btn" data-act="mic" title="Hablar">${ICON.mic}</button>
        <button type="submit" class="send-btn" title="Enviar">${ICON.send}</button>
      </div>
    </form>
  </aside>
  <div class="chat-velo" data-act="chatClose"></div>
  <nav class="tabbar" aria-label="Secciones">
    <button type="button" data-go="hoy">${ICON.home}<span>Inicio</span></button>
    <button type="button" data-go="agenda">${ICON.cal}<span>Agenda</span></button>
    <button type="button" class="tab-mila" data-act="chatOpen" aria-label="Hablar con Mila"><span class="mila-host" data-emo="alegre"></span></button>
    <button type="button" data-go="tareas">${ICON.task}<span>Tareas</span></button>
    <button type="button" data-act="mas">${ICON.grid}<span>Más</span></button>
  </nav>
  <div id="coachBanner" class="coach-banner" hidden></div>
  <div id="sheetWrap" class="sheet-wrap" hidden><div class="sheet-bg" data-act="sheetClose"></div><div class="sheet" id="sheet" role="dialog" aria-modal="true"></div></div>
  <div id="toast" class="toast" hidden role="status"></div>
  <div id="tip" class="tip" hidden></div>`;
}
function pintarFondo(){ const f=$("#fondo"); if(f) f.innerHTML = escenaSVG(); }
document.addEventListener("click", e=>{ const m=$("#menuMas"); if(m && !m.hidden && !e.target.closest(".mas-wrap")) cerrarMenuMas(); }, true);

/* ---------- hojas (modales) ---------- */
const SHEETS = {};
function abrirSheet(tipo, data={}){
  const f = SHEETS[tipo]; if(!f) return; S.ui.sheet = {tipo, data};
  const w=$("#sheetWrap"), s=$("#sheet"); s.className = "sheet sh-"+tipo; s.innerHTML = `<button type="button" class="sheet-x ib" data-act="sheetClose" aria-label="Cerrar">${ICON.x}</button>` + f(data);
  w.hidden=false; requestAnimationFrame(()=>w.classList.add("open"));
  for(const h of s.querySelectorAll(".mila-host")) if(!h.firstChild) h.innerHTML = milaSVG({emo:h.dataset.emo||Mila.emo});
  setTimeout(()=>{ const i=s.querySelector("[autofocus]"); if(i && innerWidth>=760) i.focus(); }, 80);
}
function cerrarSheet(){ const w=$("#sheetWrap"); if(!w || w.hidden) return; w.classList.remove("open"); S.ui.sheet=null; setTimeout(()=>{ w.hidden=true; $("#sheet").innerHTML=""; if(S.pendRender){ S.pendRender=false; render(); } }, 220); }
document.addEventListener("keydown", e=>{ if(e.key==="Escape"){ if(!$("#sheetWrap")?.hidden) cerrarSheet(); else if(!$("#menuMas")?.hidden) cerrarMenuMas(); else if(S.ui.chatOpen) abrirChat(false); } });

/* ---------- tema ---------- */
function aplicarTema(){
  const pref = S.profile.ajustes.tema || "auto"; const h=new Date().getHours();
  const oscuro = pref==="oscuro" || (pref==="auto" && (matchMedia("(prefers-color-scheme: dark)").matches || h>=20 || h<6));
  document.documentElement.dataset.theme = oscuro ? "dark" : "light";
  document.documentElement.classList.toggle("calma", S.profile.ajustes.movimiento==="reducido");
  const m=$('meta[name="theme-color"]'); if(m) m.content = oscuro ? "#150D2B" : "#F6F2FF";
}

/* ---------- piezas reutilizables ---------- */
const btn = (txt, act, extra="", cls="") => `<button type="button" class="btn ${cls}" data-act="${act}" ${extra}>${txt}</button>`;
function cab(titulo, sub, acciones="", kind=""){
  return `<header class="cab ${kind?"cab-"+kind:""}"><div><h1>${titulo}</h1>${sub?`<p>${sub}</p>`:""}</div><div class="cab-acc">${acciones}</div></header>`;
}
function tarjeta(titulo, cuerpo, {acc="", cls="", ic=""}={}){ return `<section class="card ${cls}">${titulo?`<div class="card-h">${ic?`<span class="card-ic">${ic}</span>`:""}<h3>${titulo}</h3><div class="card-acc">${acc}</div></div>`:""}${cuerpo}</section>`; }
function chipArea(a){ if(!a) return ""; const c=areaCat(a); return `<span class="tag" style="--c:${catColor(c)}">${esc(a)}</span>`; }
function segmentos(nombre, opciones, actual){ return `<div class="seg" role="tablist">${opciones.map(([v,l])=>`<button type="button" role="tab" class="${v===actual?"on":""}" data-act="seg" data-k="${nombre}" data-v="${v}">${l}</button>`).join("")}</div>`; }
