/* =========================================================
   Acciones de la interfaz y arranque
   ========================================================= */
async function seguro(fn){ try{ return await fn(); }catch(e){ console.error(e); toast(errMsg(e), {icon:ICON.alert}); } }
const ACT = {
  ir:(v)=>go(v), decir:(v)=>enviar(v), sheetOpen:(v,el)=>abrirSheet(v, {tipo:el.dataset.tipo}), sheetClose:()=>cerrarSheet(),
  chatOpen:()=>abrirChat(true), chatClose:()=>abrirChat(false), mas:()=>abrirSheet("mas"), avisos:()=>abrirSheet("avisos"),
  mic:()=>{ if(Oido.activo) Oido.detener(); else Oido.iniciar(); },
  micRec:()=>{ abrirChat(true); S.ctx.pending={kind:"recuerdo"}; enviarSistema("Cuéntame tu recuerdo; te escucho."); Oido.iniciar(); },
  vozToggle:()=>seguro(async()=>{ const v=!S.profile.ajustes.hablar; await Store.saveProfile({ajustes:{hablar:v}}); if(!v) Voz.parar(); toast(v?"Mila hablará en voz alta":"Mila responderá solo con texto", {icon:ICON.volume}); }),
  undo:(v,el)=>seguro(async()=>{ const r=await undo(el.dataset.id); toast(r.resumen, {icon:ICON.undo}); pintarChat(); }),
  seg:(v,el)=>{ const k=el.dataset.k;
    if(k==="agView"){ S.agenda.view=v; } else if(k==="tVista"){ S.tareasUI.vista=v; } else if(k==="crecerTab"){ S.crecerUI.tab=v; } else if(k==="recTab"){ S.recUI.tab=v; S.recUI.q=""; } else if(k==="dTipo"){ S.dinero.tipo=v; } else if(k==="fraseTab"){ S.fraseUI.tab=v; }
    else if(k==="movTipo"){ const f=el.closest("form"); const cur = Object.fromEntries(new FormData(f)); const id=f.dataset.id; abrirSheet("mov", {id, tipo:v}); const nf=$("#sheet form"); if(nf && cur.monto) nf.monto.value=cur.monto; return; }
    else if(k==="tema"){ Store.saveProfile({ajustes:{tema:v}}).then(aplicarTema); } else if(k==="movimiento"){ Store.saveProfile({ajustes:{movimiento:v}}).then(aplicarTema); }
    render(); },
  agPrev:()=>Agenda.mover(-1), agNext:()=>Agenda.mover(1), agHoy:()=>{ S.agenda.date=new Date(); render(); },
  agZoom:(v)=>{ S.agenda.hourH = clamp(S.agenda.hourH + Number(v)*12, 36, 108); const g=$(".ag-scroll"); const pos=g?g.scrollTop/(S.agenda.hourH-Number(v)*12):0; render(true); requestAnimationFrame(()=>{ const n=$(".ag-scroll"); if(n){ n.dataset.pos="1"; n.scrollTop=pos*S.agenda.hourH; } }); },
  agendaDia:(v)=>{ S.agenda.date=pymd(v); if(S.route!=="agenda"){ S.agenda.view = innerWidth<760?"dia":S.agenda.view==="mes"?"dia":S.agenda.view; go("agenda"); } else { if(S.agenda.view==="mes") S.agenda.view="dia"; render(); } },
  mmPrev:()=>{ const d=S.agenda.date; S.agenda.date=new Date(d.getFullYear(), d.getMonth()-1, 1); render(); }, mmNext:()=>{ const d=S.agenda.date; S.agenda.date=new Date(d.getFullYear(), d.getMonth()+1, 1); render(); },
  evAbrir:(v,el)=>{ const id=el.dataset.id; if(String(id).startsWith("t:")) abrirSheet("tarea",{id:id.slice(2)}); else abrirSheet("evDetalle",{id}); },
  evEditar:(v,el)=>abrirSheet("evento",{id:el.dataset.id}),
  evBorrar:(v,el)=>seguro(async()=>{ const r=await A.borrarEvento(el.dataset.id); cerrarSheet(); toast(r.resumen, {undo:r.log, icon:ICON.trash}); render(); }),
  evManana:(v,el)=>seguro(async()=>{ const e=buscarEvento(el.dataset.id); const r=await A.editarEvento(e.id, {ini:addDays(e.ini,1).toISOString(), fin:addDays(e.fin,1).toISOString()}); cerrarSheet(); toast(`Movido a ${relDia(addDays(e.ini,1))}`, {undo:r.log}); }),
  evDuplicar:(v,el)=>seguro(async()=>{ const e=buscarEvento(el.dataset.id); const r=await A.evento({titulo:e.titulo, ini:addDays(e.ini,7), fin:addDays(e.fin,7), allDay:e.allDay, cat:e.cat, lugar:e.lugar, notas:e.notas}); cerrarSheet(); toast(`Copiado a la próxima semana`, {undo:r.log}); }),
  tareaToggle:(v,el)=>seguro(async()=>{ const id=el.dataset.id; const t=S.tareas.find(x=>x.id===id); if(!t) return; const hecha = t.estado!=="hecha";
    const box = el.closest(".tarea"); if(box && hecha){ box.classList.add("tachando"); const r=el.getBoundingClientRect(); confetti(r.left+r.width/2, r.top); haptic(18); await new Promise(res=>setTimeout(res,380)); }
    const r=await A.editarTarea(id, {estado: hecha?"hecha":"pendiente"}); if(hecha){ Mila.set("celebra","animada"); setTimeout(()=>Mila.set("idle"),1500); } toast(hecha?pick(["¡Tachada! Una menos.","¡Bien hecho!","¡Eso, "+N()+"!"]):"Tarea reabierta", {undo:r.log, icon:ICON.check}); cerrarSheet(); render(); }),
  tareaEditar:(v,el)=>abrirSheet("tarea",{id:el.dataset.id}), tareaMenu:(v,el)=>abrirSheet("tareaMenu",{id:el.dataset.id}),
  tareaHoy:(v,el)=>seguro(async()=>{ const r=await A.editarTarea(el.dataset.id,{vence:todayStr()}); cerrarSheet(); toast("Para hoy", {undo:r.log}); }),
  tareaManana:(v,el)=>seguro(async()=>{ const r=await A.editarTarea(el.dataset.id,{vence:ymd(addDays(new Date(),1))}); cerrarSheet(); toast("Para mañana", {undo:r.log}); }),
  tareaPrio:(v,el)=>seguro(async()=>{ const t=S.tareas.find(x=>x.id===el.dataset.id); const r=await A.editarTarea(t.id,{prioridad:t.prioridad==="alta"?"media":"alta"}); cerrarSheet(); toast("Prioridad actualizada", {undo:r.log}); }),
  tareaAgendar:(v,el)=>{ const t=S.tareas.find(x=>x.id===el.dataset.id); abrirSheet("tarea",{id:t.id}); setTimeout(()=>$("#sheet input[name=hora]")?.focus(),120); },
  tareaBorrar:(v,el)=>seguro(async()=>{ const r=await A.borrarTarea(el.dataset.id); cerrarSheet(); toast(r.resumen, {undo:r.log, icon:ICON.trash}); }),
  tFiltro:(v)=>{ S.tareasUI.filtro=v; render(); }, tArea:(v)=>{ S.tareasUI.area = norm(S.tareasUI.area)===norm(v)?"":v; render(); },
  fechaRapida:(v)=>{ const i=$("#sheet input[name=vence]"); if(i) i.value=v; },
  habToggle:(v,el)=>seguro(async()=>{ const h=S.habitos.find(x=>x.id===el.dataset.id); const on=!h.registros?.[todayStr()]; const r=await A.habito(h.nombre, todayStr(), on); if(on){ const b=el.getBoundingClientRect(); confetti(b.left+b.width/2, b.top); haptic(16); } toast(on?`${h.nombre} ✓`.replace(" ✓"," cumplido"):`${h.nombre} desmarcado`, {undo:r.log, icon:ICON.sprout}); }),
  habDia:(v,el)=>seguro(async()=>{ const h=S.habitos.find(x=>x.id===el.dataset.id); await A.habito(h.nombre, v, !h.registros?.[v]); }),
  habMenu:(v,el)=>abrirSheet("habMenu",{id:el.dataset.id}), habEditar:(v,el)=>abrirSheet("habito",{id:el.dataset.id}),
  habAyer:(v,el)=>seguro(async()=>{ const h=S.habitos.find(x=>x.id===el.dataset.id); const d=ymd(addDays(new Date(),-1)); await A.habito(h.nombre, d, !h.registros?.[d]); cerrarSheet(); }),
  habBorrar:(v,el)=>seguro(async()=>{ const r=await A.borrarHabito(el.dataset.id); cerrarSheet(); toast(r.resumen, {undo:r.log}); }),
  habSug:(v)=>{ const i=$("#sheet input[name=nombre]"); if(i) i.value=v; },
  metaMenu:(v,el)=>abrirSheet("metaMenu",{id:el.dataset.id}), metaEditar:(v,el)=>abrirSheet("meta",{id:el.dataset.id}),
  metaPausar:(v,el)=>seguro(async()=>{ const g=S.metas.find(x=>x.id===el.dataset.id); const r=await A.meta({id:g.id, estado:g.estado==="pausada"?"activa":"pausada"}); cerrarSheet(); toast(r.resumen, {undo:r.log}); }),
  metaBorrar:(v,el)=>seguro(async()=>{ const r=await A.borrarMeta(el.dataset.id); cerrarSheet(); toast(r.resumen, {undo:r.log}); }),
  metaLograda:(v,el)=>seguro(async()=>{ const r=await A.meta({id:el.dataset.id, estado:"lograda"}); Mila.celebrar(); toast("¡Meta lograda! Qué orgullo.", {undo:r.log, icon:ICON.star}); }),
  metaAvance:(v,el)=>{ const g=S.metas.find(x=>x.id===el.dataset.id); abrirChat(true); const q=$("#q"); q.value=`Avance en la meta ${g.titulo}: `; q.focus(); },
  animo:(v)=>seguro(async()=>{ await A.animo(v); const m=moodDe(v); toast(`Ánimo: ${m.l}`, {icon:ICON.heart}); if(m.v<=2){ abrirChat(true); enviar(`me siento ${v}`); } }),
  movEditar:(v,el)=>abrirSheet("mov",{id:el.dataset.id}),
  movBorrar:(v,el)=>seguro(async()=>{ const r=await A.borrarMovimiento(el.dataset.id); cerrarSheet(); toast(r.resumen, {undo:r.log, icon:ICON.trash}); }),
  movConfirmar:(v,el)=>seguro(async()=>{ const r=await A.editarMovimiento(el.dataset.id, {estado:"registrado"}); toast("Confirmado", {undo:r.log}); }),
  dMes:(v)=>{ S.dinero.mes = mesMas(S.dinero.mes, Number(v)); S.dinero.cat=null; render(); }, dCat:(v)=>{ S.dinero.cat = v && S.dinero.cat!==v ? v : null; render(); },
  recAbrir:(v,el)=>abrirSheet("recuerdo",{id:el.dataset.id}), recEditar:(v,el)=>abrirSheet("recuerdo",{id:el.dataset.id, editar:true}),
  recBorrar:(v,el)=>seguro(async()=>{ const r=await A.borrarRecuerdo(el.dataset.id); cerrarSheet(); toast(r.resumen, {undo:r.log}); }),
  recEmo:(v)=>{ S.recUI.emo=v; render(); },
  memEditar:(v,el)=>abrirSheet("memoria",{id:el.dataset.id}), memOlvidar:(v,el)=>seguro(async()=>{ const r=await A.olvidar(el.dataset.id); cerrarSheet(); toast(r.resumen, {undo:r.log}); }),
  notaBorrar:(v,el)=>seguro(async()=>{ const r=await A.borrarNota(el.dataset.id); toast("Nota borrada", {undo:r.log}); }),
  leer:(v)=>Voz.decir(v),
  avatar:(v,el)=>seguro(async()=>{ await Store.saveProfile({avatar:{[el.dataset.k]:v}}); render(); reShell(); }),
  iaGuardar:()=>seguro(async()=>{ const prov=$("#iaProv").value, key=$("#iaKey").value; const b=$('[data-act="iaGuardar"]'); b.disabled=true; b.textContent="Probando…";
    try{ const r = await IA.configurar(prov, key || (IA.cfg().prov===prov ? IA.cfg().key : "")); toast(`¡Conectada! Modelo: ${r.modelo}`, {icon:ICON.check, ms:4500}); render(true); reShell(); } finally{ b.disabled=false; b.textContent="Conectar y probar"; } }),
  iaQuitar:()=>{ window.MilaApp.Claves.set({llmKey:"", llmProv:"", llmModel:""}); toast("Clave quitada; uso el cerebro local"); render(true); reShell(); },
  hablarTog:(v,el)=>Store.saveProfile({ajustes:{hablar:el.checked}}),
  vozProbar:()=>seguro(async()=>{ const m=Voz.motor(); if(m==="neural" && !Voz.piperSes) toast("Descargando la voz neuronal (solo la primera vez)…", {ms:6000}); await Voz.decir(`Hola ${N()}, soy ${S.profile.asistente}. Así sueno. ¿Te gusta mi voz?`); }),
  gConectar:()=>seguro(async()=>{ const G=window.MilaApp?.Google; if(!G) return toast("Abre Mila desde su página para conectar Google."); if(!window.MilaApp.Claves.get().googleClientId){ go("ajustes"); setTimeout(()=>$("#aj-google")?.scrollIntoView({behavior:"smooth"}),200); return toast("Primero pega tu ID de cliente de Google"); }
    await G.ensure(); mcp = await window.claude.use("mcp"); toast("Google conectado", {icon:ICON.google}); const t=new Date(); Cal.cargar(ymd(addDays(t,-7)), ymd(addDays(t,35)), {force:true}).catch(()=>{}); HojaSync.run(); render(); }),
  syncAhora:()=>seguro(async()=>{ await window.MilaApp.Sync.run(); toast(window.MilaApp.Sync.msg||"Sincronizado"); }),
  copiarEnlace:()=>{ const cid=window.MilaApp?.Claves.get().googleClientId||""; const url=location.origin+location.pathname+"#cid="+encodeURIComponent(cid); navigator.clipboard?.writeText(url).then(()=>toast("Enlace copiado. Pégalo en Edge.", {icon:ICON.copy})).catch(()=>{}); abrirSheet("enlace",{url}); },
  hojaConectar:()=>seguro(async()=>{ const info=await HojaSync.conectar($("#hojaLink").value); toast(`Conectada: ${info.titulo}`, {icon:ICON.sheet}); render(); }),
  hojaTraer:()=>seguro(async()=>{ const n=await HojaSync.traer(); toast(n?`Traje ${n} movimientos`:"Ya estaban todos"); }),
  hojaAnteriores:()=>seguro(async()=>{ for(const m of HojaSync.anteriores()) await Store.update("movimientos", m.id, {enviarHoja:true}); HojaSync.run(true); }),
  hojaQuitar:()=>seguro(async()=>{ await Store.saveProfile({hoja:null}); toast("Hoja desconectada"); render(); }),
  catQuitar:(v)=>Store.saveProfile({categorias:S.profile.categorias.filter(c=>c!==v)}), catAgregar:()=>abrirSheet("texto",{titulo:"Nueva categoría", label:"Nombre", k:"cat"}),
  metQuitar:(v)=>Store.saveProfile({metodos:S.profile.metodos.filter(c=>c!==v)}), metAgregar:()=>abrirSheet("texto",{titulo:"Nuevo método de pago", label:"Nombre", k:"met"}),
  exportar:()=>exportar(), chatBorrar:()=>{ S.chat=[]; Store.saveChat(); pintarChat(); toast("Conversación borrada"); },
  instalar:async()=>{ if(installEvt){ installEvt.prompt(); await installEvt.userChoice.catch(()=>{}); installEvt=null; render(); } }
};
Object.assign(ACT, {
  menuMas:()=>{ const m=$("#menuMas"); if(!m) return; m.hidden=!m.hidden; $("#btnMas")?.setAttribute("aria-expanded", String(!m.hidden)); },
  syncTocar:()=>seguro(async()=>{ const G=window.MilaApp?.Google; if(G?.valido()){ await window.MilaApp.Sync.run(); toast(window.MilaApp.Sync.msg||"Sincronizado", {icon:ICON.cloud}); } else await ACT.gConectar(); }),
  coachHecho:(v,el)=>seguro(async()=>{ const r=await Coach.hecho(el.dataset.id); cerrarSheet(); toast(r.resumen, {undo:r.log, icon:ICON.check, ms:5000}); S.chat.push({r:"a", t:r.resumen, ts:Date.now(), emo:"animada"}); Store.saveChat(); pintarChat(); if(S.profile.ajustes.hablar) Voz.decir(r.resumen); render(); }),
  coachPosponer:(v,el)=>seguro(async()=>{ const r=await Coach.posponer(el.dataset.id, v); cerrarSheet(); toast(r.resumen, {icon:ICON.snooze, ms:5000}); if(r.preguntar){ abrirChat(true); S.chat.push({r:"a", t:r.resumen, ts:Date.now(), emo:"pensativa", chips:coachChipsMotivo(el.dataset.id)}); pintarChat(); } render(); }),
  coachReprogramar:(v,el)=>{ Coach.ocultar(); abrirSheet("tarea",{id:el.dataset.id}); },
  coachAyuda:(v,el)=>{ Coach.ocultar(); cerrarSheet(); enviar(`#coach ayuda ${el.dataset.id}`); },
  coachCerrar:()=>Coach.ocultar(), focoParar:()=>{ clearInterval(Coach.focoT); Coach.focoT=null; Coach.ocultar(); },
  finDescanso:()=>seguro(async()=>{ await A.finDescanso(); toast("Descanso terminado. ¡A darle!", {icon:ICON.zap}); render(); }),
  descansoHoy:()=>seguro(async()=>{ const r=await A.descanso(); Mila.momento("carinosa"); toast(r.resumen, {icon:ICON.moon}); render(); }),
  notifPermitir:()=>seguro(async()=>{ const p=await Notification.requestPermission(); toast(p==="granted"?"¡Listo! Mila podrá avisarte.":"No se activaron las notificaciones."); render(); }),
  notifProbar:()=>{ const ok=notificar("Mila 🐼", `Así te aviso, ${N()}. Toca «Hecho» o «Posponer» desde aquí mismo.`, {tag:"prueba"}); toast(ok?"Aviso enviado":"Primero permite las notificaciones", {icon:ICON.bell}); },
  fotoSubir:()=>{ let i=$("#fotoArchivo"); if(!i){ i=document.createElement("input"); i.type="file"; i.accept="image/*"; i.id="fotoArchivo"; i.hidden=true; document.body.appendChild(i); } i.value=""; i.click(); },
  fotoGuardar:()=>seguro(async()=>{ const src=fotoRender(480); await A.foto(src); cerrarSheet(); toast("¡Foto guardada! Solo tú la ves.", {icon:ICON.camera}); Mila.momento("carinosa"); reShell(); }),
  fotoQuitar:()=>seguro(async()=>{ await A.quitarFoto(); toast("Foto quitada"); reShell(); }),
  fraseFav:(v,el)=>seguro(async()=>{ const c=el.dataset.clave; const f = c ? FRASES_BANCO.find(x=>x.clave===c) : null; const r = await A.favFrase(c ? {clave:c, texto:f?.texto, autor:f?.autor, cat:f?.cat} : {id:el.dataset.id}); if(r.fav){ Mila.momento("carinosa"); const b=el.getBoundingClientRect(); confetti(b.left+b.width/2, b.top); } toast(r.fav?"Guardada en favoritas":"Quitada de favoritas", {icon:ICON.heart}); render(); }),
  fraseOtra:()=>{ S.fraseUI.i++; render(); }, fraseCat:(v)=>{ S.fraseUI.cat = S.fraseUI.cat===v ? "" : v; render(); },
  fraseCopiar:(v)=>{ navigator.clipboard?.writeText(v).then(()=>toast("Frase copiada", {icon:ICON.copy})).catch(()=>{}); },
  fraseBorrar:(v,el)=>seguro(async()=>{ const r=await A.borrarFrase(el.dataset.id); toast(r.resumen, {undo:r.log}); render(); }),
  memCat:(v)=>{ S.memUI.cat=v; render(); }, memFuente:(v)=>{ S.memUI.fuente = S.memUI.fuente===v ? "" : v; render(); },
  cicloInicio:(v)=>seguro(async()=>{ const r=await A.periodoInicio(v||todayStr()); cerrarSheet(); toast(r.resumen, {undo:r.log, icon:ICON.drop}); render(); }),
  cicloFin:(v)=>seguro(async()=>{ const r=await A.periodoFin(v||todayStr()); cerrarSheet(); toast(r.resumen, {undo:r.log, icon:ICON.drop}); render(); }),
  cicloDiaAbrir:(v)=>abrirSheet("cicloDia", {fecha:v}), cicMes:(v)=>{ const b=S.cicloUI.mes?pymd(S.cicloUI.mes+"-01"):new Date(); const d=new Date(b.getFullYear(), b.getMonth()+Number(v), 1); S.cicloUI.mes=ymd(d).slice(0,7); render(); },
  cicloBloquear:()=>{ S.cicloUI.abierto=false; render(true); toast("Mi ciclo bloqueado", {icon:ICON.lock}); },
  periodoEditar:(v,el)=>abrirSheet("periodo",{id:el.dataset.id}),
  periodoBorrar:(v,el)=>seguro(async()=>{ const r=await A.borrarPeriodo(el.dataset.id); cerrarSheet(); toast(r.resumen, {undo:r.log}); render(); }),
  cicloExportar:()=>cicloExportar(),
  fuentesLeer:()=>seguro(async()=>{ if(!window.MilaApp?.Google?.valido()) await window.MilaApp.Google.ensure(); await Fuentes.leerTodas(); const er=Object.values(Fuentes.err); toast(er.length?"Algunas hojas no se pudieron leer: "+er[0]:"Hojas actualizadas", {icon:ICON.sheet}); }),
  fuentesExtraer:()=>seguro(async()=>{ if(!Object.keys(Fuentes.data).length){ if(!window.MilaApp?.Google?.valido()) await window.MilaApp.Google.ensure(); await Fuentes.leerTodas(); }
    const items=Fuentes.extraer(); if(!items.length) return toast("No encontré nada nuevo en tus hojas: ya está todo en Mila.", {icon:ICON.check}); abrirSheet("revisar", {items, titulo:`Encontré ${plural(items.length,"elemento","elementos")} en tus hojas`, sub:"Recuerdos, logros, chips mentales y metas. Desmarca lo que no quieras guardar."}); })
});
function enviarSistema(t){ S.chat.push({r:"a", t, ts:Date.now(), emo:"escuchando"}); pintarChat(); }
document.addEventListener("click", e=>{
  const g = e.target.closest("[data-go]"); if(g){ e.preventDefault(); cerrarSheet(); go(g.dataset.go); return; }
  const a = e.target.closest("[data-act]"); if(!a) return;
  if(a.tagName==="INPUT" && a.type==="range") return;
  if(a.tagName==="INPUT" && a.type==="checkbox" && !["iaOn","hablarTog","avatarTog","coachTog"].includes(a.dataset.act)) return;
  if(a.tagName==="INPUT" && a.type==="checkbox") return;
  const f = ACT[a.dataset.act]; if(!f) return;
  if(a.closest(".ev") && a.dataset.act==="evAbrir") return;
  e.preventDefault(); e.stopPropagation(); f(a.dataset.v, a, e);
});
document.addEventListener("change", e=>{
  const el=e.target, id=el.id, v=el.value;
  if(el.dataset.act==="iaOn"){ window.MilaApp.Claves.set({llmOn:el.checked}); render(); reShell(); return; }
  if(el.dataset.act==="avatarTog"){ Store.saveProfile({avatar:{[el.dataset.k]:el.checked}}).then(()=>{ render(); reShell(); }); return; }
  if(el.dataset.act==="hablarTog"){ Store.saveProfile({ajustes:{hablar:el.checked}}); return; }
  if(el.dataset.act==="metaProg"){ seguro(async()=>{ const r=await A.meta({id:el.dataset.id, progreso:Number(v), avance:`Progreso ${v}%`}); if(Number(v)>=100) Mila.celebrar(); toast(`Progreso: ${v}%`, {undo:r.log}); }); return; }
  if(id==="setNom" && v.trim()) Store.saveProfile({nombre:v.trim()}).then(reShell);
  if(id==="setAsis" && v.trim()) Store.saveProfile({asistente:v.trim()}).then(reShell);
  if(id==="setVoz") Store.saveProfile({ajustes:{vozNombre:v}});
  if(id==="setRate") Store.saveProfile({ajustes:{vozRate:Number(v)}}); if(id==="setPitch") Store.saveProfile({ajustes:{vozPitch:Number(v)}});
  if(id==="setMetodo") Store.saveProfile({ajustes:{metodoPorDefecto:v}});
  if(id==="vozMotor"){ window.MilaApp.Claves.set({vozMotor:v}); render(true); if(v==="neural") Voz.piperCargar().catch(e=>toast("No pude descargar la voz: "+errMsg(e))); }
  if(id==="piperVoz"){ window.MilaApp.Claves.set({piperVoz:v}); Voz.piperSes=null; Voz.piperCargando=null; Voz.piperEstado=""; render(true); }
  if(id==="elKey" && v) window.MilaApp.Claves.set({elevenlabs:v.trim()}); if(id==="elVoice") window.MilaApp.Claves.set({elVoice:v.trim()}); if(id==="gttsKey" && v) window.MilaApp.Claves.set({gtts:v.trim()});
  if(id==="gCid"){ const c=v.trim(); if(c && !/\.apps\.googleusercontent\.com$/.test(c)) return toast("Ese ID no parece válido: termina en .apps.googleusercontent.com"); window.MilaApp.Claves.set({googleClientId:c}); toast("ID guardado. Recargando…"); setTimeout(()=>location.reload(), 900); }
  if(id==="iaProv"){ const P=PROVEEDORES[v]; const n=$("#iaNota"); if(n) n.innerHTML = `${esc(P.nota)} <a href="${P.url}" target="_blank" rel="noopener">Obtener clave ${ICON.right}</a>`; }
  if(id==="importar" && el.files?.[0]) importar(el.files[0]);
  if(id==="fotoArchivo" && el.files?.[0]) fotoCargar(el.files[0]);
  if(id==="paqueteArchivo" && el.files?.[0]) paqueteCargar(el.files[0]);
  if(el.dataset.act==="coachTog"){ Store.saveProfile({ajustes:{coach:{...Coach.cfg(), [el.dataset.k]:el.checked}}}).then(()=>{ if(el.dataset.k==="estricto"){ Mila.momento(el.checked?"enojada":"carinosa", 2600, el.checked?"enojada":"idle"); toast(el.checked?"Modo entrenadora estricta ON 😤":"Modo amable 🐼"); } render(true); }); return; }
  if(el.type==="radio" && el.closest(".chips.sel")){ for(const l of el.closest(".chips.sel").querySelectorAll(".chip")) l.classList.toggle("on", l.contains(el) && el.checked); }
  if(el.type==="radio" && el.closest(".iconos,.swatches,.caras")){ for(const l of el.closest(".iconos,.swatches,.caras").querySelectorAll("label")) l.classList.toggle("on", l.contains(el)); }
});
document.addEventListener("input", e=>{
  const el=e.target;
  if(el.id==="q") autoAlto(el);
  if(el.classList.contains("rango")) el.style.setProperty("--p", el.value+"%");
  const filtros = {tBuscar:v=>S.tareasUI.q=v, dBuscar:v=>S.dinero.q=v, recBuscar:v=>S.recUI.q=v, memBuscar:v=>S.memUI.q=v};
  if(filtros[el.id]){ filtros[el.id](el.value); clearTimeout(el._t); el._t=setTimeout(()=>{ const id=el.id, pos=el.selectionStart; render(true); requestAnimationFrame(()=>{ const n=$("#"+id); if(n){ n.focus(); n.setSelectionRange(pos,pos); } }); }, 220); }
});
document.addEventListener("submit", e=>{
  const f = e.target;
  if(f.id==="compose"){ e.preventDefault(); const q=$("#q"); const v=q.value; q.value=""; autoAlto(q); enviar(v); return; }
  const k = f.dataset.form; if(!k || !FORMS[k]) return; e.preventDefault();
  const data = {}; for(const [n,v] of new FormData(f)) data[n]=v; for(const c of f.querySelectorAll("input[type=checkbox]")) data[c.name]=c.checked;
  const b = f.querySelector("[type=submit]"); if(b) b.disabled=true;
  seguro(()=>FORMS[k](data, f)).finally(()=>{ if(b) b.disabled=false; });
});
document.addEventListener("keydown", e=>{ if(e.target.id==="q" && e.key==="Enter" && !e.shiftKey){ e.preventDefault(); $("#compose").requestSubmit(); } });
addEventListener("hashchange", ()=>{ const r=location.hash.slice(1); if(r && (VISTAS[r]) && r!==S.route){ S.route=r; render(true); } });
addEventListener("resize", ()=>{ clearTimeout(window._rz); window._rz=setTimeout(()=>{ document.body.classList.toggle("chat-open", S.ui.chatOpen); render(); }, 200); });

function reShell(){ const c=S.ui.chatOpen; $("#app").innerHTML = shell(); pintarFondo(); for(const h of $$(".mila-host")) h.innerHTML = milaSVG({emo:h.dataset.emo||Mila.emo}); abrirChat(c); render(true); }

// recordatorios mientras la app está abierta
function revisarAvisos(){
  const ahora=new Date(); const avisados = JSON.parse(sessionStorage.getItem("mila-avisados")||"{}");
  const candidatos = [];
  for(const t of S.tareas){ if(t.estado!=="hecha" && t.vence && t.hora){ const d=new Date(`${t.vence}T${t.hora}:00`); candidatos.push({id:"t"+t.id, d, t:`Es hora de: ${t.titulo}`}); } }
  for(const e of eventosEntre(todayStr(), ymd(addDays(ahora,1)), {tareas:false})){ if(e.allDay) continue; const m = e.rec ?? 10; candidatos.push({id:"e"+e.id+e.ini.getTime(), d:addMin(e.ini,-m), t:`${m?`En ${m} min`:"Ahora"}: ${e.titulo}`}); }
  for(const c of candidatos){ const dif = ahora - c.d; if(dif>=0 && dif<5*60000 && !avisados[c.id]){ avisados[c.id]=1; Mila.set(null,"animada"); toast(c.t, {icon:ICON.bell, ms:8000}); Voz.decir(`${N()}, ${c.t}`);
      try{ if(Notification?.permission==="granted") new Notification("Mila", {body:c.t, icon:"icon.svg", tag:c.id}); }catch{} } }
  sessionStorage.setItem("mila-avisados", JSON.stringify(avisados));
}

async function boot(){
  const C = window.claude; S.standalone = !!C?.standalone;
  if(C?.use){ [db, mcp] = await Promise.all(["db","mcp"].map(n=>C.use(n).catch(()=>null))); }
  if(!db) db = memDb();
  Store.P = db.doc("data/users/local/profile");
  aplicarTema();
  $("#app").innerHTML = shell(); pintarFondo();
  for(const h of $$(".mila-host")) h.innerHTML = milaSVG({emo:h.dataset.emo||"alegre"});
  const r = location.hash.slice(1).split(/[?&=]/)[0]; if(VISTAS[r]) S.route=r;
  abrirChat(S.ui.chatOpen);
  Store.subscribe();
  render(true);
  const MA = window.MilaApp;
  if(MA){
    MA.Sync.oyentes.add(()=>{ pintarNav(); if(MA.Sync.clavesNuevas){ MA.Sync.clavesNuevas=false; toast("Traje tus claves desde tu otro dispositivo", {ms:4000}); reShell(); } });
    MA.Google.oyentes.add(()=>render());
    if(MA.Claves.get().googleClientId) MA.Google.load().catch(()=>{});
    navigator.storage?.persist?.().catch(()=>{});
    if(window.__milaNuevoNavegador) setTimeout(()=>{ abrirChat(true); enviarSistema(`¡Hola de nuevo, ${S.profile.nombre}! Estás en un dispositivo nuevo. Toca «Sin sincronizar» arriba (o «Conectar Google» en Ajustes) y traigo todo lo tuyo desde tu Drive.`); }, 1200);
  }
  if(mcp && MA?.Google?.valido()){ const t=new Date(); Cal.cargar(ymd(addDays(t,-7)), ymd(addDays(t,35))).catch(()=>{}); }
  setInterval(()=>{ revisarAvisos(); Coach.tick().catch(e=>console.warn("coach", e)); if(!document.hidden && S.route==="hoy" && !$("#main").contains(document.activeElement) && !S.ui.sheet) render(); }, 30000);
  setInterval(()=>{ pintarFondo(); aplicarTema(); }, 15*60000);
  setTimeout(()=>{ revisarAvisos(); Coach.tick().catch(()=>{}); }, 5000);
  aplicarSyncCiclo();
  // sincronización continua entre dispositivos
  if(MA){
    const tirar = () => { if(MA.Google.valido() && !MA.Sync.corriendo) MA.Sync.run().catch(()=>{}); };
    setInterval(()=>{ if(!document.hidden) tirar(); }, 60000);
    document.addEventListener("visibilitychange", ()=>{ if(!document.hidden){ tirar(); Coach.tick().catch(()=>{}); } });
    addEventListener("focus", tirar); addEventListener("online", tirar);
    // si ya conectaste antes, reconecta en tu primer toque (Google exige un gesto para abrir su ventanita)
    const conocido = (()=>{ try{ return localStorage.getItem("mila-gok")==="1"; }catch{ return false; } })();
    if(conocido && MA.Claves.get().googleClientId && !MA.Google.valido()){
      const reco = async ev=>{ if(ev.target.closest?.("[data-act=gConectar],[data-act=syncTocar]")) return; document.removeEventListener("pointerdown", reco, true);
        try{ await MA.Google.ensure(); mcp = mcp || await window.claude.use("mcp"); const t=new Date(); Cal.cargar(ymd(addDays(t,-7)), ymd(addDays(t,35)), {force:true}).catch(()=>{}); Fuentes.leerTodas().catch(()=>{}); render(); }catch{} };
      document.addEventListener("pointerdown", reco, true);
    } else if(MA.Google.valido()){ tirar(); const ids=Object.keys(S.profile.fuentes||{}); if(ids.length && Date.now()-Math.max(0,...Object.values(Fuentes.at))>6*3600000) setTimeout(()=>Fuentes.leerTodas().catch(()=>{}), 3000); }
  }
  // respuestas desde la notificación (Hecho / Posponer) y enlaces #coach=accion:id
  const accionCoach = (acc, tid) => { if(!tid) return; if(acc==="hecho") ACT.coachHecho(null, {dataset:{id:tid}}); else if(acc==="posponer") ACT.coachPosponer("60", {dataset:{id:tid}}); else { abrirChat(true); enviar(`#coach ayuda ${tid}`); } };
  navigator.serviceWorker?.addEventListener("message", e=>{ const d=e.data||{}; if(d.tipo==="coach") setTimeout(()=>accionCoach(d.accion, d.tid), 300); });
  const hc = location.hash.match(/coach=(\w+):([\w-]+)/); if(hc){ history.replaceState(null,"","#hoy"); setTimeout(()=>accionCoach(hc[1], hc[2]), 2500); }
  if("Notification" in window && Notification.permission==="default") setTimeout(()=>{ document.addEventListener("click", function pedir(){ Notification.requestPermission().catch(()=>{}); document.removeEventListener("click", pedir); }, {once:true}); }, 3000);
  setTimeout(()=>{ if(!S.chat.length){ const h=new Date().getHours(); S.chat.push({r:"a", t:`${saludoHora(h)}, ${S.profile.nombre}. ${resumenCorto()} ¿En qué te ayudo?`, ts:Date.now(), emo:"alegre", chips:sugerenciasChat().map(x=>({l:x, say:x}))}); pintarChat(); } }, 1500);
}
window.__mila = { S, entender, responder, parseMonto, parseFecha, parseHora, quitarFechaHora, A, IA, Voz, Store, enviar, Coach, Fuentes, cicloStats, importarItems, fraseDelDia, go, render };
boot();
