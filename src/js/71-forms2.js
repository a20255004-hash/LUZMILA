/* =========================================================
   Formularios y hojas de las secciones nuevas (v9)
   ========================================================= */
SHEETS.mas = () => `${sheetHead("Todas las secciones")}<div class="mas-g">${[...RUTAS, {id:"ajustes", n:"Ajustes", ic:"gear"}].map(r=>`<button type="button" class="mas-i ${r.id===S.route?"on":""}" data-go="${r.id}">${ICON[r.ic]}<span>${r.n}</span></button>`).join("")}</div>`;
SHEETS.avisos = () => { const pend=Coach.pendientes();
  return `${sheetHead("Lo que Mila nota", ICON.bell)}
  ${pend.length?`<h4 class="sh-sub">Compromisos sin confirmar</h4><div class="comp-l">${pend.map(t=>`<div class="comp-i niv${t.seg?.nivel||1}"><div class="grow"><b>${esc(t.titulo)}</b><small>${capital(Coach.cuandoTxt(t))}${t.seg?.posp?` · pospuesta ${t.seg.posp}×`:""}</small></div><button type="button" class="ib sm ok" data-act="coachHecho" data-id="${t.id}">${ICON.check}</button><button type="button" class="ib sm" data-act="coachPosponer" data-id="${t.id}" data-v="60">${ICON.snooze}</button><button type="button" class="ib sm" data-act="coachReprogramar" data-id="${t.id}">${ICON.cal}</button></div>`).join("")}</div>`:""}
  <div class="avisos">${avisosMila().map(a=>`<div class="aviso-i"><span class="mila-mini">${milaSVG({emo:a.emo})}</span><div><p>${esc(a.t)}</p>${a.acc?`<div class="btns">${a.acc.map(([l,k,v])=>`<button type="button" class="btn sm" data-act="${k==="say"?"decir":k==="go"?"ir":"sheetOpen"}" data-v="${esc(v)}">${esc(l)}</button>`).join("")}</div>`:""}</div></div>`).join("")}</div>`; };
Object.assign(FORMS, {
  async fraseNueva(f, el){ const r=await A.frase({texto:f.texto, autor:f.autor, cat:f.cat, situacion:f.situacion}); el.reset(); toast(r.dup?r.resumen:"Frase guardada", {icon:ICON.quote, undo:r.log}); Mila.momento("carinosa"); render(); },
  async claudeMemPrev(f){ const items=partirMemoria(f.t); if(!items.length) return toast("No encontré datos en ese texto."); abrirSheet("claudeMem", {items}); },
  async claudeMemGuardar(f){ let n=0; for(const [k,v] of Object.entries(f)){ if(!/^i\d+$/.test(k) || !v) continue; const t=f["t"+k.slice(1)]; if(!t) continue; const r=await A.recordar({texto:t, tipo:"hecho", area:"", fuente:"Memoria de Claude"}); if(!r.dup) n++; }
    cerrarSheet(); toast(`Guardé ${plural(n,"dato","datos")} de la memoria de Claude`, {icon:ICON.brain}); Mila.momento("animada"); if(S.route!=="memoria") go("memoria"); else render(); },
  async revisar(f){ const items=(S.ui.revisar||[]).filter((_,i)=>f["i"+i]); if(!items.length){ cerrarSheet(); return toast("No seleccionaste nada."); }
    const b=$("#sheet [type=submit]"); if(b) b.textContent="Guardando…";
    const r=await importarItems(items); cerrarSheet(); Mila.celebrar();
    toast(`Listo: ${Object.entries(r.cuenta).map(([t,n])=>`${n} ${(NOMBRE_TIPO[t]||t).toLowerCase()}`).join(", ")||"nada nuevo"}`, {icon:ICON.check, ms:6000}); reShell(); },
  async cicloPin(f){ const ok = (await sha(f.pin||""))===S.profile.ciclo?.pin; if(!ok){ haptic([40,40,40]); return toast("PIN incorrecto", {icon:ICON.lock}); } S.cicloUI.abierto=true; render(true); },
  async cicloDia(f, el){ const fecha=el.dataset.fecha; const sintomas=Object.keys(f).filter(k=>k.startsWith("s_") && f[k]).map(k=>k.slice(2));
    const r=await A.cicloDia(fecha, {flujo:Number(f.flujo||0), dolor:Number(f.dolor||0), energia:f.energia?Number(f.energia):null, animo:f.animo||"", sintomas, nota:f.nota||""});
    if(Number(f.flujo)>=1 && !diaEnPeriodo(fecha)){ const p=await A.periodoInicio(fecha); if(!p.dup) toast("También registré el inicio de tu periodo", {icon:ICON.drop}); }
    cerrarSheet(); toast(r.resumen, {undo:r.log, icon:ICON.drop}); render(); },
  async periodo(f, el){ const id=el.dataset.id; if(id){ const r=await A.editarPeriodo(id, {inicio:f.inicio, fin:f.fin||"", notas:f.notas||""}); toast(r.resumen, {undo:r.log}); }
    else { const r=await A.periodoInicio(f.inicio); if(r.id && (f.fin||f.notas)) await A.editarPeriodo(r.id, {fin:f.fin||"", notas:f.notas||""}); toast(r.resumen); } cerrarSheet(); render(); },
  async cicloAjustes(f){ const c={...S.profile.ciclo}; c.recordar=!!f.recordar; c.diasAntes=clamp(Number(f.diasAntes)||0,0,7); c.mostrarTexto=!!f.mostrarTexto; c.sync=!!f.sync; c.enInicio=!!f.enInicio;
    if(f.quitarPin) c.pin=""; else if(f.pin){ if(!/^\d{4,8}$/.test(f.pin)) return toast("El PIN debe tener de 4 a 8 números."); c.pin=await sha(f.pin); S.cicloUI.abierto=true; }
    await Store.saveProfile({ciclo:c}); aplicarSyncCiclo(); if(c.recordar && "Notification" in window && Notification.permission==="default") Notification.requestPermission().catch(()=>{});
    cerrarSheet(); toast("Privacidad de Mi ciclo guardada", {icon:ICON.shield}); render(true); },
  async cicloBorrar(f){ if(String(f.c).trim().toUpperCase()!=="BORRAR") return toast("Escribe BORRAR para confirmar."); const r=await A.borrarCicloTodo(); cerrarSheet(); toast(r.resumen, {icon:ICON.trash}); render(true); },
  async fuenteConectar(f, el){ const id=Fuentes.idDe(f.link); if(!id) return toast("Ese enlace no parece de Google Sheets."); await Store.saveProfile({fuentes:{...S.profile.fuentes, [el.dataset.k]:id}});
    toast("Hoja conectada (solo lectura)", {icon:ICON.sheet}); if(window.MilaApp?.Google?.valido()) await Fuentes.leer(el.dataset.k).catch(e=>toast(errMsg(e))); render(); },
  async coachAjustes(f){ const c={...Coach.cfg(), activo:!!f.activo, estricto:!!f.estricto, sistema:!!f.sistema, celular:!!f.celular,
      intervalos:[clamp(Number(f.i1)||30,5,600), clamp(Number(f.i2)||60,5,600), clamp(Number(f.i3)||120,10,1440)], maxDia:clamp(Number(f.maxDia)||8,1,40), gracia:clamp(Number(f.gracia)||0,0,240)};
    await Store.saveProfile({ajustes:{coach:c, silencioDesde:f.silDesde||"23:00", silencioHasta:f.silHasta||"07:00"}});
    if(c.sistema && "Notification" in window && Notification.permission==="default") Notification.requestPermission().catch(()=>{});
    cerrarSheet(); toast(c.estricto?"Guardado. Modo entrenadora estricta activo 😤":"Seguimiento guardado", {icon:ICON.whistle}); Mila.momento(c.estricto?"enojada":"alegre", 2400, c.estricto?"enojada":"idle"); render(true); }
});
